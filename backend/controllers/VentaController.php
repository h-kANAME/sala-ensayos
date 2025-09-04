<?php
// Incluir configuración CORS
include_once __DIR__ . '/../config/cors.php';

// Solo continuar si no es preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../models/Venta.php';

// Analizar la URL para extraer el ID si existe
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remover prefijos dependiendo del entorno
$path = str_replace('/public/api', '', $path);        // Para desarrollo local
$path = str_replace('/sala-ensayos/api', '', $path);  // Para producción

$segments = explode('/', trim($path, '/'));

// DEBUG: URL parsing
error_log('VentaController URL PARSING - URI: ' . $uri);
error_log('VentaController URL PARSING - Path: ' . $path);
error_log('VentaController URL PARSING - Segments: ' . print_r($segments, true));

// Extraer ID si está presente en la URL
$id = null;
$action = null;

if (isset($segments[1]) && is_numeric($segments[1])) {
    $id = intval($segments[1]);
} elseif (isset($segments[1]) && $segments[1] === 'anular') {
    $action = 'anular';
    if (isset($segments[2]) && is_numeric($segments[2])) {
        $id = intval($segments[2]);
    }
} elseif (isset($segments[1]) && $segments[1] === 'verificar-stock') {
    $action = 'verificar-stock';
} elseif (isset($segments[1]) && $segments[1] === 'items') {
    $action = 'items';
    if (isset($segments[2]) && is_numeric($segments[2])) {
        $id = intval($segments[2]);
    }
}

// DEBUG: Final values
error_log('VentaController FINAL VALUES - action: ' . ($action ?? 'NULL'));
error_log('VentaController FINAL VALUES - id: ' . ($id ?? 'NULL'));

