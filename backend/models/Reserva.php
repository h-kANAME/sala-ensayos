<?php
class Reserva
{
    private $conn;
    private $table_name = "reservas";

    public $id;
    public $cliente_id;
    public $sala_id;
    public $usuario_id;
    public $fecha_reserva;
    public $hora_inicio;
    public $hora_fin;
    public $horas_reservadas;
    public $estado;
    public $importe_total;
    public $notas;
    public $hora_ingreso;
    public $hora_salida;
    public $estado_actual;
    public $fecha_creacion;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Crear nueva reserva
    public function crear()
    {
        error_log("=== INICIANDO CREACIÓN DE RESERVA ===");
        
        $query = "INSERT INTO " . $this->table_name . "
        SET cliente_id=:cliente_id, sala_id=:sala_id, usuario_id=:usuario_id,
            fecha_reserva=:fecha_reserva, hora_inicio=:hora_inicio, hora_fin=:hora_fin,
            horas_reservadas=:horas_reservadas, estado=:estado, importe_total=:importe_total,
            notas=:notas, estado_actual=:estado_actual";

        error_log("Query a ejecutar: " . $query);
        
        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            error_log("ERROR: No se pudo preparar la query");
            error_log("Error PDO: " . print_r($this->conn->errorInfo(), true));
            return false;
        }
        
        // Sanitizar inputs
        $this->cliente_id = htmlspecialchars(strip_tags($this->cliente_id));
        $this->sala_id = htmlspecialchars(strip_tags($this->sala_id));
        $this->usuario_id = htmlspecialchars(strip_tags($this->usuario_id));
        $this->fecha_reserva = htmlspecialchars(strip_tags($this->fecha_reserva));
        $this->hora_inicio = htmlspecialchars(strip_tags($this->hora_inicio));
        $this->hora_fin = htmlspecialchars(strip_tags($this->hora_fin));
        $this->horas_reservadas = htmlspecialchars(strip_tags($this->horas_reservadas));
        $this->estado = htmlspecialchars(strip_tags($this->estado));
        $this->importe_total = htmlspecialchars(strip_tags($this->importe_total));
        $this->notas = htmlspecialchars(strip_tags($this->notas));

        // Debug de valores antes del bind
        error_log("Valores a insertar:");
        error_log("- cliente_id: " . $this->cliente_id);
        error_log("- sala_id: " . $this->sala_id);
        error_log("- usuario_id: " . $this->usuario_id);
        error_log("- fecha_reserva: " . $this->fecha_reserva);
        error_log("- hora_inicio: " . $this->hora_inicio);
        error_log("- hora_fin: " . $this->hora_fin);
        error_log("- horas_reservadas: " . $this->horas_reservadas);
        error_log("- estado: " . $this->estado);
        error_log("- importe_total: " . $this->importe_total);
        error_log("- notas: " . $this->notas);
        error_log("- estado_actual: " . $this->estado_actual);

        // Bind parameters
        $stmt->bindParam(":cliente_id", $this->cliente_id);
        $stmt->bindParam(":sala_id", $this->sala_id);
        $stmt->bindParam(":usuario_id", $this->usuario_id);
        $stmt->bindParam(":fecha_reserva", $this->fecha_reserva);
        $stmt->bindParam(":hora_inicio", $this->hora_inicio);
        $stmt->bindParam(":hora_fin", $this->hora_fin);
        $stmt->bindParam(":horas_reservadas", $this->horas_reservadas);
        $stmt->bindParam(":estado", $this->estado);
        $stmt->bindParam(":importe_total", $this->importe_total);
        $stmt->bindParam(":notas", $this->notas);
        $stmt->bindParam(":estado_actual", $this->estado_actual);

        error_log("Ejecutando query...");
        error_log("About to execute prepared statement");
        
        try {
            $result = $stmt->execute();
            error_log("Execute result: " . ($result ? 'true' : 'false'));
        } catch (PDOException $e) {
            error_log("PDO Exception: " . $e->getMessage());
            error_log("Error code: " . $e->getCode());
            return false;
        } catch (Exception $e) {
            error_log("General Exception: " . $e->getMessage());
            return false;
        }
        
