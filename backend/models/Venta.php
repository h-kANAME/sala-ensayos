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
    public $notas;
    public $anulada;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todas las ventas
    public function obtenerTodas() {
        $query = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                         v.tipo_pago, v.notas, v.anulada,
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

    // Obtener venta por ID
    public function obtenerPorId($id) {
        $query = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                         v.tipo_pago, v.notas, v.anulada,
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
                  WHERE vi.venta_id = :venta_id
                  ORDER BY vi.id ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':venta_id', $venta_id);
        $stmt->execute();
        
        return $stmt;
    }

    // Crear nueva venta
    public function crear() {
        try {
            $this->conn->beginTransaction();
            
            // Insertar venta
            $query = "INSERT INTO " . $this->table_name . " 
                      (cliente_id, usuario_id, fecha_venta, total, tipo_pago, notas, anulada) 
                      VALUES (:cliente_id, :usuario_id, NOW(), :total, :tipo_pago, :notas, 0)";
            
            $stmt = $this->conn->prepare($query);
            
            // Limpiar datos
            $this->cliente_id = htmlspecialchars(strip_tags($this->cliente_id));
            $this->usuario_id = htmlspecialchars(strip_tags($this->usuario_id));
            $this->total = htmlspecialchars(strip_tags($this->total));
            $this->tipo_pago = htmlspecialchars(strip_tags($this->tipo_pago));
            $this->notas = htmlspecialchars(strip_tags($this->notas));
            
            // Bind valores
            $stmt->bindParam(':cliente_id', $this->cliente_id);
            $stmt->bindParam(':usuario_id', $this->usuario_id);
            $stmt->bindParam(':total', $this->total);
            $stmt->bindParam(':tipo_pago', $this->tipo_pago);
            $stmt->bindParam(':notas', $this->notas);
            
            if ($stmt->execute()) {
                $venta_id = $this->conn->lastInsertId();
                $this->conn->commit();
                return $venta_id;
            }
            
            $this->conn->rollBack();
            return false;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Agregar item a venta
    public function agregarItem($venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal) {
        $query = "INSERT INTO " . $this->table_items . " 
                  (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                  VALUES (:venta_id, :producto_id, :cantidad, :precio_unitario, :subtotal)";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpiar datos
        $venta_id = htmlspecialchars(strip_tags($venta_id));
        $producto_id = htmlspecialchars(strip_tags($producto_id));
        $cantidad = htmlspecialchars(strip_tags($cantidad));
        $precio_unitario = htmlspecialchars(strip_tags($precio_unitario));
        $subtotal = htmlspecialchars(strip_tags($subtotal));
        
        // Bind valores
        $stmt->bindParam(':venta_id', $venta_id);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->bindParam(':cantidad', $cantidad);
        $stmt->bindParam(':precio_unitario', $precio_unitario);
        $stmt->bindParam(':subtotal', $subtotal);
        
        return $stmt->execute();
    }

    // Actualizar stock de productos
    public function actualizarStockProducto($producto_id, $cantidad_vendida) {
        $query = "UPDATE productos 
                  SET stock = stock - :cantidad 
                  WHERE id = :producto_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->bindParam(':cantidad', $cantidad_vendida);
        
        return $stmt->execute();
    }

    // Anular venta
    public function anular($id) {
        try {
            $this->conn->beginTransaction();
            
            // Obtener items de la venta para restaurar stock
            $items = $this->obtenerItems($id);
            while ($item = $items->fetch(PDO::FETCH_ASSOC)) {
                // Restaurar stock
                $query_stock = "UPDATE productos 
                               SET stock = stock + :cantidad 
                               WHERE id = :producto_id";
                $stmt_stock = $this->conn->prepare($query_stock);
                $stmt_stock->bindParam(':cantidad', $item['cantidad']);
                $stmt_stock->bindParam(':producto_id', $item['producto_id']);
                $stmt_stock->execute();
            }
            
            // Marcar venta como anulada
            $query = "UPDATE " . $this->table_name . " 
                      SET anulada = 1 
                      WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                $this->conn->commit();
                return true;
            }
            
            $this->conn->rollBack();
            return false;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Verificar stock disponible
    public function verificarStock($producto_id, $cantidad_requerida) {
        $query = "SELECT stock FROM productos WHERE id = :producto_id AND activo = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':producto_id', $producto_id);
        $stmt->execute();
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultado) {
            return [
                'disponible' => $resultado['stock'] >= $cantidad_requerida,
                'stock_actual' => $resultado['stock'],
                'stock_resultante' => $resultado['stock'] - $cantidad_requerida
            ];
        }
        
        return false;
    }

    // Obtener ventas por rango de fechas
    public function obtenerPorFechas($fecha_inicio, $fecha_fin) {
        $query = "SELECT v.id, v.cliente_id, v.usuario_id, v.fecha_venta, v.total, 
                         v.tipo_pago, v.notas, v.anulada,
                         c.nombre_banda as cliente_nombre, c.contacto_nombre as cliente_apellido,
                         u.nombre as usuario_nombre
                  FROM " . $this->table_name . " v
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  LEFT JOIN usuarios u ON v.usuario_id = u.id
                  WHERE DATE(v.fecha_venta) BETWEEN :fecha_inicio AND :fecha_fin
                  ORDER BY v.fecha_venta DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        
        return $stmt;
    }
}
?>