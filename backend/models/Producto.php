<?php
class Producto {
    private $conn;
    private $table_name = "productos";

    public $id;
    public $nombre;
    public $descripcion;
    public $categoria;
    public $precio;
    public $stock;
    public $stock_minimo;
    public $activo;
    public $fecha_creacion;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todos los productos
    public function obtenerTodos() {
        $query = "SELECT id, nombre, descripcion, categoria, precio, stock, stock_minimo, activo, fecha_creacion 
                  FROM " . $this->table_name . " 
                  ORDER BY nombre ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    // Obtener productos activos
    public function obtenerActivos() {
        $query = "SELECT id, nombre, descripcion, categoria, precio, stock, stock_minimo, activo, fecha_creacion 
                  FROM " . $this->table_name . " 
                  WHERE activo = 1
                  ORDER BY nombre ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    // Obtener un producto por ID
    public function obtenerPorId($id) {
        $query = "SELECT id, nombre, descripcion, categoria, precio, stock, stock_minimo, activo, fecha_creacion 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt;
    }

    // Crear nuevo producto
    public function crear() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nombre, descripcion, categoria, precio, stock, stock_minimo, activo) 
                  VALUES (:nombre, :descripcion, :categoria, :precio, :stock, :stock_minimo, :activo)";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpiar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->categoria = htmlspecialchars(strip_tags($this->categoria));
        $this->precio = htmlspecialchars(strip_tags($this->precio));
        $this->stock = htmlspecialchars(strip_tags($this->stock));
        $this->stock_minimo = htmlspecialchars(strip_tags($this->stock_minimo));
        $this->activo = $this->activo ? 1 : 0;
        
        // Bind valores
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':categoria', $this->categoria);
        $stmt->bindParam(':precio', $this->precio);
        $stmt->bindParam(':stock', $this->stock);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo);
        $stmt->bindParam(':activo', $this->activo);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }

    // Actualizar producto
    public function actualizar($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre = :nombre, 
                      descripcion = :descripcion, 
                      categoria = :categoria, 
                      precio = :precio, 
                      stock = :stock, 
                      stock_minimo = :stock_minimo, 
                      activo = :activo 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        // Limpiar datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->categoria = htmlspecialchars(strip_tags($this->categoria));
        $this->precio = htmlspecialchars(strip_tags($this->precio));
        $this->stock = htmlspecialchars(strip_tags($this->stock));
        $this->stock_minimo = htmlspecialchars(strip_tags($this->stock_minimo));
        $this->activo = $this->activo ? 1 : 0;
        
        // Bind valores
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':categoria', $this->categoria);
        $stmt->bindParam(':precio', $this->precio);
        $stmt->bindParam(':stock', $this->stock);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo);
        $stmt->bindParam(':activo', $this->activo);
        
        return $stmt->execute();
    }

    // Actualizar solo stock (sumar cantidad)
    public function actualizarStock($id, $cantidadASumar) {
        $query = "UPDATE " . $this->table_name . " 
                  SET stock = stock + :cantidad 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':cantidad', $cantidadASumar);
        
        return $stmt->execute();
    }

    // Eliminar producto (soft delete)
    public function eliminar($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET activo = 0 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    // Buscar productos por nombre
    public function buscarPorNombre($termino) {
        $query = "SELECT id, nombre, descripcion, categoria, precio, stock, stock_minimo, activo, fecha_creacion 
                  FROM " . $this->table_name . " 
                  WHERE nombre LIKE :termino AND activo = 1
                  ORDER BY nombre ASC";
        
        $stmt = $this->conn->prepare($query);
        $termino = "%" . $termino . "%";
        $stmt->bindParam(':termino', $termino);
        $stmt->execute();
        
        return $stmt;
    }
}
?>