<?php
class Sala {
    private $conn;
    private $table_name = "salas";

    public $id;
    public $nombre;
    public $descripcion;
    public $capacidad;
    public $equipamiento;
    public $activa;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todas las salas activas
    public function obtenerTodas() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE activa = 1 
                  ORDER BY nombre ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Obtener sala por ID
    public function obtenerPorId($id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = :id AND activa = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt;
    }
}
?>