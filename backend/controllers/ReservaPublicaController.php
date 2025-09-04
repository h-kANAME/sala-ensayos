<?php

class ReservaPublicaController {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }

    public function processRequest($method, $path) {
        error_log("=== RESERVA PUBLICA REQUEST ===");
        error_log("Method: $method");
        error_log("Path: $path");
        
        // Permitir CORS
        $this->setCORSHeaders();
        
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
        
        $pathParts = explode('/', trim($path, '/'));
        error_log("Path parts: " . print_r($pathParts, true));
        
        switch ($method) {
            case 'GET':
                $this->handleGet($pathParts);
                break;
            case 'POST':
                $this->handlePost($pathParts);
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        }
    }
    
    private function setCORSHeaders() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Content-Type: application/json; charset=utf-8');
    }

    private function handleGet($pathParts) {
        // public-reservas/search-bands?q=termino
        if (count($pathParts) >= 2 && $pathParts[1] === 'search-bands') {
            $this->searchBands();
            return;
        }

        // public-reservas/salas
        if (count($pathParts) >= 2 && $pathParts[1] === 'salas') {
            $this->getSalas();
            return;
        }

        // public-reservas/check-availability?sala_id=X&fecha=Y
        if (count($pathParts) >= 2 && $pathParts[1] === 'check-availability') {
            $this->checkAvailability();
            return;
        }

        // public-reservas/verificar-banda?cliente_id=X&fecha=Y&hora_inicio=Z&hora_fin=W
        if (count($pathParts) >= 2 && $pathParts[1] === 'verificar-banda') {
            $this->verificarBanda();
            return;
        }

        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    }

    private function handlePost($pathParts) {
        // public-reservas/start-reservation
        if (count($pathParts) >= 2 && $pathParts[1] === 'start-reservation') {
            $this->startReservation();
            return;
        }

        // public-reservas/verify-code
        if (count($pathParts) >= 2 && $pathParts[1] === 'verify-code') {
            $this->verifyCode();
            return;
        }

        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    }

    // Verificar conflictos de banda
    private function verificarBanda() {
        $cliente_id = $_GET['cliente_id'] ?? '';
        $fecha = $_GET['fecha'] ?? '';
        $hora_inicio = $_GET['hora_inicio'] ?? '';
        $hora_fin = $_GET['hora_fin'] ?? '';

        if (empty($cliente_id) || empty($fecha) || empty($hora_inicio) || empty($hora_fin)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Parámetros incompletos']);
            return;
        }

        try {
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);
            
            $resultado = $reserva->verificarConflictoBanda($cliente_id, $fecha, $hora_inicio, $hora_fin);
            echo json_encode(['success' => true, 'data' => $resultado]);
            
        } catch (Exception $e) {
            error_log("Error en verificarBanda: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al verificar banda']);
        }
    }

    // Buscar bandas para autocompletado
    private function searchBands() {
        $termino = $_GET['q'] ?? '';
        
        if (strlen($termino) < 2) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }

        try {
            // Incluir modelo de Reserva que tiene el método de búsqueda
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);
            
            $stmt = $reserva->buscarBandas($termino);
            $bandas = [];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $bandas[] = [
                    'id' => $row['id'],
                    'nombre_banda' => $row['nombre_banda'],
                    'contacto_email' => $row['contacto_email'],
                    'tipo_agrupacion' => $row['tipo_agrupacion']
                ];
            }

            echo json_encode(['success' => true, 'data' => $bandas]);
            
        } catch (Exception $e) {
            error_log("Error en searchBands: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al buscar bandas']);
        }
    }

    // Verificar disponibilidad de sala - devuelve horarios ocupados
    private function checkAvailability() {
        $sala_id = $_GET['sala_id'] ?? '';
        $fecha = $_GET['fecha'] ?? '';

        if (empty($sala_id) || empty($fecha)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Parámetros incompletos']);
            return;
        }

        try {
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);
            
            // Obtener horarios ocupados para mostrar al cliente
            $horariosOcupados = [];
            
            // Consultar todas las reservas activas para esta sala y fecha
            $query = "SELECT hora_inicio, hora_fin, estado FROM reservas 
                      WHERE sala_id = :sala_id 
                      AND DATE(fecha_reserva) = :fecha 
                      ORDER BY hora_inicio";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':sala_id', $sala_id);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->execute();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Solo incluir reservas que deben mostrarse como ocupadas
                // NO incluir solo: cancelada
                if ($row['estado'] !== 'cancelada') {
                    $horariosOcupados[] = [
                        'hora_inicio' => $row['hora_inicio'],
                        'hora_fin' => $row['hora_fin']
                    ];
                }
            }

            echo json_encode([
                'success' => true, 
                'data' => ['horarios_ocupados' => $horariosOcupados]
            ]);
            
        } catch (Exception $e) {
            error_log("Error en checkAvailability: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al verificar disponibilidad']);
        }
    }

    // Obtener todas las salas disponibles
    private function getSalas() {
        error_log("=== EJECUTANDO getSalas ===");
        try {
            include_once resolveBackendPath('models/Sala.php');
            error_log("Modelo Sala incluido");
            $sala = new Sala($this->db);
            error_log("Instancia Sala creada");
            
            $stmt = $sala->obtenerTodas();
            error_log("Método obtenerTodas() ejecutado");
            $salas = [];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $salas[] = [
                    'id' => $row['id'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'capacidad' => $row['capacidad'],
                    'equipamiento' => $row['equipamiento']
                ];
            }

            // También devolver configuración de horarios de funcionamiento
            $configuracion = [
                'hora_apertura' => '09:00:00',
                'hora_cierre' => '23:00:00'
            ];

            echo json_encode(['success' => true, 'data' => $salas, 'configuracion' => $configuracion]);
            
        } catch (Exception $e) {
            error_log("Error en getSalas: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener salas']);
        }
    }

    // Iniciar proceso de reserva - SOLO generar código sin crear reserva
    private function startReservation() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        // Validar datos requeridos
        if (empty($data['cliente_id']) || empty($data['sala_id']) || 
            empty($data['fecha_reserva']) || empty($data['hora_inicio']) || 
            empty($data['hora_fin']) || empty($data['horas_reservadas'])) {
            
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            include_once resolveBackendPath('models/Reserva.php');
            include_once resolveBackendPath('models/Cliente.php');
            include_once resolveBackendPath('models/Sala.php');
            
            $reserva = new Reserva($this->db);
            $cliente = new Cliente($this->db);
            $sala = new Sala($this->db);

            // Obtener información del cliente
            $stmtCliente = $cliente->obtenerPorId($data['cliente_id']);
            if ($stmtCliente->rowCount() == 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Cliente no encontrado']);
                return;
            }
            $clienteData = $stmtCliente->fetch(PDO::FETCH_ASSOC);

            // Obtener información de la sala para calcular importe
            $stmtSala = $sala->obtenerPorId($data['sala_id']);
            if ($stmtSala->rowCount() == 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Sala no encontrada']);
                return;
            }
            $salaData = $stmtSala->fetch(PDO::FETCH_ASSOC);

            // Calcular importe total usando el nuevo sistema de tarifas
            $calculo_precio = $reserva->calcularPrecioReserva($data['cliente_id'], $data['hora_inicio'], $data['hora_fin']);
            
            if (!$calculo_precio) {
                error_log("ERROR: No se pudo calcular el precio con el nuevo sistema de tarifas");
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al calcular el precio de la reserva']);
                return;
            }
            
            $importe_total = $calculo_precio['precio'];
            
            error_log("Reserva pública - Tipo agrupación: {$calculo_precio['tipo_agrupacion']}, Duración: {$calculo_precio['duracion_horas']} horas, Precio: $importe_total");

            // Verificar disponibilidad EN TIEMPO REAL
            if (!$reserva->verificarDisponibilidad($data['sala_id'], $data['fecha_reserva'], 
                                                  $data['hora_inicio'], $data['hora_fin'])) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'El horario seleccionado ya no está disponible']);
                return;
            }

            // Verificar conflicto de horarios para la misma banda
            $conflictoBanda = $reserva->verificarConflictoBanda(
                $data['cliente_id'],
                $data['fecha_reserva'],
                $data['hora_inicio'],
                $data['hora_fin']
            );

            if (!$conflictoBanda['sin_conflicto']) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Esta banda ya tiene una reserva en ese horario: ' . $conflictoBanda['reservas_conflicto']]);
                return;
            }

            // NUEVO: Solo generar código y guardar datos temporalmente
            $resultado = $this->generarCodigoTemporal($data, $clienteData, $salaData, $importe_total);

            if ($resultado) {
                // Log de auditoría
                $this->logAuditoria($data['cliente_id'], $resultado['session_id'], 'inicio_proceso_reserva', [
                    'sala_id' => $data['sala_id'],
                    'fecha_reserva' => $data['fecha_reserva'],
                    'hora_inicio' => $data['hora_inicio'],
                    'hora_fin' => $data['hora_fin']
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Código de verificación enviado',
                    'data' => [
                        'reserva_id' => $resultado['session_id'], // Usamos session_id como identificador
                        'email_destino' => $clienteData['contacto_email'],
                        'codigo_para_envio' => $resultado['codigo_verificacion'],
                        'banda_nombre' => $clienteData['nombre_banda'],
                        'fecha_expiracion' => $resultado['fecha_expiracion'],
                        'sala_nombre' => $salaData['nombre'],
                        'importe_total' => $importe_total
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al iniciar el proceso de reserva']);
            }

        } catch (Exception $e) {
            error_log("Error en startReservation: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
        }
    }

    // NUEVO: Generar código temporal sin crear reserva
    private function generarCodigoTemporal($data, $clienteData, $salaData, $importe_total) {
        // Generar código de 6 dígitos
        $codigo = sprintf("%06d", mt_rand(0, 999999));
        $session_id = 'temp_' . uniqid() . '_' . time();
        $expiracion = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Guardar datos temporales en sesión/archivo/cache
        $datosTemporales = [
            'cliente_id' => $data['cliente_id'],
            'sala_id' => $data['sala_id'],
            'fecha_reserva' => $data['fecha_reserva'],
            'hora_inicio' => $data['hora_inicio'],
            'hora_fin' => $data['hora_fin'],
            'horas_reservadas' => $data['horas_reservadas'],
            'importe_total' => $importe_total,
            'codigo_verificacion' => $codigo,
            'fecha_expiracion' => $expiracion,
            'intentos' => 0,
            'cliente_data' => $clienteData,
            'sala_data' => $salaData
        ];

        // Guardar en archivo temporal
        $tempDir = sys_get_temp_dir() . '/reservas_temp/';
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $archivo = $tempDir . $session_id . '.json';
        file_put_contents($archivo, json_encode($datosTemporales));

        return [
            'session_id' => $session_id,
            'codigo_verificacion' => $codigo,
            'fecha_expiracion' => $expiracion
        ];
    }

    // MODIFICADO: Verificar código y crear reserva recién ahora
    private function verifyCode() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (empty($data['reserva_id']) || empty($data['codigo'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            // Cargar datos temporales
            $tempDir = sys_get_temp_dir() . '/reservas_temp/';
            $archivo = $tempDir . $data['reserva_id'] . '.json';

            if (!file_exists($archivo)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Sesión no encontrada o expirada']);
                return;
            }

            $datosTemporales = json_decode(file_get_contents($archivo), true);

            // Verificar expiración
            if (strtotime($datosTemporales['fecha_expiracion']) < time()) {
                unlink($archivo); // Eliminar archivo temporal
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El código de verificación ha expirado']);
                return;
            }

            // Verificar código
            if ($datosTemporales['codigo_verificacion'] !== $data['codigo']) {
                $datosTemporales['intentos']++;
                
                if ($datosTemporales['intentos'] >= 3) {
                    unlink($archivo); // Eliminar archivo temporal
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Se agotaron los 3 intentos. Deberás gestionar la reserva nuevamente.']);
                    return;
                } else {
                    // Guardar intentos actualizados
                    file_put_contents($archivo, json_encode($datosTemporales));
                    $intentos_restantes = 3 - $datosTemporales['intentos'];
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "Código incorrecto. Te quedan {$intentos_restantes} intento" . ($intentos_restantes !== 1 ? 's' : '') . "."]);
                    return;
                }
            }

            // ¡CÓDIGO CORRECTO! Ahora SÍ crear la reserva
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);

            // VERIFICAR DISPONIBILIDAD EN TIEMPO REAL NUEVAMENTE
            if (!$reserva->verificarDisponibilidad($datosTemporales['sala_id'], $datosTemporales['fecha_reserva'], 
                                                  $datosTemporales['hora_inicio'], $datosTemporales['hora_fin'])) {
                unlink($archivo);
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Lo sentimos, el horario ya no está disponible. Alguien más lo reservó mientras verificabas el código.']);
                return;
            }

            // Verificar conflicto de banda nuevamente
            $conflictoBanda = $reserva->verificarConflictoBanda(
                $datosTemporales['cliente_id'],
                $datosTemporales['fecha_reserva'],
                $datosTemporales['hora_inicio'],
                $datosTemporales['hora_fin']
            );

            if (!$conflictoBanda['sin_conflicto']) {
                unlink($archivo);
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Esta banda ya tiene una reserva en ese horario: ' . $conflictoBanda['reservas_conflicto']]);
                return;
            }

            // Crear reserva CONFIRMADA directamente
            $reservaId = $this->crearReservaConfirmada($datosTemporales);

            if ($reservaId) {
                // Eliminar archivo temporal
                unlink($archivo);

                // Log de auditoría
                $this->logAuditoria($datosTemporales['cliente_id'], $reservaId, 'reserva_confirmada_publica', [
                    'session_id' => $data['reserva_id']
                ]);

                echo json_encode([
                    'success' => true, 
                    'message' => 'Reserva confirmada exitosamente',
                    'data' => ['reserva_id' => $reservaId]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear la reserva']);
            }

        } catch (Exception $e) {
            error_log("Error en verifyCode: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
        }
    }

    // NUEVO: Crear reserva confirmada directamente
    private function crearReservaConfirmada($datos) {
        try {
            $query = "INSERT INTO reservas 
                     SET cliente_id=:cliente_id, sala_id=:sala_id, usuario_id=NULL,
                         fecha_reserva=:fecha_reserva, hora_inicio=:hora_inicio, hora_fin=:hora_fin,
                         horas_reservadas=:horas_reservadas, estado='confirmada', estado_actual='pendiente',
                         importe_total=:importe_total, estado_verificacion='verificado',
                         notas='Reserva pública confirmada'";

            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(":cliente_id", $datos['cliente_id']);
            $stmt->bindParam(":sala_id", $datos['sala_id']);
            $stmt->bindParam(":fecha_reserva", $datos['fecha_reserva']);
            $stmt->bindParam(":hora_inicio", $datos['hora_inicio']);
            $stmt->bindParam(":hora_fin", $datos['hora_fin']);
            $stmt->bindParam(":horas_reservadas", $datos['horas_reservadas']);
            $stmt->bindParam(":importe_total", $datos['importe_total']);

            if ($stmt->execute()) {
                return $this->db->lastInsertId();
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Error en crearReservaConfirmada: " . $e->getMessage());
            return false;
        }
    }

    // Log de auditoría simple
    private function logAuditoria($cliente_id, $referencia_id, $accion, $datos = []) {
        try {
            $log = [
                'timestamp' => date('Y-m-d H:i:s'),
                'cliente_id' => $cliente_id,
                'referencia_id' => $referencia_id,
                'accion' => $accion,
                'datos' => $datos,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ];
            
            error_log("AUDITORIA RESERVA PUBLICA: " . json_encode($log));
        } catch (Exception $e) {
            error_log("Error en log de auditoría: " . $e->getMessage());
        }
    }
}

?>