
<?php
class Cliente {
    private $conn;
    private $table_name = "clientes";

    public $id;
    public $nombre_banda;
    public $contacto_nombre;
    public $contacto_email;
    public $contacto_telefono;
    public $direccion;
    public $notas;
    public $activo;
    public $fecha_registro;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear nuevo cliente
    public function crear() {
        $query = "INSERT INTO " . $this->table_name . "
                SET nombre_banda=:nombre_banda, contacto_nombre=:contacto_nombre,
                    contacto_email=:contacto_email, contacto_telefono=:contacto_telefono,
                    direccion=:direccion, notas=:notas, activo=:activo";

        $stmt = $this->conn->prepare($query);

        // Sanitizar inputs
        $this->nombre_banda = htmlspecialchars(strip_tags($this->nombre_banda));
        $this->contacto_nombre = htmlspecialchars(strip_tags($this->contacto_nombre));
        $this->contacto_email = htmlspecialchars(strip_tags($this->contacto_email));
        $this->contacto_telefono = htmlspecialchars(strip_tags($this->contacto_telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->notas = htmlspecialchars(strip_tags($this->notas));
        $this->activo = htmlspecialchars(strip_tags($this->activo));

        // Bind parameters
        $stmt->bindParam(":nombre_banda", $this->nombre_banda);
        $stmt->bindParam(":contacto_nombre", $this->contacto_nombre);
        $stmt->bindParam(":contacto_email", $this->contacto_email);
        $stmt->bindParam(":contacto_telefono", $this->contacto_telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":notas", $this->notas);
        $stmt->bindParam(":activo", $this->activo);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Obtener todos los clientes activos
    public function obtenerTodos() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE activo = 1 
                  ORDER BY nombre_banda ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Obtener cliente por ID
    public function obtenerPorId($id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = :id AND activo = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt;
    }

    // Actualizar cliente
    public function actualizar() {
        $query = "UPDATE " . $this->table_name . "
                SET nombre_banda=:nombre_banda, contacto_nombre=:contacto_nombre,
                    contacto_email=:contacto_email, contacto_telefono=:contacto_telefono,
                    direccion=:direccion, notas=:notas, activo=:activo
                WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        // Sanitizar inputs
        $this->nombre_banda = htmlspecialchars(strip_tags($this->nombre_banda));
        $this->contacto_nombre = htmlspecialchars(strip_tags($this->contacto_nombre));
        $this->contacto_email = htmlspecialchars(strip_tags($this->contacto_email));
        $this->contacto_telefono = htmlspecialchars(strip_tags($this->contacto_telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->notas = htmlspecialchars(strip_tags($this->notas));
        $this->activo = htmlspecialchars(strip_tags($this->activo));

        // Bind parameters
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":nombre_banda", $this->nombre_banda);
        $stmt->bindParam(":contacto_nombre", $this->contacto_nombre);
        $stmt->bindParam(":contacto_email", $this->contacto_email);
        $stmt->bindParam(":contacto_telefono", $this->contacto_telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":notas", $this->notas);
        $stmt->bindParam(":activo", $this->activo);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Eliminar cliente (soft delete)
    public function eliminar($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET activo = 0 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>