        if ($result) {
            $last_id = $this->conn->lastInsertId();
            error_log("✓ Reserva creada exitosamente con ID: " . $last_id);
            error_log("=== FIN CREACIÓN DE RESERVA ===");
            return true;
        } else {
            error_log("✗ ERROR al ejecutar la query");
            error_log("Error info: " . print_r($stmt->errorInfo(), true));
            error_log("=== FIN CREACIÓN DE RESERVA (ERROR) ===");
            return false;
        }
    }

    // Obtener todas las reservas con información de cliente y sala
    public function obtenerTodas()
    {
        $query = "SELECT 
            r.*,
            c.nombre_banda as cliente_nombre,
            c.contacto_nombre as contacto_nombre,
            s.nombre as sala_nombre,
            s.tarifa_hora
          FROM " . $this->table_name . " r
          LEFT JOIN clientes c ON r.cliente_id = c.id
          LEFT JOIN salas s ON r.sala_id = s.id
          ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Obtener reservas por rango de fechas
    public function obtenerPorRangoFechas($fecha_inicio, $fecha_fin)
    {
        $query = "SELECT 
                    r.*,
                    c.nombre_banda as cliente_nombre,
                    c.contacto_nombre as contacto_nombre,
                    s.nombre as sala_nombre,
                    s.tarifa_hora
                  FROM " . $this->table_name . " r
                  LEFT JOIN clientes c ON r.cliente_id = c.id
                  LEFT JOIN salas s ON r.sala_id = s.id
                  WHERE r.fecha_reserva BETWEEN :fecha_inicio AND :fecha_fin
                  ORDER BY r.fecha_reserva, r.hora_inicio";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":fecha_inicio", $fecha_inicio);
        $stmt->bindParam(":fecha_fin", $fecha_fin);
        $stmt->execute();

        return $stmt;
    }

    // Verificar disponibilidad de sala
    public function verificarDisponibilidad($sala_id, $fecha, $hora_inicio, $hora_fin, $excluir_id = null)
    {
        error_log("=== VERIFICANDO DISPONIBILIDAD ===");
        error_log("Sala ID: $sala_id, Fecha: $fecha");
        error_log("Hora inicio: $hora_inicio, Hora fin: $hora_fin");
        
        $query = "SELECT COUNT(*) as count 
                  FROM " . $this->table_name . " 
                  WHERE sala_id = :sala_id 
                  AND fecha_reserva = :fecha
                  AND estado != 'cancelada'
                  AND (
                    (hora_inicio < :hora_fin AND hora_fin > :hora_inicio)
                  )";

        if ($excluir_id) {
            $query .= " AND id != :excluir_id";
        }

        error_log("Query disponibilidad: " . $query);

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":sala_id", $sala_id);
        $stmt->bindParam(":fecha", $fecha);
        $stmt->bindParam(":hora_inicio", $hora_inicio);
        $stmt->bindParam(":hora_fin", $hora_fin);

        if ($excluir_id) {
            $stmt->bindParam(":excluir_id", $excluir_id);
        }

        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $disponible = $row['count'] == 0;
        error_log("Conflictos encontrados: " . $row['count'] . " - Disponible: " . ($disponible ? 'SÍ' : 'NO'));
        error_log("=== FIN VERIFICACIÓN DISPONIBILIDAD ===");

        return $disponible;
    }

    // Obtener una reserva por ID
    public function obtenerPorId($id)
    {
        $query = "SELECT 
                    r.*,
                    c.nombre_banda as cliente_nombre,
                    c.contacto_nombre as contacto_nombre,
                    c.contacto_telefono,
                    c.contacto_email,
                    s.nombre as sala_nombre,
                    s.tarifa_hora,
                    s.descripcion as sala_descripcion
                  FROM " . $this->table_name . " r
                  LEFT JOIN clientes c ON r.cliente_id = c.id
                  LEFT JOIN salas s ON r.sala_id = s.id
                  WHERE r.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt;
    }

    // Actualizar estado de reserva
    public function actualizarEstado($id, $estado)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET estado = :estado 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":estado", $estado);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function registrarIngreso($id)
    {
        $query = "UPDATE " . $this->table_name . " 
              SET hora_ingreso = NOW(), estado_actual = 'presente' 
              WHERE id = :id AND estado_actual = 'pendiente'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    public function registrarSalida($id)
    {
        $query = "UPDATE " . $this->table_name . " 
              SET hora_salida = NOW(), estado_actual = 'finalizada' 
              WHERE id = :id AND estado_actual = 'presente'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0;
        }
        return false;
    }

    public function obtenerReservasHoy()
    {
        $hoy = date('Y-m-d');
        $query = "SELECT 
                r.*,
                c.nombre_banda as cliente_nombre,
                c.contacto_nombre as contacto_nombre,
                s.nombre as sala_nombre
              FROM " . $this->table_name . " r
              LEFT JOIN clientes c ON r.cliente_id = c.id
              LEFT JOIN salas s ON r.sala_id = s.id
              WHERE r.fecha_reserva = :hoy
              ORDER BY r.hora_inicio ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":hoy", $hoy);
        $stmt->execute();

        return $stmt;
    }

    // Actualizar estados automáticamente basado en horarios
    public function actualizarEstadosAutomaticos()
    {
        // Marcar como ausente las reservas que no hicieron check-in después de 15 min de la hora de inicio
        $query1 = "UPDATE " . $this->table_name . " 
                   SET estado_actual = 'ausente' 
                   WHERE estado_actual = 'pendiente' 
                   AND CONCAT(fecha_reserva, ' ', hora_inicio) < DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
        
        $stmt1 = $this->conn->prepare($query1);
        $stmt1->execute();
        
        return true;
    }
}
?>