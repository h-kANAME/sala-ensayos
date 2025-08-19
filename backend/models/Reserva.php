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
        $query = "INSERT INTO " . $this->table_name . "
        SET cliente_id=:cliente_id, sala_id=:sala_id, usuario_id=:usuario_id,
            fecha_reserva=:fecha_reserva, hora_inicio=:hora_inicio, hora_fin=:hora_fin,
            horas_reservadas=:horas_reservadas, estado=:estado, importe_total=:importe_total,
            notas=:notas, estado_actual=:estado_actual";

        $stmt = $this->conn->prepare($query);

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

        if ($stmt->execute()) {
            return true;
        }
        return false;
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

        return $row['count'] == 0;
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
}
