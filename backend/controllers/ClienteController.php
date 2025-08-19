<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../models/Cliente.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$database = new Database();
$db = $database->getConnection();

$cliente = new Cliente($db);

// Obtener todos los clientes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Obtener cliente por ID
        $stmt = $cliente->obtenerPorId($_GET['id']);
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
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id) && !empty($data->nombre_banda) && !empty($data->contacto_nombre)) {
        $cliente->id = $data->id;
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
        echo json_encode(array("message" => "Datos incompletos"));
    }
}

// Eliminar cliente
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id)) {
        if ($cliente->eliminar($data->id)) {
            http_response_code(200);
            echo json_encode(array("message" => "Cliente eliminado exitosamente"));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo eliminar el cliente"));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "ID no proporcionado"));
    }
}
?>