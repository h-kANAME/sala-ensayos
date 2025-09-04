<?php
// Establecer Content-Type JSON inmediatamente
header('Content-Type: application/json');

include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Tarifa.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$tarifa = new Tarifa($db);

// Obtener todas las tarifas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener ID de la URL si existe (formato REST: /tarifas/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    // Remover prefijos dependiendo del entorno
    $path = str_replace('/public/api', '', $path);        // Para desarrollo local
    $path = str_replace('/sala-ensayos/api', '', $path);  // Para producción
    $segments = explode('/', trim($path, '/'));
    
    // Verificar si es una petición de estadísticas
    if (isset($segments[1]) && $segments[1] === 'estadisticas') {
        // Endpoint: /tarifas/estadisticas
        try {
            $resumen = $tarifa->obtenerResumenEstadisticas()->fetch(PDO::FETCH_ASSOC);
            
            $estadisticasPorTipo_stmt = $tarifa->obtenerEstadisticasPorTipo();
            $estadisticasPorTipo = array();
            while ($row = $estadisticasPorTipo_stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($estadisticasPorTipo, $row);
            }
            
            $distribucionDuraciones_stmt = $tarifa->obtenerDistribucionDuraciones();
            $distribucionDuraciones = array();
            while ($row = $distribucionDuraciones_stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($distribucionDuraciones, $row);
            }
            
            $tendenciasMensuales_stmt = $tarifa->obtenerTendenciasMensuales();
            $tendenciasMensuales = array();
            while ($row = $tendenciasMensuales_stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($tendenciasMensuales, $row);
            }
            
            http_response_code(200);
            echo json_encode(array(
                'resumen' => $resumen,
                'estadisticasPorTipo' => $estadisticasPorTipo,
                'distribucionDuraciones' => $distribucionDuraciones,
                'tendenciasMensuales' => $tendenciasMensuales
            ));
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Error obteniendo estadísticas: " . $e->getMessage()));
        }
    } else {
        // El ID estaría en el segundo segmento: ['tarifas', '123']
        $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
        
        if ($id) {
            // Obtener tarifa por ID
            $stmt = $tarifa->obtenerPorId($id);
            $tarifa_data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($tarifa_data) {
                http_response_code(200);
                echo json_encode($tarifa_data);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Tarifa no encontrada"));
            }
        } else {
            // Obtener todas las tarifas
            $stmt = $tarifa->obtenerTodas();
            $tarifas_arr = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($tarifas_arr, $row);
            }

            http_response_code(200);
            echo json_encode($tarifas_arr);
        }
    }
}

// Crear nueva tarifa
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->tipo_agrupacion) &&
        isset($data->duracion_min)
    ) {
        $tarifa->tipo_agrupacion = $data->tipo_agrupacion;
        $tarifa->duracion_min = $data->duracion_min;
        $tarifa->duracion_max = $data->duracion_max ?? null;
        $tarifa->precio_fijo = $data->precio_fijo ?? null;
        $tarifa->precio_por_hora = $data->precio_por_hora ?? null;
        $tarifa->activo = 1;

        if ($tarifa->crear()) {
            http_response_code(201);
            echo json_encode(array("success" => true, "message" => "Tarifa creada exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "No se pudo crear la tarifa"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Datos incompletos"));
    }
}

// Actualizar tarifa
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Obtener ID de la URL
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace('/public/api', '', $path);
    $path = str_replace('/sala-ensayos/api', '', $path);
    $segments = explode('/', trim($path, '/'));
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "ID de tarifa requerido"));
        exit;
    }

    if (
        !empty($data->tipo_agrupacion) &&
        isset($data->duracion_min)
    ) {
        $tarifa->id_tarifa = $id;
        $tarifa->tipo_agrupacion = $data->tipo_agrupacion;
        $tarifa->duracion_min = $data->duracion_min;
        $tarifa->duracion_max = $data->duracion_max ?? null;
        $tarifa->precio_fijo = $data->precio_fijo ?? null;
        $tarifa->precio_por_hora = $data->precio_por_hora ?? null;

        if ($tarifa->actualizar()) {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Tarifa actualizada exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "No se pudo actualizar la tarifa"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Datos incompletos"));
    }
}

// Eliminar tarifa
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Obtener ID de la URL
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace('/public/api', '', $path);
    $path = str_replace('/sala-ensayos/api', '', $path);
    $segments = explode('/', trim($path, '/'));
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "ID de tarifa requerido"));
        exit;
    }

    $tarifa->id_tarifa = $id;
    
    if ($tarifa->eliminar()) {
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "Tarifa eliminada exitosamente"));
    } else {
        http_response_code(503);
        echo json_encode(array("success" => false, "message" => "No se pudo eliminar la tarifa"));
    }
}
?>