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
    public $codigo_verificacion;
    public $intentos_verificacion;
    public $fecha_expiracion_codigo;
    public $estado_verificacion;
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
            s.nombre as sala_nombre
          FROM " . $this->table_name . " r
          LEFT JOIN clientes c ON r.cliente_id = c.id
          LEFT JOIN salas s ON r.sala_id = s.id
          WHERE r.estado != 'cancelada'
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
                    s.nombre as sala_nombre
                  FROM " . $this->table_name . " r
                  LEFT JOIN clientes c ON r.cliente_id = c.id
                  LEFT JOIN salas s ON r.sala_id = s.id
                  WHERE r.fecha_reserva BETWEEN :fecha_inicio AND :fecha_fin
                  AND r.estado != 'cancelada'
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

    // Verificar que una banda no tenga conflicto de horarios con sus propias reservas
    public function verificarConflictoBanda($cliente_id, $fecha, $hora_inicio, $hora_fin, $reserva_id = null)
    {
        error_log("=== VERIFICANDO CONFLICTO DE BANDA ===");
        error_log("Cliente ID: $cliente_id");
        error_log("Fecha: $fecha");
        error_log("Hora inicio: $hora_inicio");
        error_log("Hora fin: $hora_fin");
        error_log("Reserva ID a excluir: " . ($reserva_id ?: 'ninguna'));

        // Buscar reservas activas de la misma banda que se superpongan en horario
        $query = "SELECT COALESCE(COUNT(r.id), 0) as count, 
                         COALESCE(GROUP_CONCAT(CONCAT(s.nombre, ' (', r.hora_inicio, '-', r.hora_fin, ')') SEPARATOR ', '), '') as reservas_conflicto
                  FROM " . $this->table_name . " r
                  LEFT JOIN salas s ON r.sala_id = s.id
                  WHERE r.cliente_id = :cliente_id 
                  AND DATE(r.fecha_reserva) = :fecha
                  AND r.estado IN ('confirmada', 'pendiente')
                  AND r.estado_verificacion IN ('verificado', 'pendiente')
                  AND (
                    (r.hora_inicio < :hora_fin AND r.hora_fin > :hora_inicio)
                  )";
        
        // Si estamos editando una reserva existente, excluirla de la validación
        if ($reserva_id) {
            $query .= " AND r.id != :reserva_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":cliente_id", $cliente_id);
        $stmt->bindParam(":fecha", $fecha);
        $stmt->bindParam(":hora_inicio", $hora_inicio);
        $stmt->bindParam(":hora_fin", $hora_fin);
        
        if ($reserva_id) {
            $stmt->bindParam(":reserva_id", $reserva_id);
        }
        
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $sinConflicto = ($row['count'] ?? 0) == 0;
        
        error_log("Conflictos de banda encontrados: " . $row['count']);
        if (!$sinConflicto) {
            error_log("Reservas en conflicto: " . $row['reservas_conflicto']);
        }
        error_log("Sin conflicto: " . ($sinConflicto ? 'SÍ' : 'NO'));
        error_log("=== FIN VERIFICACIÓN CONFLICTO DE BANDA ===");

        return [
            'sin_conflicto' => $sinConflicto,
            'reservas_conflicto' => $row['reservas_conflicto'] ?: 'Sin detalles de conflicto'
        ];
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

    // Actualizar reserva
    public function actualizar()
    {
        error_log("=== INICIANDO ACTUALIZACIÓN DE RESERVA ID: " . $this->id . " ===");
        
        $query = "UPDATE " . $this->table_name . "
                 SET cliente_id=:cliente_id, sala_id=:sala_id, usuario_id=:usuario_id,
                     fecha_reserva=:fecha_reserva, hora_inicio=:hora_inicio, hora_fin=:hora_fin,
                     horas_reservadas=:horas_reservadas, estado=:estado, importe_total=:importe_total,
                     notas=:notas
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            error_log("ERROR: No se pudo preparar la query de actualización");
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
        $this->id = htmlspecialchars(strip_tags($this->id));

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
        $stmt->bindParam(":id", $this->id);

        try {
            $result = $stmt->execute();
            if ($result) {
                error_log("✓ Reserva actualizada exitosamente");
                return true;
            } else {
                error_log("✗ ERROR al actualizar la reserva");
                error_log("Error info: " . print_r($stmt->errorInfo(), true));
                return false;
            }
        } catch (Exception $e) {
            error_log("Exception al actualizar reserva: " . $e->getMessage());
            return false;
        }
    }

    // Eliminar reserva (soft delete)
    public function eliminar($id)
    {
        error_log("=== INICIANDO ELIMINACIÓN DE RESERVA ID: " . $id . " ===");
        
        // Primero verificar el estado actual de la reserva
        $queryVerificar = "SELECT estado_actual FROM " . $this->table_name . " WHERE id = :id";
        $stmtVerificar = $this->conn->prepare($queryVerificar);
        $stmtVerificar->bindParam(':id', $id);
        $stmtVerificar->execute();
        
        if ($stmtVerificar->rowCount() == 0) {
            error_log("ERROR: Reserva con ID $id no encontrada");
            return false;
        }
        
        $reserva = $stmtVerificar->fetch(PDO::FETCH_ASSOC);
        $estadoActual = $reserva['estado_actual'];
        
        // No permitir eliminar reservas finalizadas
        if (strtoupper($estadoActual) === 'FINALIZADA') {
            error_log("ERROR: No se puede eliminar reserva finalizada (ID: $id)");
            throw new Exception("No se puede eliminar una reserva que ya finalizó (checkout realizado)");
        }
        
        error_log("Estado actual de reserva ID $id: $estadoActual - Eliminación permitida");
        
        // Soft delete: cambiar estado a 'cancelada' en lugar de eliminar físicamente
        $query = "UPDATE " . $this->table_name . " 
                  SET estado = 'cancelada', estado_actual = 'cancelada' 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            error_log("ERROR: No se pudo preparar la query de eliminación");
            return false;
        }
        
        $stmt->bindParam(":id", $id);

        try {
            $result = $stmt->execute();
            if ($result && $stmt->rowCount() > 0) {
                error_log("✓ Reserva eliminada exitosamente (soft delete)");
                return true;
            } else {
                error_log("✗ ERROR: No se encontró la reserva o ya estaba eliminada");
                error_log("Rows affected: " . $stmt->rowCount());
                return false;
            }
        } catch (Exception $e) {
            error_log("Exception al eliminar reserva: " . $e->getMessage());
            return false;
        }
    }

    // Actualizar estados automáticamente basado en horarios
    public function actualizarEstadosAutomaticos()
    {
        // Log para debug
        error_log("=== ACTUALIZANDO ESTADOS AUTOMATICOS ===");
        error_log("Hora actual servidor: " . date('Y-m-d H:i:s'));
        
        // Primero verificar qué reservas serían afectadas
        $queryCheck = "SELECT id, fecha_reserva, hora_inicio, 
                              CONCAT(fecha_reserva, ' ', hora_inicio) as fecha_hora_inicio,
                              DATE_SUB(NOW(), INTERVAL 15 MINUTE) as limite_ausencia
                       FROM " . $this->table_name . " 
                       WHERE estado_actual = 'pendiente'";
        
        $stmtCheck = $this->conn->prepare($queryCheck);
        $stmtCheck->execute();
        
        while ($row = $stmtCheck->fetch(PDO::FETCH_ASSOC)) {
            error_log("Reserva ID: {$row['id']} - Inicio: {$row['fecha_hora_inicio']} - Límite: {$row['limite_ausencia']}");
        }
        
        // Marcar como ausente las reservas que no hicieron check-in después de 15 min de la hora de inicio
        // SOLO si la reserva ya debería haber comenzado (la hora de inicio ya pasó hace más de 15 min)
        $query1 = "UPDATE " . $this->table_name . " 
                   SET estado_actual = 'ausente' 
                   WHERE estado_actual = 'pendiente' 
                   AND CONCAT(fecha_reserva, ' ', hora_inicio) <= DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
        
        $stmt1 = $this->conn->prepare($query1);
        $stmt1->execute();
        
        $reservasAfectadas = $stmt1->rowCount();
        error_log("Reservas marcadas como ausente: " . $reservasAfectadas);
        
        return true;
    }

    // Métodos para el sistema de verificación por email

    // Generar código de verificación
    public function generarCodigoVerificacion()
    {
        return sprintf('%06d', mt_rand(100000, 999999));
    }

    // Iniciar proceso de verificación (para reservas públicas)
    public function iniciarVerificacion($cliente_id, $sala_id, $fecha_reserva, $hora_inicio, $hora_fin, $horas_reservadas, $importe_total)
    {
        error_log("=== INICIANDO PROCESO DE VERIFICACIÓN ===");
        
        // Generar código de verificación
        $codigo = $this->generarCodigoVerificacion();
        $expiracion = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        $query = "INSERT INTO " . $this->table_name . "
                 SET cliente_id=:cliente_id, sala_id=:sala_id, usuario_id=NULL,
                     fecha_reserva=:fecha_reserva, hora_inicio=:hora_inicio, hora_fin=:hora_fin,
                     horas_reservadas=:horas_reservadas, estado='pendiente', estado_actual='pendiente',
                     importe_total=:importe_total, codigo_verificacion=:codigo,
                     fecha_expiracion_codigo=:expiracion, estado_verificacion='pendiente',
                     intentos_verificacion=0, notas='Reserva validada por agenda pública'";

        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            error_log("ERROR: No se pudo preparar la query de verificación");
            return false;
        }

        $stmt->bindParam(":cliente_id", $cliente_id);
        $stmt->bindParam(":sala_id", $sala_id);
        $stmt->bindParam(":fecha_reserva", $fecha_reserva);
        $stmt->bindParam(":hora_inicio", $hora_inicio);
        $stmt->bindParam(":hora_fin", $hora_fin);
        $stmt->bindParam(":horas_reservadas", $horas_reservadas);
        $stmt->bindParam(":importe_total", $importe_total);
        $stmt->bindParam(":codigo", $codigo);
        $stmt->bindParam(":expiracion", $expiracion);

        try {
            $result = $stmt->execute();
            if ($result) {
                $reserva_id = $this->conn->lastInsertId();
                error_log("✓ Proceso de verificación iniciado para reserva ID: " . $reserva_id);
                return [
                    'reserva_id' => $reserva_id,
                    'codigo_verificacion' => $codigo,
                    'fecha_expiracion' => $expiracion
                ];
            }
        } catch (Exception $e) {
            error_log("Exception al iniciar verificación: " . $e->getMessage());
        }
        
        return false;
    }

    // Verificar código de verificación
    public function verificarCodigo($reserva_id, $codigo_ingresado)
    {
        error_log("=== VERIFICANDO CÓDIGO ===");
        error_log("Reserva ID: $reserva_id, Código: $codigo_ingresado");
        
        // Obtener información de la reserva
        $query = "SELECT codigo_verificacion, intentos_verificacion, fecha_expiracion_codigo, estado_verificacion 
                  FROM " . $this->table_name . " 
                  WHERE id = :reserva_id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reserva_id", $reserva_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            error_log("ERROR: Reserva no encontrada");
            return ['success' => false, 'message' => 'Reserva no encontrada'];
        }
        
        $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verificar si ya está verificado
        if ($reserva['estado_verificacion'] === 'verificado') {
            error_log("Reserva ya verificada");
            return ['success' => false, 'message' => 'La reserva ya ha sido verificada'];
        }
        
        // Verificar si está bloqueado por intentos
        if ($reserva['estado_verificacion'] === 'bloqueado') {
            error_log("Reserva bloqueada por intentos fallidos");
            return ['success' => false, 'message' => 'Reserva bloqueada por múltiples intentos fallidos'];
        }
        
        // Verificar si el código ha expirado
        if (strtotime($reserva['fecha_expiracion_codigo']) < time()) {
            error_log("Código expirado");
            $this->marcarComoExpirado($reserva_id);
            return ['success' => false, 'message' => 'El código de verificación ha expirado'];
        }
        
        // Verificar el código
        if ($reserva['codigo_verificacion'] === $codigo_ingresado) {
            error_log("✓ Código verificado correctamente");
            $this->confirmarVerificacion($reserva_id);
            return ['success' => true, 'message' => 'Código verificado correctamente. Reserva confirmada.'];
        } else {
            error_log("✗ Código incorrecto");
            $intentos = $reserva['intentos_verificacion'] + 1;
            
            if ($intentos >= 3) {
                $this->bloquearReserva($reserva_id);
                return ['success' => false, 'message' => 'Código incorrecto. Reserva bloqueada por múltiples intentos fallidos.'];
            } else {
                $this->incrementarIntentos($reserva_id);
                return ['success' => false, 'message' => "Código incorrecto. Intentos restantes: " . (3 - $intentos)];
            }
        }
    }

    // Confirmar verificación y activar reserva
    private function confirmarVerificacion($reserva_id)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET estado_verificacion = 'verificado', estado = 'confirmada' 
                  WHERE id = :reserva_id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reserva_id", $reserva_id);
        return $stmt->execute();
    }

    // Incrementar contador de intentos
    private function incrementarIntentos($reserva_id)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET intentos_verificacion = intentos_verificacion + 1 
                  WHERE id = :reserva_id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reserva_id", $reserva_id);
        return $stmt->execute();
    }

    // Bloquear reserva por intentos fallidos
    private function bloquearReserva($reserva_id)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET estado_verificacion = 'bloqueado', estado = 'cancelada' 
                  WHERE id = :reserva_id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reserva_id", $reserva_id);
        return $stmt->execute();
    }

    // Marcar código como expirado
    private function marcarComoExpirado($reserva_id)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET estado_verificacion = 'expirado', estado = 'cancelada' 
                  WHERE id = :reserva_id";
                  
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reserva_id", $reserva_id);
        return $stmt->execute();
    }

    // Buscar bandas por nombre para autocompletado
    public function buscarBandas($termino)
    {
        $query = "SELECT id, nombre_banda, contacto_email, tipo_agrupacion 
                  FROM clientes 
                  WHERE activo = 1 
                  AND nombre_banda LIKE :termino 
                  AND contacto_email IS NOT NULL 
                  AND contacto_email != ''
                  ORDER BY nombre_banda ASC 
                  LIMIT 10";
                  
        $stmt = $this->conn->prepare($query);
        $termino_like = "%{$termino}%";
        $stmt->bindParam(":termino", $termino_like);
        $stmt->execute();
        
        return $stmt;
    }

    // Calcular precio usando el nuevo sistema de tarifas (sin funciones MySQL)
    public function calcularPrecioReserva($cliente_id, $hora_inicio, $hora_fin)
    {
        error_log("=== CALCULANDO PRECIO CON NUEVO SISTEMA ===");
        error_log("Cliente ID: $cliente_id, Hora inicio: $hora_inicio, Hora fin: $hora_fin");
        
        // Obtener el tipo de agrupación del cliente
        $queryCliente = "SELECT tipo_agrupacion FROM clientes WHERE id = :cliente_id AND activo = 1";
        $stmtCliente = $this->conn->prepare($queryCliente);
        $stmtCliente->bindParam(":cliente_id", $cliente_id);
        $stmtCliente->execute();
        
        if ($stmtCliente->rowCount() == 0) {
            error_log("ERROR: Cliente no encontrado o inactivo");
            return false;
        }
        
        $cliente = $stmtCliente->fetch(PDO::FETCH_ASSOC);
        $tipo_agrupacion = $cliente['tipo_agrupacion'];
        
        // Calcular duración en PHP
        $duracion_horas = $this->calcularDuracionHoras($hora_inicio, $hora_fin);
        
        // Obtener precio usando consulta SQL
        $precio_calculado = $this->obtenerPrecioTarifa($tipo_agrupacion, $duracion_horas);
        
        error_log("Tipo agrupación: $tipo_agrupacion");
        error_log("Duración en horas: $duracion_horas");
        error_log("Precio calculado: $precio_calculado");
        error_log("=== FIN CÁLCULO PRECIO ===");
        
        return [
            'tipo_agrupacion' => $tipo_agrupacion,
            'duracion_horas' => $duracion_horas,
            'precio' => $precio_calculado
        ];
    }

    // Calcular duración en horas (método PHP)
    private function calcularDuracionHoras($hora_inicio, $hora_fin)
    {
        $inicio = new DateTime($hora_inicio);
        $fin = new DateTime($hora_fin);
        
        // Si hora_fin es menor que hora_inicio, agregar un día (cruce de medianoche)
        if ($fin <= $inicio) {
            $fin->add(new DateInterval('P1D'));
        }
        
        $diff = $inicio->diff($fin);
        $duracion_horas = $diff->h + ($diff->i / 60);
        
        // Redondear a 1 decimal
        return round($duracion_horas, 1);
    }

    // Obtener precio desde tabla tarifas (método PHP)
    private function obtenerPrecioTarifa($tipo_agrupacion, $duracion_horas)
    {
        // Buscar tarifa exacta (precio fijo)
        $queryFijo = "SELECT precio_fijo FROM tarifas 
                      WHERE tipo_agrupacion = :tipo_agrupacion 
                        AND duracion_min = :duracion_horas 
                        AND duracion_max = :duracion_horas 
                        AND precio_fijo IS NOT NULL
                        AND activo = TRUE
                      LIMIT 1";
                      
        $stmtFijo = $this->conn->prepare($queryFijo);
        $stmtFijo->bindParam(":tipo_agrupacion", $tipo_agrupacion);
        $stmtFijo->bindParam(":duracion_horas", $duracion_horas);
        $stmtFijo->execute();
        
        if ($stmtFijo->rowCount() > 0) {
            $row = $stmtFijo->fetch(PDO::FETCH_ASSOC);
            return $row['precio_fijo'];
        }
        
        // Buscar tarifa variable (precio por hora)
        $queryVariable = "SELECT precio_por_hora FROM tarifas 
                         WHERE tipo_agrupacion = :tipo_agrupacion 
                           AND duracion_min <= :duracion_horas 
                           AND (duracion_max IS NULL OR duracion_max >= :duracion_horas)
                           AND precio_por_hora IS NOT NULL
                           AND activo = TRUE
                         ORDER BY duracion_min DESC
                         LIMIT 1";
                         
        $stmtVariable = $this->conn->prepare($queryVariable);
        $stmtVariable->bindParam(":tipo_agrupacion", $tipo_agrupacion);
        $stmtVariable->bindParam(":duracion_horas", $duracion_horas);
        $stmtVariable->execute();
        
        if ($stmtVariable->rowCount() > 0) {
            $row = $stmtVariable->fetch(PDO::FETCH_ASSOC);
            return $row['precio_por_hora'] * $duracion_horas;
        }
        
        // Si no se encuentra tarifa, retornar 0
        error_log("ADVERTENCIA: No se encontró tarifa para tipo: $tipo_agrupacion, duración: $duracion_horas");
        return 0;
    }

    // Método auxiliar para obtener precio por separado (para backwards compatibility)
    public function obtenerPrecioCalculado($cliente_id, $hora_inicio, $hora_fin)
    {
        $calculo = $this->calcularPrecioReserva($cliente_id, $hora_inicio, $hora_fin);
        return $calculo ? $calculo['precio'] : 0;
    }
}
?>