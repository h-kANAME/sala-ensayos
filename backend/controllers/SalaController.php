<?php
// header('Access-Control-Allow-Origin: http://localhost:3000');
// header('Content-Type: application/json');
// header('Access-Control-Allow-Methods: GET, OPTIONS');
// header('Access-Control-Allow-Headers: Authorization, Content-Type');

include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../models/Sala.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$sala = new Sala($db);

// Obtener todas las salas activas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Obtener sala por ID
        $stmt = $sala->obtenerPorId($_GET['id']);
        $sala_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($sala_data) {
            http_response_code(200);
            echo json_encode($sala_data);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Sala no encontrada"));
        }
    } else {
        // Obtener todas las salas
        $stmt = $sala->obtenerTodas();
        $salas_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($salas_arr, $row);
        }

        http_response_code(200);
        echo json_encode($salas_arr);
    }
}
?>