<?php
class Database {
    private $host = "mysql";
    private $db_name = "sala_ensayos";
    private $username = "sala_user";
    private $password = "salapassword";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Configurar zona horaria de Argentina (UTC-3)
            $this->conn->exec("SET time_zone = '-03:00'");
            
            // También configurar la zona horaria de PHP
            date_default_timezone_set('America/Argentina/Buenos_Aires');
            
        } catch(PDOException $exception) {
            echo "Error de conexión: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>