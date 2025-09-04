<?php
class Tarifa
{
    private $conn;
    private $table_name = "tarifas";

    public $id_tarifa;
    public $tipo_agrupacion;
    public $duracion_min;
    public $duracion_max;
    public $precio_fijo;
    public $precio_por_hora;
    public $activo;
    public $fecha_creacion;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Obtener todas las tarifas
    public function obtenerTodas()
    {
        $query = "SELECT 
                    id_tarifa,
                    tipo_agrupacion,
                    duracion_min,
                    duracion_max,
                    precio_fijo,
                    precio_por_hora,
                    activo,
                    fecha_creacion
                  FROM " . $this->table_name . " 
                  ORDER BY tipo_agrupacion, duracion_min";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener tarifas activas solamente
    public function obtenerActivas()
    {
        $query = "SELECT 
                    id_tarifa,
                    tipo_agrupacion,
                    duracion_min,
                    duracion_max,
                    precio_fijo,
                    precio_por_hora,
                    activo,
                    fecha_creacion
                  FROM " . $this->table_name . " 
                  WHERE activo = 1 
                  ORDER BY tipo_agrupacion, duracion_min";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener una tarifa específica por ID
    public function obtenerPorId($id)
    {
        $query = "SELECT 
                    id_tarifa,
                    tipo_agrupacion,
                    duracion_min,
                    duracion_max,
                    precio_fijo,
                    precio_por_hora,
                    activo,
                    fecha_creacion
                  FROM " . $this->table_name . " 
                  WHERE id_tarifa = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt;
    }

    // Crear nueva tarifa
    public function crear()
    {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET tipo_agrupacion=:tipo_agrupacion,
                      duracion_min=:duracion_min,
                      duracion_max=:duracion_max,
                      precio_fijo=:precio_fijo,
                      precio_por_hora=:precio_por_hora,
                      activo=:activo";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->tipo_agrupacion = htmlspecialchars(strip_tags($this->tipo_agrupacion));
        $this->duracion_min = htmlspecialchars(strip_tags($this->duracion_min));
        $this->duracion_max = $this->duracion_max === '' ? null : htmlspecialchars(strip_tags($this->duracion_max));
        $this->precio_fijo = $this->precio_fijo === '' ? null : htmlspecialchars(strip_tags($this->precio_fijo));
        $this->precio_por_hora = $this->precio_por_hora === '' ? null : htmlspecialchars(strip_tags($this->precio_por_hora));
        $this->activo = htmlspecialchars(strip_tags($this->activo));

        // Bind de valores
        $stmt->bindParam(":tipo_agrupacion", $this->tipo_agrupacion);
        $stmt->bindParam(":duracion_min", $this->duracion_min);
        $stmt->bindParam(":duracion_max", $this->duracion_max);
        $stmt->bindParam(":precio_fijo", $this->precio_fijo);
        $stmt->bindParam(":precio_por_hora", $this->precio_por_hora);
        $stmt->bindParam(":activo", $this->activo);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Actualizar tarifa existente
    public function actualizar()
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET tipo_agrupacion=:tipo_agrupacion,
                      duracion_min=:duracion_min,
                      duracion_max=:duracion_max,
                      precio_fijo=:precio_fijo,
                      precio_por_hora=:precio_por_hora,
                      activo=:activo
                  WHERE id_tarifa=:id_tarifa";

        $stmt = $this->conn->prepare($query);

        // Sanitizar datos
        $this->id_tarifa = htmlspecialchars(strip_tags($this->id_tarifa));
        $this->tipo_agrupacion = htmlspecialchars(strip_tags($this->tipo_agrupacion));
        $this->duracion_min = htmlspecialchars(strip_tags($this->duracion_min));
        $this->duracion_max = $this->duracion_max === '' ? null : htmlspecialchars(strip_tags($this->duracion_max));
        $this->precio_fijo = $this->precio_fijo === '' ? null : htmlspecialchars(strip_tags($this->precio_fijo));
        $this->precio_por_hora = $this->precio_por_hora === '' ? null : htmlspecialchars(strip_tags($this->precio_por_hora));
        $this->activo = htmlspecialchars(strip_tags($this->activo));

        // Bind de valores
        $stmt->bindParam(":id_tarifa", $this->id_tarifa);
        $stmt->bindParam(":tipo_agrupacion", $this->tipo_agrupacion);
        $stmt->bindParam(":duracion_min", $this->duracion_min);
        $stmt->bindParam(":duracion_max", $this->duracion_max);
        $stmt->bindParam(":precio_fijo", $this->precio_fijo);
        $stmt->bindParam(":precio_por_hora", $this->precio_por_hora);
        $stmt->bindParam(":activo", $this->activo);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Eliminar tarifa (soft delete - marcar como inactiva)
    public function eliminar()
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET activo = 0 
                  WHERE id_tarifa = :id_tarifa";

        $stmt = $this->conn->prepare($query);

        $this->id_tarifa = htmlspecialchars(strip_tags($this->id_tarifa));
        $stmt->bindParam(":id_tarifa", $this->id_tarifa);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Validar que no existan tarifas duplicadas
    public function validarDuplicadas($id_tarifa = null)
    {
        $whereClause = $id_tarifa ? "AND id_tarifa != :id_tarifa" : "";
        
        $query = "SELECT COUNT(*) as total 
                  FROM " . $this->table_name . " 
                  WHERE tipo_agrupacion = :tipo_agrupacion 
                  AND duracion_min = :duracion_min 
                  AND (duracion_max = :duracion_max OR (duracion_max IS NULL AND :duracion_max IS NULL))
                  AND activo = 1 
                  " . $whereClause;

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":tipo_agrupacion", $this->tipo_agrupacion);
        $stmt->bindParam(":duracion_min", $this->duracion_min);
        $stmt->bindParam(":duracion_max", $this->duracion_max);
        
        if ($id_tarifa) {
            $stmt->bindParam(":id_tarifa", $id_tarifa);
        }

        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['total'] == 0; // true si no hay duplicados
    }

    // Obtener estadísticas completas de uso de tarifas
    public function obtenerEstadisticas()
    {
        // Estadísticas por tipo de agrupación y duración
        $query = "SELECT 
                    c.tipo_agrupacion,
                    r.horas_reservadas,
                    COUNT(r.id) as total_reservas,
                    SUM(r.importe_total) as facturacion_total,
                    AVG(r.importe_total) as precio_promedio,
                    MIN(r.fecha_reserva) as primera_reserva,
                    MAX(r.fecha_reserva) as ultima_reserva
                  FROM reservas r
                  INNER JOIN clientes c ON r.cliente_id = c.id
                  WHERE r.estado != 'cancelada'
                  GROUP BY c.tipo_agrupacion, r.horas_reservadas
                  ORDER BY c.tipo_agrupacion, r.horas_reservadas";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener resumen general de estadísticas
    public function obtenerResumenEstadisticas()
    {
        $query = "SELECT 
                    COUNT(DISTINCT r.id) as total_reservas,
                    COUNT(DISTINCT c.id) as clientes_activos,
                    SUM(r.importe_total) as facturacion_total,
                    AVG(r.importe_total) as ticket_promedio,
                    AVG(r.horas_reservadas) as duracion_promedio,
                    (SELECT COUNT(*) FROM tarifas WHERE activo = 1) as tarifas_activas,
                    (SELECT COUNT(*) FROM tarifas WHERE activo = 0) as tarifas_inactivas
                  FROM reservas r
                  INNER JOIN clientes c ON r.cliente_id = c.id
                  WHERE r.estado != 'cancelada'
                    AND r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 90 DAY)";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener estadísticas por tipo de agrupación
    public function obtenerEstadisticasPorTipo()
    {
        $query = "SELECT 
                    c.tipo_agrupacion,
                    COUNT(r.id) as total_reservas,
                    SUM(r.importe_total) as facturacion_total,
                    AVG(r.importe_total) as precio_promedio,
                    AVG(r.horas_reservadas) as duracion_promedio,
                    COUNT(DISTINCT r.cliente_id) as clientes_unicos
                  FROM reservas r
                  INNER JOIN clientes c ON r.cliente_id = c.id
                  WHERE r.estado != 'cancelada'
                    AND r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                  GROUP BY c.tipo_agrupacion
                  ORDER BY total_reservas DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener distribución de duraciones
    public function obtenerDistribucionDuraciones()
    {
        $query = "SELECT 
                    r.horas_reservadas,
                    c.tipo_agrupacion,
                    COUNT(r.id) as cantidad,
                    SUM(r.importe_total) as facturacion,
                    AVG(r.importe_total) as precio_promedio
                  FROM reservas r
                  INNER JOIN clientes c ON r.cliente_id = c.id
                  WHERE r.estado != 'cancelada'
                    AND r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                  GROUP BY r.horas_reservadas, c.tipo_agrupacion
                  ORDER BY r.horas_reservadas, c.tipo_agrupacion";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener tendencias mensuales
    public function obtenerTendenciasMensuales()
    {
        $query = "SELECT 
                    DATE_FORMAT(r.fecha_reserva, '%Y-%m') as periodo,
                    c.tipo_agrupacion,
                    COUNT(r.id) as total_reservas,
                    SUM(r.importe_total) as facturacion,
                    AVG(r.horas_reservadas) as duracion_promedio
                  FROM reservas r
                  INNER JOIN clientes c ON r.cliente_id = c.id
                  WHERE r.estado != 'cancelada'
                    AND r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                  GROUP BY DATE_FORMAT(r.fecha_reserva, '%Y-%m'), c.tipo_agrupacion
                  ORDER BY periodo DESC, c.tipo_agrupacion";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>