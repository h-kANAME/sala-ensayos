<?php
// Establecer Content-Type JSON inmediatamente
header('Content-Type: application/json');

include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Reserva.php';

$database = new Database();
$db = $database->getConnection();

$reserva = new Reserva($db);

// Obtener todas las reservas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // DEBUG: Log para verificar que se está llamando
    error_log("ReservaController llamado - Método: GET");

    if (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
        // Obtener reservas por rango de fechas
        $fecha_inicio = $_GET['fecha_inicio'];
        $fecha_fin = $_GET['fecha_fin'];

        error_log("Obteniendo reservas desde: $fecha_inicio hasta: $fecha_fin");
        
        // Actualizar estados automáticamente antes de obtener las reservas
        $reserva->actualizarEstadosAutomaticos();

        $stmt = $reserva->obtenerPorRangoFechas($fecha_inicio, $fecha_fin);
    } else if (isset($_GET['id'])) {
        // Obtener reserva por ID
        $stmt = $reserva->obtenerPorId($_GET['id']);
    } else if (isset($_GET['sala_id']) && isset($_GET['fecha']) && 
              isset($_GET['hora_inicio']) && isset($_GET['hora_fin']) && 
              strpos($_SERVER['REQUEST_URI'], 'disponibilidad') !== false) {
        // Verificar disponibilidad
        $disponible = $reserva->verificarDisponibilidad(
            $_GET['sala_id'],
            $_GET['fecha'],
            $_GET['hora_inicio'],
            $_GET['hora_fin'],
            $_GET['excluir_id'] ?? null
        );

        http_response_code(200);
        echo json_encode(['disponible' => $disponible]);
        exit();
    } else if (isset($_GET['cliente_id']) && isset($_GET['fecha']) && 
              isset($_GET['hora_inicio']) && isset($_GET['hora_fin']) && 
              strpos($_SERVER['REQUEST_URI'], 'verificar-banda') !== false) {
        // Verificar conflicto de banda
        $conflictoBanda = $reserva->verificarConflictoBanda(
            $_GET['cliente_id'],
            $_GET['fecha'],
            $_GET['hora_inicio'],
            $_GET['hora_fin'],
            $_GET['excluir_id'] ?? null
        );

        http_response_code(200);
        echo json_encode($conflictoBanda);
        exit();
    } else {
        // Obtener todas las reservas
        error_log("Obteniendo TODAS las reservas");
        
        // Actualizar estados automáticamente antes de obtener las reservas
        $reserva->actualizarEstadosAutomaticos();
        
        $stmt = $reserva->obtenerTodas();
    }

    $reservas_arr = array();
    $row_count = 0;

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row_count++;

        // CONSTRUIR el array de reserva correctamente
        $reserva_item = array(
            "id" => $row['id'],
            "cliente_id" => $row['cliente_id'],
            "cliente_nombre" => $row['cliente_nombre'],
            "contacto_nombre" => $row['contacto_nombre'],
            "sala_id" => $row['sala_id'],
            "sala_nombre" => $row['sala_nombre'],
            "tarifa_hora" => (float)$row['tarifa_hora'],
            "fecha_reserva" => $row['fecha_reserva'],
            "hora_inicio" => $row['hora_inicio'],
            "hora_fin" => $row['hora_fin'],
            "horas_reservadas" => (int)$row['horas_reservadas'],
            "estado" => $row['estado'],
            "estado_actual" => $row['estado_actual'],
            "hora_ingreso" => $row['hora_ingreso'] ?? null,
            "hora_salida" => $row['hora_salida'] ?? null,
            "importe_total" => (float)$row['importe_total'],
            "notas" => $row['notas'],
            "fecha_creacion" => $row['fecha_creacion']
        );

        array_push($reservas_arr, $reserva_item);
    }

    error_log("Reservas encontradas: $row_count");

    http_response_code(200);
    echo json_encode($reservas_arr);
    exit();
}


