<?php
// header('Access-Control-Allow-Origin: http://localhost:3000');
// header('Content-Type: application/json');
// header('Access-Control-Allow-Methods: GET, OPTIONS');
// header('Access-Control-Allow-Headers: Authorization, Content-Type');

include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Sala.php';

// Establecer Content-Type JSON
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$sala = new Sala($db);

// Obtener todas las salas activas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener ID de la URL si existe (formato REST: /salas/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    // Remover prefijos dependiendo del entorno
    $path = str_replace('/public/api', '', $path);        // Para desarrollo local
    $path = str_replace('/sala-ensayos/api', '', $path);  // Para producción
    $segments = explode('/', trim($path, '/'));
    
    // El ID estaría en el segundo segmento: ['salas', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    if ($id) {
        // Obtener sala por ID
        $stmt = $sala->obtenerPorId($id);
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