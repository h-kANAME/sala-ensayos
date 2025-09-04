<?php
class Venta {
    private $conn;
    private $table_name = "ventas";
    private $table_items = "venta_items";

    public $id;
    public $cliente_id;
    public $usuario_id;
    public $fecha_venta;
    public $total;
    public $tipo_pago;
    public $monto_efectivo;
    public $monto_transferencia;
    public $notas;
    public $anulada;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todas las ventas
    public function obtenerTodas() {
        $query = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                         v.tipo_pago, v.monto_efectivo, v.monto_transferencia, v.notas, v.anulada,
                         c.nombre_banda as cliente_nombre, c.contacto_nombre as cliente_apellido,
                         u.nombre_completo as usuario_nombre
                  FROM " . $this->table_name . " v
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  LEFT JOIN usuarios u ON v.usuario_id = u.id
                  ORDER BY v.fecha_venta DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    // Obtener ventas con filtros avanzados y paginación
    public function obtenerConFiltros($filtros = []) {
        $baseQuery = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                             v.tipo_pago, v.monto_efectivo, v.monto_transferencia, v.notas, v.anulada,
                             c.nombre_banda as cliente_nombre, c.contacto_nombre as cliente_apellido,
                             u.nombre_completo as usuario_nombre
                      FROM " . $this->table_name . " v
                      LEFT JOIN clientes c ON v.cliente_id = c.id
                      LEFT JOIN usuarios u ON v.usuario_id = u.id
                      WHERE 1=1";
        
        $countQuery = "SELECT COUNT(*) as total
                       FROM " . $this->table_name . " v
                       LEFT JOIN clientes c ON v.cliente_id = c.id
                       LEFT JOIN usuarios u ON v.usuario_id = u.id
                       WHERE 1=1";
        
        $params = [];
        $whereClause = "";
        
        // Filtro por rango de fechas
        if (!empty($filtros['fecha_inicio'])) {
            $whereClause .= " AND DATE(v.fecha_venta) >= :fecha_inicio";
            $params[':fecha_inicio'] = $filtros['fecha_inicio'];
        }
        
        if (!empty($filtros['fecha_fin'])) {
            $whereClause .= " AND DATE(v.fecha_venta) <= :fecha_fin";
            $params[':fecha_fin'] = $filtros['fecha_fin'];
        }
        
        // Filtro por tipo de pago
        if (!empty($filtros['tipo_pago'])) {
            $whereClause .= " AND v.tipo_pago = :tipo_pago";
            $params[':tipo_pago'] = $filtros['tipo_pago'];
        }
        
        // Filtro por estado
        if (isset($filtros['anulada'])) {
            $whereClause .= " AND v.anulada = :anulada";
            $params[':anulada'] = $filtros['anulada'] ? 1 : 0;
        }
        
        // Filtro por cliente (buscar en nombre_banda y contacto_nombre)
        if (!empty($filtros['cliente'])) {
            $whereClause .= " AND (c.nombre_banda LIKE :cliente OR c.contacto_nombre LIKE :cliente)";
            $params[':cliente'] = "%" . $filtros['cliente'] . "%";
        }
        
        // Filtro por usuario
        if (!empty($filtros['usuario_id'])) {
            $whereClause .= " AND v.usuario_id = :usuario_id";
            $params[':usuario_id'] = $filtros['usuario_id'];
        }
        
        // Contar total de registros
        $countStmt = $this->conn->prepare($countQuery . $whereClause);
        foreach ($params as $param => $value) {
            $countStmt->bindValue($param, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Construir query con paginación
        $query = $baseQuery . $whereClause . " ORDER BY v.fecha_venta DESC";
        
        // Agregar LIMIT y OFFSET para paginación
        if (isset($filtros['limite']) && isset($filtros['pagina'])) {
            $limite = intval($filtros['limite']);
            $pagina = intval($filtros['pagina']);
            $offset = ($pagina - 1) * $limite;
            
            $query .= " LIMIT :limite OFFSET :offset";
            $params[':limite'] = $limite;
            $params[':offset'] = $offset;
        }
        
        $stmt = $this->conn->prepare($query);
        
        // Bind de parámetros
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        
        $stmt->execute();
        
        return [
            'stmt' => $stmt,
            'total' => $total
        ];
    }

    // Obtener venta por ID
    public function obtenerPorId($id) {
        $query = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                         v.tipo_pago, v.monto_efectivo, v.monto_transferencia, v.notas, v.anulada,
                         c.nombre_banda as cliente_nombre, c.contacto_nombre as cliente_apellido,
                         u.nombre_completo as usuario_nombre
                  FROM " . $this->table_name . " v
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  LEFT JOIN usuarios u ON v.usuario_id = u.id
                  WHERE v.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt;
    }

    // Obtener items de una venta
    public function obtenerItems($venta_id) {
        $query = "SELECT vi.id, vi.venta_id, vi.producto_id, vi.cantidad, 
                         vi.precio_unitario, vi.subtotal,
                         p.nombre as producto_nombre, p.descripcion as producto_descripcion
                  FROM " . $this->table_items . " vi
                  LEFT JOIN productos p ON vi.producto_id = p.id
                  WHERE vi.venta_id = :venta_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':venta_id', $venta_id);
        $stmt->execute();
        
        return $stmt;
    }

    // Validar datos de pago
    private function validarPago() {
        $errores = [];
        
        // Validar según tipo de pago
        switch ($this->tipo_pago) {
            case 'efectivo':
                $this->monto_efectivo = $this->total;
                $this->monto_transferencia = 0;
                break;
                
            case 'transferencia':
            case 'tarjeta':
                $this->monto_efectivo = 0;
                $this->monto_transferencia = $this->total;
                break;
                
            case 'mixto':
                // Validar que ambos montos estén definidos
                if ($this->monto_efectivo === null || $this->monto_transferencia === null) {
                    $errores[] = 'Los pagos mixtos deben especificar monto_efectivo y monto_transferencia';
                }
                
                // Validar que ambos montos sean mayores a 0
                if ($this->monto_efectivo <= 0 || $this->monto_transferencia <= 0) {
                    $errores[] = 'Los montos de pago mixto deben ser mayores a cero';
                }
                
                // Validar que la suma sea igual al total (con tolerancia de centavos)
                $suma = $this->monto_efectivo + $this->monto_transferencia;
                if (abs($suma - $this->total) > 0.01) {
                    $errores[] = 'La suma de monto_efectivo y monto_transferencia debe ser igual al total';
                }
                
                // Validar que no supere el total
                if ($suma > $this->total) {
                    $errores[] = 'La suma de los montos no puede superar el total a cobrar';
                }
                break;
                
            default:
                $errores[] = 'Tipo de pago no válido';
        }
        
        return $errores;
    }
    
    // Crear nueva venta
    public function crear() {
        try {
            // Validar datos de pago
            $errores = $this->validarPago();
            if (!empty($errores)) {
                throw new Exception('Errores de validación: ' . implode(', ', $errores));
            }
            
            $this->conn->beginTransaction();
            
            $query = "INSERT INTO " . $this->table_name . " 
                      (cliente_id, usuario_id, fecha_venta, total, tipo_pago, monto_efectivo, monto_transferencia, notas) 
                      VALUES (:cliente_id, :usuario_id, NOW(), :total, :tipo_pago, :monto_efectivo, :monto_transferencia, :notas)";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':cliente_id', $this->cliente_id);
            $stmt->bindParam(':usuario_id', $this->usuario_id);
            $stmt->bindParam(':total', $this->total);
            $stmt->bindParam(':tipo_pago', $this->tipo_pago);
            $stmt->bindParam(':monto_efectivo', $this->monto_efectivo);
            $stmt->bindParam(':monto_transferencia', $this->monto_transferencia);
            $stmt->bindParam(':notas', $this->notas);
            
            if ($stmt->execute()) {
                $venta_id = $this->conn->lastInsertId();
                $this->conn->commit();
                return $venta_id;
            }
            
            $this->conn->rollback();
            return false;
        } catch (PDOException $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    // Agregar item a venta
    public function agregarItem($venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal) {
        $query = "INSERT INTO " . $this->table_items . " 
                  (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                  VALUES (:venta_id, :producto_id, :cantidad, :precio_unitario, :subtotal)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':venta_id', $venta_id);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->bindParam(':cantidad', $cantidad);
        $stmt->bindParam(':precio_unitario', $precio_unitario);
        $stmt->bindParam(':subtotal', $subtotal);
        
        return $stmt->execute();
    }

    // Anular venta
    public function anular($id) {
        $query = "UPDATE " . $this->table_name . " SET anulada = 1 WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    // Verificar stock de producto
    public function verificarStock($producto_id, $cantidad) {
        $query = "SELECT stock FROM productos WHERE id = :producto_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->execute();
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $stock_actual = intval($row['stock']);
            $stock_resultante = $stock_actual - $cantidad;
            
            return [
                'stock_actual' => $stock_actual,
                'stock_resultante' => $stock_resultante,
                'disponible' => $stock_resultante >= 0
            ];
        }
        
        return null;
    }

    // Actualizar stock de producto
    public function actualizarStockProducto($producto_id, $cantidad) {
        $query = "UPDATE productos SET stock = stock - :cantidad WHERE id = :producto_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->bindParam(':cantidad', $cantidad);
        
        return $stmt->execute();
    }

}
?>