// Crear nueva reserva
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    error_log("Creando nueva reserva - Método: POST");

    // AGREGADO: Debug del Content-Type
    error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'No definido'));
    
    // AGREGADO: Debug del raw input
    $raw_input = file_get_contents("php://input");
    error_log("Raw input: " . $raw_input);

    // Intentar diferentes métodos de captura de datos
    $data = null;

    // Método 1: JSON desde php://input
    if (!empty($raw_input)) {
        $data = json_decode($raw_input);
        error_log("Método 1 - JSON decode: " . print_r($data, true));
    }

    // Método 2: Si no hay datos en JSON, intentar con $_POST
    if (empty($data) && !empty($_POST)) {
        $data = (object) $_POST;
        error_log("Método 2 - $_POST: " . print_r($data, true));
    }

    // Método 3: Si es multipart/form-data, usar $_POST directamente
    if (empty($data) && isset($_SERVER['CONTENT_TYPE']) && 
        strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        $data = (object) $_POST;
        error_log("Método 3 - Multipart form data: " . print_r($data, true));
    }

    // AGREGADO: Verificación final de datos
    if (empty($data)) {
        error_log("ERROR: No se pudieron obtener datos del POST");
        http_response_code(400);
        echo json_encode(array("message" => "No se recibieron datos"));
        exit();
    }

    // DEBUG: Log de datos finalmente procesados
    error_log("Datos procesados: " . print_r($data, true));
                
    if (
        !empty($data->cliente_id) &&
        !empty($data->sala_id) &&
        !empty($data->fecha_reserva) &&
        !empty($data->hora_inicio) &&
        !empty($data->hora_fin)
    ) {
        // Verificar disponibilidad de la sala
        $disponible = $reserva->verificarDisponibilidad(
            $data->sala_id,
            $data->fecha_reserva,
            $data->hora_inicio,
            $data->hora_fin
        );

        error_log("Disponibilidad de sala: " . ($disponible ? "SÍ" : "NO"));

        if (!$disponible) {
            http_response_code(400);
            echo json_encode(array("message" => "La sala no está disponible en ese horario"));
            exit;
        }

        // Verificar conflicto de horarios para la misma banda
        $conflictoBanda = $reserva->verificarConflictoBanda(
            $data->cliente_id,
            $data->fecha_reserva,
            $data->hora_inicio,
            $data->hora_fin
        );

        if (!$conflictoBanda['sin_conflicto']) {
            http_response_code(400);
            echo json_encode(array("message" => "Esta banda ya tiene una reserva en ese horario: " . $conflictoBanda['reservas_conflicto']));
            exit;
        }

        // Calcular horas reservadas e importe
        $hora_inicio_obj = new DateTime($data->fecha_reserva . ' ' . $data->hora_inicio);
        $hora_fin_obj = new DateTime($data->fecha_reserva . ' ' . $data->hora_fin);
        
        // Si hora_fin es menor que hora_inicio, agregar un día
        if ($hora_fin_obj <= $hora_inicio_obj) {
            $hora_fin_obj->add(new DateInterval('P1D'));
        }
        
        $diff = $hora_inicio_obj->diff($hora_fin_obj);
        $horas_reservadas = $diff->h + ($diff->i / 60);

        error_log("Horas calculadas: $horas_reservadas");

        // Obtener tarifa de la sala
        $tarifa_query = "SELECT tarifa_hora FROM salas WHERE id = :sala_id";
        $tarifa_stmt = $db->prepare($tarifa_query);
        $tarifa_stmt->bindParam(":sala_id", $data->sala_id);
        $tarifa_stmt->execute();
        $tarifa_row = $tarifa_stmt->fetch(PDO::FETCH_ASSOC);
        
        // CORREGIDO: Verificar que se obtuvo la tarifa
        if (!$tarifa_row) {
            error_log("ERROR: No se encontró la sala con ID: " . $data->sala_id);
            http_response_code(400);
            echo json_encode(array("message" => "Sala no encontrada"));
            exit();
        }
        
        $tarifa = $tarifa_row['tarifa_hora'];
        $importe_total = $horas_reservadas * $tarifa;

        error_log("Tarifa: $tarifa, Importe total: $importe_total");

        // Asignar propiedades
        $reserva->cliente_id = $data->cliente_id;
        $reserva->sala_id = $data->sala_id;
        $reserva->usuario_id = $data->usuario_id ?? 1; // Default a usuario admin
        $reserva->fecha_reserva = $data->fecha_reserva;
        $reserva->hora_inicio = $data->hora_inicio;
        $reserva->hora_fin = $data->hora_fin;
        $reserva->horas_reservadas = $horas_reservadas;
        $reserva->estado = $data->estado ?? 'pendiente';
        $reserva->importe_total = $importe_total;
        $reserva->notas = $data->notas ?? '';
        $reserva->estado_actual = 'pendiente'; // Estado inicial para check-in

        // AGREGADO: Debug antes de crear
        error_log("Intentando crear reserva con datos:");
        error_log("Cliente ID: " . $reserva->cliente_id);
        error_log("Sala ID: " . $reserva->sala_id);
        error_log("Usuario ID: " . $reserva->usuario_id);

        // Crear reserva
        if ($reserva->crear()) {
            error_log("Reserva creada exitosamente");
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Reserva creada exitosamente",
                "importe_total" => $importe_total,
                "horas_reservadas" => $horas_reservadas
            ));
        } else {
            error_log("Error al crear reserva - Verificar método crear() en modelo Reserva");
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo crear la reserva"));
        }
    } else {
        error_log("Datos incompletos recibidos");
        error_log("cliente_id: " . ($data->cliente_id ?? 'VACÍO'));
        error_log("sala_id: " . ($data->sala_id ?? 'VACÍO'));
        error_log("usuario_id: " . ($data->usuario_id ?? 'VACÍO'));
        error_log("fecha_reserva: " . ($data->fecha_reserva ?? 'VACÍO'));
        error_log("hora_inicio: " . ($data->hora_inicio ?? 'VACÍO'));
        error_log("hora_fin: " . ($data->hora_fin ?? 'VACÍO'));
        
        http_response_code(400);
        echo json_encode(array("message" => "Datos incompletos"));
    }
    exit();
}

