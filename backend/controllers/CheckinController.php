<?php
// Establecer Content-Type JSON inmediatamente
header('Content-Type: application/json');

include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Reserva.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$reserva = new Reserva($db);

// Registrar ingreso (check-in)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'checkin') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->id)) {
        if ($reserva->registrarIngreso($data->id)) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Check-in registrado exitosamente",
                "hora_ingreso" => date('Y-m-d H:i:s')
            ));
        } else {
            http_response_code(400);
            echo json_encode(array(
                "success" => false,
                "message" => "No se pudo registrar el check-in. La reserva no está pendiente o ya fue registrada."
            ));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "ID de reserva no proporcionado"));
    }
}

// Registrar salida (check-out)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'checkout') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->id)) {
        if ($reserva->registrarSalida($data->id)) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Check-out registrado exitosamente",
                "hora_salida" => date('Y-m-d H:i:s')
            ));
        } else {
            http_response_code(400);
            echo json_encode(array(
                "success" => false,
                "message" => "No se pudo registrar el check-out. La reserva no está en curso."
            ));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "ID de reserva no proporcionado"));
    }
}

// Obtener reservas de hoy
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'hoy') {
    $stmt = $reserva->obtenerReservasHoy();
    $reservas_arr = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reserva_item = array(
            "id" => $row['id'],
            "cliente_nombre" => $row['cliente_nombre'],
            "contacto_nombre" => $row['contacto_nombre'],
            "sala_nombre" => $row['sala_nombre'],
            "fecha_reserva" => $row['fecha_reserva'],
            "hora_inicio" => $row['hora_inicio'],
            "hora_fin" => $row['hora_fin'],
            "estado_actual" => $row['estado_actual'],
            "hora_ingreso" => $row['hora_ingreso'],
            "hora_salida" => $row['hora_salida'],
            "notas" => $row['notas']
        );
        
        array_push($reservas_arr, $reserva_item);
    }

    http_response_code(200);
    echo json_encode($reservas_arr);
}
?>