<?php
// Establecer Content-Type JSON inmediatamente
header('Content-Type: application/json');

// header('Access-Control-Allow-Origin: http://localhost:3000');
// header('Content-Type: application/json');
// header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
// header('Access-Control-Allow-Headers: Authorization, Content-Type');

include_once __DIR__ . '/../config/cors.php';
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Cliente.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$cliente = new Cliente($db);

// Obtener todos los clientes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener ID de la URL si existe (formato REST: /clientes/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace('/public/api', '', $path);
    $segments = explode('/', trim($path, '/'));
    
    // El ID estaría en el segundo segmento: ['clientes', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    if ($id) {
        // Obtener cliente por ID
        $stmt = $cliente->obtenerPorId($id);
        $cliente_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($cliente_data) {
            http_response_code(200);
            echo json_encode($cliente_data);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Cliente no encontrado"));
        }
    } else {
        // Obtener todos los clientes
        $stmt = $cliente->obtenerTodos();
        $clientes_arr = array();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($clientes_arr, $row);
        }

        http_response_code(200);
        echo json_encode($clientes_arr);
    }
}

// Crear nuevo cliente
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->nombre_banda) &&
        !empty($data->contacto_nombre)
    ) {
        $cliente->nombre_banda = $data->nombre_banda;
        $cliente->contacto_nombre = $data->contacto_nombre;
        $cliente->contacto_email = $data->contacto_email ?? '';
        $cliente->contacto_telefono = $data->contacto_telefono ?? '';
        $cliente->direccion = $data->direccion ?? '';
        $cliente->notas = $data->notas ?? '';
        $cliente->activo = 1;

        if ($cliente->crear()) {
            http_response_code(201);
            echo json_encode(array("message" => "Cliente creado exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo crear el cliente"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Datos incompletos"));
    }
}

// Actualizar cliente
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Obtener ID de la URL (formato REST: /clientes/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace('/public/api', '', $path);
    $segments = explode('/', trim($path, '/'));
    
    // El ID debería estar en el segundo segmento: ['clientes', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    $data = json_decode(file_get_contents("php://input"));

    if ($id && !empty($data->nombre_banda) && !empty($data->contacto_nombre)) {
        $cliente->id = $id;
        $cliente->nombre_banda = $data->nombre_banda;
        $cliente->contacto_nombre = $data->contacto_nombre;
        $cliente->contacto_email = $data->contacto_email ?? '';
        $cliente->contacto_telefono = $data->contacto_telefono ?? '';
        $cliente->direccion = $data->direccion ?? '';
        $cliente->notas = $data->notas ?? '';
        $cliente->activo = $data->activo ?? 1;

        if ($cliente->actualizar()) {
            http_response_code(200);
            echo json_encode(array("message" => "Cliente actualizado exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo actualizar el cliente"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Datos incompletos o ID no proporcionado"));
    }
}

// Eliminar cliente
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Obtener ID de la URL (formato REST: /clientes/123)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace('/public/api', '', $path);
    $segments = explode('/', trim($path, '/'));
    
    // El ID debería estar en el segundo segmento: ['clientes', '123']
    $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
    
    if ($id) {
        if ($cliente->eliminar($id)) {
            http_response_code(200);
            echo json_encode(array("message" => "Cliente eliminado exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo eliminar el cliente"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "ID no proporcionado o inválido"));
    }
}
?>