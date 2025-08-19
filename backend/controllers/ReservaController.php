<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../models/Reserva.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$reserva = new Reserva($db);

// Obtener todas las reservas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
        // Obtener reservas por rango de fechas
        $fecha_inicio = $_GET['fecha_inicio'];
        $fecha_fin = $_GET['fecha_fin'];

        $stmt = $reserva->obtenerPorRangoFechas($fecha_inicio, $fecha_fin);
    } else if (isset($_GET['id'])) {
        // Obtener reserva por ID
        $stmt = $reserva->obtenerPorId($_GET['id']);
    } else {
        // Obtener todas las reservas
        $stmt = $reserva->obtenerTodas();
    }

    $reservas_arr = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
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
            "hora_ingreso" => $row['hora_ingreso'],
            "hora_salida" => $row['hora_salida'],
            "importe_total" => (float)$row['importe_total'],
            "notas" => $row['notas'],
            "fecha_creacion" => $row['fecha_creacion']
        );

        if (isset($row['contacto_telefono'])) {
            $reserva_item['contacto_telefono'] = $row['contacto_telefono'];
            $reserva_item['contacto_email'] = $row['contacto_email'];
            $reserva_item['sala_descripcion'] = $row['sala_descripcion'];
        }

        array_push($reservas_arr, $reserva_item);
    }

    http_response_code(200);
    echo json_encode($reservas_arr);
}

// Crear nueva reserva
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->cliente_id) &&
        !empty($data->sala_id) &&
        !empty($data->fecha_reserva) &&
        !empty($data->hora_inicio) &&
        !empty($data->hora_fin)
    ) {
        // Verificar disponibilidad
        $disponible = $reserva->verificarDisponibilidad(
            $data->sala_id,
            $data->fecha_reserva,
            $data->hora_inicio,
            $data->hora_fin
        );

        if (!$disponible) {
            http_response_code(400);
            echo json_encode(array("message" => "La sala no está disponible en ese horario"));
            exit;
        }

        // Calcular horas reservadas e importe
        $hora_inicio = new DateTime($data->hora_inicio);
        $hora_fin = new DateTime($data->hora_fin);
        $diff = $hora_inicio->diff($hora_fin);
        $horas_reservadas = $diff->h + ($diff->i / 60);

        // Obtener tarifa de la sala (deberías tener este dato)
        $tarifa_query = "SELECT tarifa_hora FROM salas WHERE id = :sala_id";
        $tarifa_stmt = $db->prepare($tarifa_query);
        $tarifa_stmt->bindParam(":sala_id", $data->sala_id);
        $tarifa_stmt->execute();
        $tarifa = $tarifa_stmt->fetch(PDO::FETCH_ASSOC)['tarifa_hora'];

        $importe_total = $horas_reservadas * $tarifa;

        // Asignar propiedades
        $reserva->cliente_id = $data->cliente_id;
        $reserva->sala_id = $data->sala_id;
        $reserva->usuario_id = $data->usuario_id; // Desde el token en producción
        $reserva->fecha_reserva = $data->fecha_reserva;
        $reserva->hora_inicio = $data->hora_inicio;
        $reserva->hora_fin = $data->hora_fin;
        $reserva->horas_reservadas = $horas_reservadas;
        $reserva->estado = $data->estado ?? 'pendiente';
        $reserva->importe_total = $importe_total;
        $reserva->notas = $data->notas ?? '';

        // Crear reserva
        if ($reserva->crear()) {
            http_response_code(201);
            echo json_encode(array("message" => "Reserva creada exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo crear la reserva"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Datos incompletos"));
    }
}
