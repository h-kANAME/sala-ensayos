<?php
error_log("=== API INDEX.PHP LLAMADO ===");
error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'No definido'));

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener la ruta desde la URL
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

error_log("Path parseado: " . $path);

// Remover /public/api del path
$path = str_replace('/public/api', '', $path);
$path = trim($path, '/');

error_log("Path limpio: " . $path);

// Routing básico
switch(true) {
    case strpos($path, 'reservas') === 0:
        error_log("Redirigiendo a ReservaController");
        include_once '../../backend/controllers/ReservaController.php';
        break;
        
    case strpos($path, 'clientes') === 0:
        error_log("Redirigiendo a ClienteController");
        include_once '../../backend/controllers/ClienteController.php';
        break;
        
    case strpos($path, 'productos') === 0:
        error_log("Redirigiendo a ProductoController");
        include_once '../../backend/controllers/ProductoController.php';
        break;
        
    case strpos($path, 'salas') === 0:
        error_log("Redirigiendo a SalaController");
        include_once '../../backend/controllers/SalaController.php';
        break;
        
    case strpos($path, 'checkin') === 0:
        error_log("Redirigiendo a CheckinController");
        include_once '../../backend/controllers/CheckinController.php';
        break;
        
    case strpos($path, 'auth') === 0:
        error_log("Redirigiendo a login.php");
        include_once '../../backend/auth/login.php';
        break;
        
    default:
        error_log("Ruta no encontrada: " . $path);
        http_response_code(404);
        echo json_encode(array("message" => "Ruta no encontrada"));
        break;
}
?>