<?php

// Función helper para resolver rutas - puede no estar disponible si se ejecuta directamente
if (!function_exists('resolveBackendPath')) {
    function resolveBackendPath($relativePath) {
        $possiblePaths = [
            './' . $relativePath,              // Mismo directorio
            '../' . $relativePath,             // Nivel superior  
            './backend/' . $relativePath,      // Subdirectorio backend
        ];
        
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        throw new Exception("No se pudo encontrar: $relativePath");
    }
}

// Clase Environment básica si no existe
if (!class_exists('Environment')) {
    class Environment {
        public static function isDevelopment() {
            $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
            return strpos($host, 'kyz.com.ar') === false;
        }
    }
}

class ReservaPublicaController {
    private $db;

    public function __construct() {
        try {
            // Detectar si estamos en producción o desarrollo
            $serverHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
            $isProduction = strpos($serverHost, 'kyz.com.ar') !== false;
            
            if ($isProduction) {
                // Configuración para producción
                $host = 'localhost';
                $dbname = 'kyzcomar_sala-ensayos';
                $username = 'kyzcomar_user-sala';
                $password = 'salapassword';
            } else {
                // Configuración para desarrollo/Docker
                $host = 'mysql'; // nombre del servicio en docker-compose
                $dbname = 'sala_ensayos';
                $username = 'sala_user';
                $password = 'salapassword';
            }
            
            $this->db = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8",
                $username,
                $password
            );
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->exec("SET time_zone = '-03:00'");
        } catch (Exception $e) {
            error_log("Error conectando a base de datos: " . $e->getMessage());
            throw $e;
        }
    }

    public function handleRequest() {
        // Log para debugging - TEMPORAL: siempre logear
        error_log("=== RESERVA PUBLICA CONTROLLER ===");
        error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
        error_log("PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'No PATH_INFO'));
        error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);

        // Parsear la ruta
        $path = $_SERVER['REQUEST_URI'];
        $path = str_replace('/public/api', '', $path);
        $path = str_replace('/sala-ensayos/api', '', $path);
        $path = preg_replace('#^/[^/]+/api#', '', $path);
        $path = trim($path, '/');
        
        // Remover query parameters
        $path = parse_url($path, PHP_URL_PATH) ?: $path;
        $path = trim($path, '/');
        
        $pathParts = explode('/', $path);
        
        if (Environment::isDevelopment()) {
            error_log("Path parts: " . print_r($pathParts, true));
        }

        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                $this->handleGet($pathParts);
                break;
            case 'POST':
                $this->handlePost($pathParts);
                break;
            default:
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Método no permitido']);
                break;
        }
    }

    private function handleGet($pathParts) {
        // public-reservas/bands - alias para getSalas (compatibilidad)
        if (count($pathParts) >= 2 && $pathParts[1] === 'bands') {
            $this->getSalas();
            return;
        }
        
        // public-reservas/search-bands?q=termino
        if (count($pathParts) >= 2 && $pathParts[1] === 'search-bands') {
            $this->searchBands();
            return;
        }

        // public-reservas/availability?sala_id=1&fecha=2025-08-26
        if (count($pathParts) >= 2 && $pathParts[1] === 'availability') {
            $this->checkAvailability();
            return;
        }

        // public-reservas/salas - listar salas disponibles
        if (count($pathParts) >= 2 && $pathParts[1] === 'salas') {
            $this->getSalas();
            return;
        }

        // public-reservas/verificar-banda - verificar conflictos de banda
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
        $excluir_id = $_GET['excluir_id'] ?? null;

        if (empty($cliente_id) || empty($fecha) || empty($hora_inicio) || empty($hora_fin)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Parámetros incompletos']);
            return;
        }

        try {
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);
            
            $resultado = $reserva->verificarConflictoBanda(
                $cliente_id,
                $fecha,
                $hora_inicio,
                $hora_fin,
                $excluir_id
            );

            echo json_encode($resultado);
            
        } catch (Exception $e) {
            error_log("Error en verificarBanda: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al verificar conflictos']);
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
                    'contacto_email' => $row['contacto_email']
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
            // Incluye reservas confirmadas, pendientes y en proceso de verificación
            // para evitar dobles reservas en el mismo horario
            $query = "SELECT hora_inicio, hora_fin FROM reservas 
                      WHERE sala_id = :sala_id 
                      AND DATE(fecha_reserva) = :fecha 
                      AND estado IN ('confirmada', 'pendiente') 
                      AND estado_verificacion IN ('verificado', 'pendiente')
                      ORDER BY hora_inicio";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':sala_id', $sala_id);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->execute();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $horariosOcupados[] = [
                    'hora_inicio' => $row['hora_inicio'],
                    'hora_fin' => $row['hora_fin']
                ];
            }

            // También devolver configuración de horarios de funcionamiento
            $configuracion = [
                'hora_apertura' => '09:00:00',
                'hora_cierre' => '23:00:00'
            ];

            echo json_encode([
                'success' => true, 
                'data' => [
                    'horarios_ocupados' => $horariosOcupados,
                    'configuracion' => $configuracion
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Error en checkAvailability: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al verificar disponibilidad']);
        }
    }

    // Obtener lista de salas
    private function getSalas() {
        try {
            include_once resolveBackendPath('models/Sala.php');
            $sala = new Sala($this->db);
            
            $stmt = $sala->obtenerTodas();
            $salas = [];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $salas[] = [
                    'id' => $row['id'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'capacidad' => $row['capacidad'],
                    'equipamiento' => $row['equipamiento'],
                    'tarifa_hora' => $row['tarifa_hora']
                ];
            }

            echo json_encode(['success' => true, 'data' => $salas]);
            
        } catch (Exception $e) {
            error_log("Error en getSalas: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener salas']);
        }
    }

    // Iniciar proceso de reserva y enviar código de verificación
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

            // Calcular importe total
            $importe_total = $salaData['tarifa_hora'] * $data['horas_reservadas'];

            // Verificar disponibilidad
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

            // Iniciar proceso de verificación
            $resultado = $reserva->iniciarVerificacion(
                $data['cliente_id'],
                $data['sala_id'], 
                $data['fecha_reserva'],
                $data['hora_inicio'],
                $data['hora_fin'],
                $data['horas_reservadas'],
                $importe_total
            );

            if ($resultado) {
                // Log de auditoría
                $this->logAuditoria($data['cliente_id'], $resultado['reserva_id'], 'inicio_reserva', [
                    'sala_id' => $data['sala_id'],
                    'fecha_reserva' => $data['fecha_reserva'],
                    'hora_inicio' => $data['hora_inicio'],
                    'hora_fin' => $data['hora_fin']
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Código de verificación enviado',
                    'data' => [
                        'reserva_id' => $resultado['reserva_id'],
                        'email_destino' => $clienteData['contacto_email'],
                        'codigo_para_envio' => $resultado['codigo_verificacion'], // Solo para integración con EmailJS
                        'banda_nombre' => $clienteData['nombre_banda'],
                        'fecha_expiracion' => $resultado['fecha_expiracion'],
                        'sala_nombre' => $salaData['nombre'],
                        'importe_total' => $importe_total
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al procesar la reserva']);
            }

        } catch (Exception $e) {
            error_log("Error en startReservation: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
        }
    }

    // Verificar código de verificación
    private function verifyCode() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (empty($data['reserva_id']) || empty($data['codigo'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            include_once resolveBackendPath('models/Reserva.php');
            $reserva = new Reserva($this->db);

            $resultado = $reserva->verificarCodigo($data['reserva_id'], $data['codigo']);

            // Log de auditoría
            $accion = $resultado['success'] ? 'verificacion_exitosa' : 'intento_verificacion';
            $this->logAuditoria(null, $data['reserva_id'], $accion, [
                'codigo_ingresado' => $data['codigo'],
                'resultado' => $resultado['message']
            ]);

            if ($resultado['success']) {
                // Log adicional para reserva confirmada
                $this->logAuditoria(null, $data['reserva_id'], 'reserva_confirmada', []);
            }

            echo json_encode($resultado);

        } catch (Exception $e) {
            error_log("Error en verifyCode: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
        }
    }

    // Método helper para logging de auditoría
    private function logAuditoria($cliente_id, $reserva_id, $accion, $datosAdicionales = []) {
        try {
            $query = "INSERT INTO logs_reservas_publicas 
                      (cliente_id, reserva_id, accion, ip_address, user_agent, datos_adicionales) 
                      VALUES (:cliente_id, :reserva_id, :accion, :ip_address, :user_agent, :datos_adicionales)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':cliente_id', $cliente_id);
            $stmt->bindParam(':reserva_id', $reserva_id);
            $stmt->bindParam(':accion', $accion);
            $stmt->bindValue(':ip_address', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
            $stmt->bindValue(':user_agent', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
            $stmt->bindValue(':datos_adicionales', json_encode($datosAdicionales));
            
            $stmt->execute();
            
        } catch (Exception $e) {
            error_log("Error en logAuditoria: " . $e->getMessage());
            // No fallar la operación principal por un error de logging
        }
    }
}

// Ejecutar el controller
try {
    $controller = new ReservaPublicaController();
    $controller->handleRequest();
} catch (Exception $e) {
    error_log("Error fatal en ReservaPublicaController: " . $e->getMessage());
    http_response_code(500);
    // TEMPORAL: Mostrar error real para debugging
    echo json_encode(['success' => false, 'message' => 'Error del servidor', 'debug_error' => $e->getMessage(), 'debug_file' => $e->getFile(), 'debug_line' => $e->getLine()]);
}
?>