$database = new Database();
$db = $database->getConnection();
$venta = new Venta($db);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($action === 'items' && $id) {
            // Obtener items de una venta específica
            try {
                $stmt = $venta->obtenerItems($id);
                $items = [];
                
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    extract($row);
                    $item = array(
                        'id' => $id,
                        'venta_id' => $venta_id,
                        'producto_id' => $producto_id,
                        'producto_nombre' => $producto_nombre,
                        'producto_descripcion' => $producto_descripcion,
                        'cantidad' => intval($cantidad),
                        'precio_unitario' => floatval($precio_unitario),
                        'subtotal' => floatval($subtotal)
                    );
                    array_push($items, $item);
                }
                
                echo json_encode($items);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error obteniendo items: ' . $e->getMessage()]);
            }
            
        } elseif ($id) {
            // Obtener venta específica por ID
            try {
                $stmt = $venta->obtenerPorId($id);
                if ($stmt->rowCount() > 0) {
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    extract($row);
                    
                    $venta_item = array(
                        'id' => $id,
                        'cliente_id' => $cliente_id,
                        'cliente_nombre' => $cliente_nombre,
                        'cliente_apellido' => $cliente_apellido,
                        'usuario_id' => $usuario_id,
                        'usuario_nombre' => $usuario_nombre,
                        'fecha_venta' => $fecha_venta,
                        'total' => floatval($total),
                        'tipo_pago' => $tipo_pago,
                        'monto_efectivo' => isset($monto_efectivo) ? floatval($monto_efectivo) : null,
                        'monto_transferencia' => isset($monto_transferencia) ? floatval($monto_transferencia) : null,
                        'notas' => $notas,
                        'anulada' => boolval($anulada)
                    );
                    
                    echo json_encode($venta_item);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Venta no encontrada']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error obteniendo venta: ' . $e->getMessage()]);
            }
            
        } else {
            // Obtener ventas con filtros
            try {
                $filtros = [];
                
                // Recoger filtros desde parámetros GET
                if (isset($_GET['fecha_inicio'])) $filtros['fecha_inicio'] = $_GET['fecha_inicio'];
                if (isset($_GET['fecha_fin'])) $filtros['fecha_fin'] = $_GET['fecha_fin'];
                if (isset($_GET['tipo_pago']) && $_GET['tipo_pago'] !== '') $filtros['tipo_pago'] = $_GET['tipo_pago'];
                if (isset($_GET['anulada'])) $filtros['anulada'] = $_GET['anulada'] === 'true';
                if (isset($_GET['cliente']) && $_GET['cliente'] !== '') $filtros['cliente'] = $_GET['cliente'];
                if (isset($_GET['usuario_id']) && $_GET['usuario_id'] !== '') $filtros['usuario_id'] = $_GET['usuario_id'];
                
                // Parámetros de paginación
                if (isset($_GET['pagina'])) $filtros['pagina'] = intval($_GET['pagina']);
                if (isset($_GET['limite'])) $filtros['limite'] = intval($_GET['limite']);
                
                // Si no hay filtros específicos, usar obtenerTodas() 
                if (empty($filtros)) {
                    $stmt = $venta->obtenerTodas();
                    $ventas = [];
                    $contador = 0;
                    
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        extract($row);
                        $venta_item = array(
                            'id' => $id,
                            'cliente_id' => $cliente_id,
                            'cliente_nombre' => $cliente_nombre,
                            'cliente_apellido' => $cliente_apellido,
                            'usuario_id' => $usuario_id,
                            'usuario_nombre' => $usuario_nombre,
                            'fecha_venta' => $fecha_venta,
                            'total' => floatval($total),
                            'tipo_pago' => $tipo_pago,
                            'monto_efectivo' => isset($monto_efectivo) ? floatval($monto_efectivo) : null,
                            'monto_transferencia' => isset($monto_transferencia) ? floatval($monto_transferencia) : null,
                            'notas' => $notas,
                            'anulada' => boolval($anulada)
                        );
                        array_push($ventas, $venta_item);
                        $contador++;
                    }
                    
                    // Para compatibilidad, devolver array simple si no hay paginación
                    echo json_encode($ventas);
                    
                } else {
                    $resultado = $venta->obtenerConFiltros($filtros);
                    $stmt = $resultado['stmt'];
                    $totalRegistros = $resultado['total'];
                    
                    $ventas = [];
                    
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        extract($row);
                        $venta_item = array(
                            'id' => $id,
                            'cliente_id' => $cliente_id,
                            'cliente_nombre' => $cliente_nombre,
                            'cliente_apellido' => $cliente_apellido,
                            'usuario_id' => $usuario_id,
                            'usuario_nombre' => $usuario_nombre,
                            'fecha_venta' => $fecha_venta,
                            'total' => floatval($total),
                            'tipo_pago' => $tipo_pago,
                            'monto_efectivo' => isset($monto_efectivo) ? floatval($monto_efectivo) : null,
                            'monto_transferencia' => isset($monto_transferencia) ? floatval($monto_transferencia) : null,
                            'notas' => $notas,
                            'anulada' => boolval($anulada)
                        );
                        array_push($ventas, $venta_item);
                    }
                    
                    // Si hay paginación, devolver formato estructurado
                    if (isset($filtros['pagina']) && isset($filtros['limite'])) {
                        $response = array(
                            'ventas' => $ventas,
                            'total' => intval($totalRegistros),
                            'pagina' => intval($filtros['pagina']),
                            'limite' => intval($filtros['limite']),
                            'total_paginas' => ceil($totalRegistros / intval($filtros['limite']))
                        );
                        echo json_encode($response);
                    } else {
                        // Sin paginación, devolver array simple
                        echo json_encode($ventas);
                    }
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error obteniendo ventas: ' . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Obtener datos del cuerpo de la petición
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if ($action === 'anular' && $id) {
            // Anular venta
            try {
                if ($venta->anular($id)) {
                    echo json_encode(['success' => true, 'message' => 'Venta anulada correctamente']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error anulando venta']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error anulando venta: ' . $e->getMessage()]);
            }

        } elseif ($action === 'verificar-stock') {
            // DEBUG: Verificar stock
            error_log('VentaController VERIFICAR STOCK - action: ' . $action);
            error_log('VentaController VERIFICAR STOCK - Datos recibidos: ' . print_r($data, true));
            
            // Verificar stock de productos
            if (!isset($data['items']) || !is_array($data['items'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Items requeridos']);
                exit;
            }

            try {
                $verificaciones = [];
                $problemas = [];

                foreach ($data['items'] as $item) {
                    $producto_id = $item['producto_id'];
                    $cantidad = $item['cantidad'];
                    
                    $stock_info = $venta->verificarStock($producto_id, $cantidad);
                    
                    if ($stock_info) {
                        $verificaciones[] = [
                            'producto_id' => $producto_id,
                            'cantidad_requerida' => $cantidad,
                            'stock_actual' => $stock_info['stock_actual'],
                            'stock_resultante' => $stock_info['stock_resultante'],
                            'disponible' => $stock_info['disponible']
                        ];
                        
                        if (!$stock_info['disponible']) {
                            $problemas[] = [
                                'producto_id' => $producto_id,
                                'mensaje' => 'Stock insuficiente'
                            ];
                        }
                    } else {
                        $problemas[] = [
                            'producto_id' => $producto_id,
                            'mensaje' => 'Producto no encontrado'
                        ];
                    }
                }

                echo json_encode([
                    'verificaciones' => $verificaciones,
                    'problemas' => $problemas,
                    'tiene_problemas' => count($problemas) > 0
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error verificando stock: ' . $e->getMessage()]);
            }

        } else {
            // Crear nueva venta
            if (empty($data['cliente_id']) || empty($data['usuario_id']) || 
                empty($data['items']) || !is_array($data['items']) ||
                !isset($data['tipo_pago']) || !isset($data['total'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                exit;
            }

            try {
                // Verificar stock antes de procesar la venta (si no se permite negativo)
                $permitir_negativo = isset($data['permitir_negativo']) ? boolval($data['permitir_negativo']) : false;
                
                if (!$permitir_negativo) {
                    foreach ($data['items'] as $item) {
                        $stock_info = $venta->verificarStock($item['producto_id'], $item['cantidad']);
                        if (!$stock_info || !$stock_info['disponible']) {
                            http_response_code(400);
                            echo json_encode([
                                'success' => false, 
                                'message' => 'Stock insuficiente para uno o más productos',
                                'producto_id' => $item['producto_id']
                            ]);
                            exit;
                        }
                    }
                }

                // Crear la venta
                $venta->cliente_id = $data['cliente_id'];
                $venta->usuario_id = $data['usuario_id'];
                $venta->total = $data['total'];
                $venta->tipo_pago = $data['tipo_pago'];
                $venta->monto_efectivo = isset($data['monto_efectivo']) ? $data['monto_efectivo'] : null;
                $venta->monto_transferencia = isset($data['monto_transferencia']) ? $data['monto_transferencia'] : null;
                $venta->notas = $data['notas'] ?? '';

                // Debug: Verificar datos recibidos para pagos mixtos
                error_log('VentaController CREAR - tipo_pago: ' . $data['tipo_pago']);
                error_log('VentaController CREAR - monto_efectivo: ' . ($data['monto_efectivo'] ?? 'NULL'));
                error_log('VentaController CREAR - monto_transferencia: ' . ($data['monto_transferencia'] ?? 'NULL'));
                error_log('VentaController CREAR - total: ' . $data['total']);

                $venta_id = $venta->crear();
                
                if ($venta_id) {
                    // Agregar items y actualizar stock
                    $error_items = false;
                    
                    foreach ($data['items'] as $item) {
                        $subtotal = $item['cantidad'] * $item['precio_unitario'];
                        
                        // Agregar item
                        if (!$venta->agregarItem(
                            $venta_id, 
                            $item['producto_id'], 
                            $item['cantidad'], 
                            $item['precio_unitario'], 
                            $subtotal
                        )) {
                            $error_items = true;
                            break;
                        }
                        
                        // Actualizar stock del producto
                        $venta->actualizarStockProducto($item['producto_id'], $item['cantidad']);
                    }
                    
                    if (!$error_items) {
                        http_response_code(201);
                        echo json_encode([
                            'success' => true, 
                            'message' => 'Venta creada exitosamente',
                            'id' => $venta_id
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Error agregando items a la venta']);
                    }
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error creando venta']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error creando venta: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de venta requerido']);
            exit;
        }

        // Obtener datos del cuerpo de la petición
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        // Para futuras actualizaciones de ventas (si se requiere)
        http_response_code(501);
        echo json_encode(['success' => false, 'message' => 'Actualización de ventas no implementada']);
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de venta requerido']);
            exit;
        }

        // En lugar de eliminar, anular la venta
        try {
            if ($venta->anular($id)) {
                echo json_encode(['success' => true, 'message' => 'Venta anulada exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error anulando venta']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error anulando venta: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
?>