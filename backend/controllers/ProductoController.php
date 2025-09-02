<?php
// Incluir configuración CORS
include_once __DIR__ . '/../config/cors.php';

// Solo continuar si no es preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Producto.php';

// Analizar la URL para extraer el ID si existe
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remover prefijos dependiendo del entorno
$path = str_replace('/public/api', '', $path);        // Para desarrollo local
$path = str_replace('/sala-ensayos/api', '', $path);  // Para producción

$segments = explode('/', trim($path, '/'));

// DEBUG: URL parsing para productos
error_log('ProductoController DEBUG - URI: ' . $uri);
error_log('ProductoController DEBUG - Path limpio: ' . $path);
error_log('ProductoController DEBUG - Segments: ' . print_r($segments, true));

// Extraer ID si está presente en la URL
$id = null;
$action = null;

if (isset($segments[1]) && is_numeric($segments[1])) {
    $id = intval($segments[1]);
} elseif (isset($segments[1]) && $segments[1] === 'stock') {
    $action = 'stock';
    if (isset($segments[2]) && is_numeric($segments[2])) {
        $id = intval($segments[2]);
    }
} elseif (isset($segments[1]) && $segments[1] === 'buscar') {
    $action = 'buscar';
}

// DEBUG: Valores finales
error_log('ProductoController DEBUG - Action: ' . ($action ?? 'NULL'));
error_log('ProductoController DEBUG - ID: ' . ($id ?? 'NULL'));

$database = new Database();
$db = $database->getConnection();
$producto = new Producto($db);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($action === 'buscar') {
            // Buscar productos por término
            $termino = $_GET['q'] ?? '';
            if (empty($termino)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Término de búsqueda requerido']);
                exit;
            }
            
            try {
                $stmt = $producto->buscarPorNombre($termino);
                $productos = [];
                
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    extract($row);
                    $producto_item = array(
                        'id' => $id,
                        'nombre' => $nombre,
                        'descripcion' => $descripcion,
                        'categoria' => $categoria,
                        'precio' => floatval($precio),
                        'stock' => intval($stock),
                        'stock_minimo' => intval($stock_minimo),
                        'activo' => boolval($activo),
                        'fecha_creacion' => $fecha_creacion
                    );
                    array_push($productos, $producto_item);
                }
                
                echo json_encode($productos);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error en búsqueda: ' . $e->getMessage()]);
            }
            
        } elseif ($id) {
            // DEBUG: Obtener producto por ID
            error_log('ProductoController GET BY ID - ID recibido: ' . $id);
            
            // Obtener producto específico por ID
            try {
                $stmt = $producto->obtenerPorId($id);
                if ($stmt->rowCount() > 0) {
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    extract($row);
                    
                    $producto_item = array(
                        'id' => $id,
                        'nombre' => $nombre,
                        'descripcion' => $descripcion,
                        'categoria' => $categoria,
                        'precio' => floatval($precio),
                        'stock' => intval($stock),
                        'stock_minimo' => intval($stock_minimo),
                        'activo' => boolval($activo),
                        'fecha_creacion' => $fecha_creacion
                    );
                    
                    echo json_encode($producto_item);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error obteniendo producto: ' . $e->getMessage()]);
            }
            
        } else {
            // Obtener todos los productos
            try {
                $stmt = $producto->obtenerTodos();
                $productos = [];
                
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    extract($row);
                    $producto_item = array(
                        'id' => $id,
                        'nombre' => $nombre,
                        'descripcion' => $descripcion,
                        'categoria' => $categoria,
                        'precio' => floatval($precio),
                        'stock' => intval($stock),
                        'stock_minimo' => intval($stock_minimo),
                        'activo' => boolval($activo),
                        'fecha_creacion' => $fecha_creacion
                    );
                    array_push($productos, $producto_item);
                }
                
                echo json_encode($productos);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error obteniendo productos: ' . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Obtener datos del cuerpo de la petición
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($action === 'stock' && $id) {
            // Actualizar stock (sumar cantidad)
            if (!isset($data['cantidad']) || !is_numeric($data['cantidad'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Cantidad requerida y debe ser numérica']);
                exit;
            }

            try {
                $cantidad = intval($data['cantidad']);
                if ($producto->actualizarStock($id, $cantidad)) {
                    echo json_encode(['success' => true, 'message' => 'Stock actualizado correctamente']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error actualizando stock']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error actualizando stock: ' . $e->getMessage()]);
            }

        } else {
            // Crear nuevo producto
            if (empty($data['nombre']) || empty($data['categoria']) || !isset($data['precio'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                exit;
            }

            try {
                $producto->nombre = $data['nombre'];
                $producto->descripcion = $data['descripcion'] ?? '';
                $producto->categoria = $data['categoria'];
                $producto->precio = floatval($data['precio']);
                $producto->stock = intval($data['stock'] ?? 0);
                $producto->stock_minimo = intval($data['stock_minimo'] ?? 0);
                $producto->activo = isset($data['activo']) ? boolval($data['activo']) : true;

                $newId = $producto->crear();
                if ($newId) {
                    http_response_code(201);
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Producto creado exitosamente',
                        'id' => $newId
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error creando producto']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error creando producto: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de producto requerido']);
            exit;
        }

        // Obtener datos del cuerpo de la petición
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (empty($data['nombre']) || empty($data['categoria']) || !isset($data['precio'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            exit;
        }

        try {
            $producto->nombre = $data['nombre'];
            $producto->descripcion = $data['descripcion'] ?? '';
            $producto->categoria = $data['categoria'];
            $producto->precio = floatval($data['precio']);
            $producto->stock = intval($data['stock'] ?? 0);
            $producto->stock_minimo = intval($data['stock_minimo'] ?? 0);
            $producto->activo = isset($data['activo']) ? boolval($data['activo']) : true;

            if ($producto->actualizar($id)) {
                echo json_encode(['success' => true, 'message' => 'Producto actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error actualizando producto']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error actualizando producto: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de producto requerido']);
            exit;
        }

        try {
            if ($producto->eliminar($id)) {
                echo json_encode(['success' => true, 'message' => 'Producto eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error eliminando producto']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error eliminando producto: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
?>