// Actualizar reserva
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    error_log("Actualizando reserva - Método: PUT");
    
    // Obtener ID de la URL (formato REST: /reservas/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    // Remover prefijos dependiendo del entorno
    $path = str_replace('/public/api', '', $path);        // Para desarrollo local
    $path = str_replace('/sala-ensayos/api', '', $path);  // Para producción
    $segments = explode('/', trim($path, '/'));
    
    // El ID debería estar en el segundo segmento: ['reservas', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("message" => "ID de reserva no proporcionado"));
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->cliente_id) && !empty($data->sala_id) && !empty($data->fecha_reserva) && 
        !empty($data->hora_inicio) && !empty($data->hora_fin)) {
        
        // Verificar disponibilidad de la sala (excluyendo la reserva actual)
        $disponible = $reserva->verificarDisponibilidad(
            $data->sala_id,
            $data->fecha_reserva,
            $data->hora_inicio,
            $data->hora_fin,
            $id // Excluir la reserva actual
        );

        error_log("Disponibilidad de sala para actualización: " . ($disponible ? "SÍ" : "NO"));

        if (!$disponible) {
            http_response_code(400);
            echo json_encode(array("message" => "La sala no está disponible en ese horario"));
            exit;
        }

        // Verificar conflicto de horarios para la misma banda (excluyendo la reserva actual)
        $conflictoBanda = $reserva->verificarConflictoBanda(
            $data->cliente_id,
            $data->fecha_reserva,
            $data->hora_inicio,
            $data->hora_fin,
            $id // Excluir la reserva actual
        );

        if (!$conflictoBanda['sin_conflicto']) {
            http_response_code(400);
            echo json_encode(array("message" => "Esta banda ya tiene una reserva en ese horario: " . $conflictoBanda['reservas_conflicto']));
            exit;
        }
        
        // Calcular horas reservadas e importe
        $hora_inicio_obj = new DateTime($data->fecha_reserva . ' ' . $data->hora_inicio);
        $hora_fin_obj = new DateTime($data->fecha_reserva . ' ' . $data->hora_fin);
        
        if ($hora_fin_obj <= $hora_inicio_obj) {
            $hora_fin_obj->add(new DateInterval('P1D'));
        }
        
        $diff = $hora_inicio_obj->diff($hora_fin_obj);
        $horas_reservadas = $diff->h + ($diff->i / 60);
        
        // Obtener tarifa de la sala
        $tarifa_query = "SELECT tarifa_hora FROM salas WHERE id = :sala_id";
        $tarifa_stmt = $db->prepare($tarifa_query);
        $tarifa_stmt->bindParam(":sala_id", $data->sala_id);
        $tarifa_stmt->execute();
        $tarifa_row = $tarifa_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tarifa_row) {
            http_response_code(400);
            echo json_encode(array("message" => "Sala no encontrada"));
            exit();
        }
        
        $tarifa = $tarifa_row['tarifa_hora'];
        $importe_total = $horas_reservadas * $tarifa;
        
        // Asignar propiedades
        $reserva->id = $id;
        $reserva->cliente_id = $data->cliente_id;
        $reserva->sala_id = $data->sala_id;
        $reserva->usuario_id = $data->usuario_id ?? 1;
        $reserva->fecha_reserva = $data->fecha_reserva;
        $reserva->hora_inicio = $data->hora_inicio;
        $reserva->hora_fin = $data->hora_fin;
        $reserva->horas_reservadas = $horas_reservadas;
        $reserva->estado = $data->estado ?? 'pendiente';
        $reserva->importe_total = $importe_total;
        $reserva->notas = $data->notas ?? '';
        
        if ($reserva->actualizar()) {
            error_log("Reserva actualizada exitosamente");
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Reserva actualizada exitosamente",
                "importe_total" => $importe_total,
                "horas_reservadas" => $horas_reservadas
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo actualizar la reserva"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Datos incompletos"));
    }
    exit();
}

// Eliminar reserva
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    error_log("Eliminando reserva - Método: DELETE");
    
    // Obtener ID de la URL (formato REST: /reservas/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    // Remover prefijos dependiendo del entorno
    $path = str_replace('/public/api', '', $path);        // Para desarrollo local
    $path = str_replace('/sala-ensayos/api', '', $path);  // Para producción
    $segments = explode('/', trim($path, '/'));
    
    // El ID debería estar en el segundo segmento: ['reservas', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    if ($id) {
        try {
            if ($reserva->eliminar($id)) {
                error_log("Reserva eliminada exitosamente");
                http_response_code(200);
                echo json_encode(array("success" => true, "message" => "Reserva eliminada exitosamente"));
            } else {
                http_response_code(503);
                echo json_encode(array("success" => false, "message" => "No se pudo eliminar la reserva"));
            }
        } catch (Exception $e) {
            error_log("Error eliminando reserva: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => $e->getMessage()));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "ID no proporcionado o inválido"));
    }
    exit();
}

http_response_code(405);
echo json_encode(array("message" => "Método no permitido"));
?>