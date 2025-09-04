<?php
// Cargar sistema de entorno - intentar diferentes rutas según la estructura
if (file_exists('../../backend/config/environment.php')) {
    // Desarrollo con estructura completa
    require_once '../../backend/config/environment.php';
} elseif (file_exists('../backend/config/environment.php')) {
    // Producción con backend en el mismo nivel
    require_once '../backend/config/environment.php';
} elseif (file_exists('./backend/config/environment.php')) {
    // Backend en el directorio actual
    require_once './backend/config/environment.php';
} else {
    // Fallback - crear configuración básica inline
    class Environment {
        public static function detect() {
            $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
            $isProduction = strpos($host, 'kyz.com.ar') !== false;
            
            return [
                'environment' => $isProduction ? 'production' : 'development',
                'debug' => !$isProduction,
                'allowed_origins' => $isProduction ? 
                    ['https://kyz.com.ar', 'https://www.kyz.com.ar'] : 
                    ['http://localhost:3000', 'http://127.0.0.1:3000'],
                'database' => [
                    'host' => 'localhost',
                    'database' => $isProduction ? 'kyzcomar_sala-ensayos' : 'sala_ensayos',
                    'username' => $isProduction ? 'kyzcomar_user-sala' : 'sala_user',
                    'password' => $isProduction ? 'salapassword' : 'salapassword'
                ]
            ];
        }
        
        public static function get($key, $default = null) {
            $config = self::detect();
            return $config[$key] ?? $default;
        }
        
        public static function isDevelopment() {
            return self::get('environment') === 'development';
        }
        
        public static function getAllowedOrigins() {
            return self::get('allowed_origins', []);
        }
        
        public static function setCorsHeaders() {
            // Verificar que los headers no hayan sido enviados
            if (headers_sent()) {
                error_log("WARNING: Headers ya enviados, no se pueden configurar CORS");
                return;
            }
            
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            $allowedOrigins = self::getAllowedOrigins();
            
            error_log("CORS Debug - Origin: '$origin'");
            error_log("CORS Debug - Allowed origins: " . implode(', ', $allowedOrigins));
            
            // En desarrollo, ser más permisivo
            if (self::isDevelopment()) {
                header("Access-Control-Allow-Origin: *");
            } elseif (in_array($origin, $allowedOrigins)) {
                header("Access-Control-Allow-Origin: $origin");
            }
            
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Access-Control-Allow-Credentials: true');
        }
        
        public static function getDatabase() {
            $config = self::detect();
            $dbConfig = $config['database'];
            
            // Debug: mostrar configuración
            if (self::isDevelopment()) {
                error_log("Configuración BD: " . print_r($dbConfig, true));
            }
            
            try {
                $pdo = new PDO(
                    "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['database'] . ";charset=utf8",
                    $dbConfig['username'],
                    $dbConfig['password']
                );
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->exec("SET time_zone = '-03:00'");
                return $pdo;
            } catch(PDOException $e) {
                if (Environment::isDevelopment()) error_log("Error PDO: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
                exit();
            }
        }
    }
}

// Función helper para resolver rutas de archivos backend
function resolveBackendPath($relativePath) {
    $possiblePaths = [
        '../../backend/' . $relativePath,  // Desarrollo con public/api/
        '../backend/' . $relativePath,     // Producción con api/ en root
        './backend/' . $relativePath,      // Producción con backend en mismo nivel
        $relativePath                      // Directo
    ];
    
    $currentDir = __DIR__;
    error_log("resolveBackendPath - Directorio actual: " . $currentDir);
    error_log("resolveBackendPath - Buscando: " . $relativePath);
    
    foreach ($possiblePaths as $path) {
        $absolutePath = realpath($path);
        error_log("Verificando ruta: $path -> " . ($absolutePath ? $absolutePath : 'NO EXISTE'));
        
        if (file_exists($path)) {
            error_log("✓ Archivo encontrado en: " . $path);
            return $path;
        }
    }
    
    // Si no encuentra el archivo, throw error with debug info
    $checkedPaths = implode(', ', $possiblePaths);
    $errorMsg = "No se pudo encontrar: $relativePath. Directorio actual: $currentDir. Rutas verificadas: $checkedPaths";
    error_log("ERROR: " . $errorMsg);
    throw new Exception($errorMsg);
}

// Logging TEMPORAL - siempre logear (ANTES de headers)
error_log("=== API INDEX.PHP LLAMADO ===");
error_log("REQUEST_URI: " . $_SERVER['REQUEST_URI']);
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'No definido'));
error_log("Environment: " . Environment::get('environment'));

// Configurar CORS dinámicamente (DESPUÉS del logging)
Environment::setCorsHeaders();

if (Environment::isDevelopment()) {
    error_log("Environment: " . Environment::get('environment'));
}

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener la ruta desde la URL
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

error_log("Path parseado: " . $path);

// Limpiar path - remover diferentes prefijos según el entorno
$path = str_replace('/public/api', '', $path);  // Desarrollo con public/api/
$path = str_replace('/sala-ensayos/api', '', $path);  // Producción con /sala-ensayos/api
$path = preg_replace('#^/api(?=/|$)#', '', $path);  // Docker - solo /api al inicio
$path = preg_replace('#^/[^/]+/api#', '', $path);  // Cualquier subdirectorio/api
$path = trim($path, '/');

error_log("Path limpio: " . $path);

// Routing básico - TEMPORAL: logear cada caso
error_log("Evaluando routing para path: '$path'");
error_log("¿strpos(\$path, 'reservas') === 0? " . (strpos($path, 'reservas') === 0 ? 'SI' : 'NO'));
error_log("¿strpos(\$path, 'public-reservas') === 0? " . (strpos($path, 'public-reservas') === 0 ? 'SI' : 'NO'));

switch(true) {
    case strpos($path, 'public-reservas') === 0:
        error_log("=== PUBLIC-RESERVAS ENDPOINT ===");
        error_log("Redirigiendo a ReservaPublicaController");
        error_log("Current directory: " . __DIR__);
        error_log("Path limpio: " . $path);
        
        try {
            $controllerPath = resolveBackendPath('controllers/ReservaPublicaController.php');
            error_log("Ruta del controlador resuelto: " . $controllerPath);
            
            if (!file_exists($controllerPath)) {
                error_log("ERROR: ReservaPublicaController.php no existe en: " . $controllerPath);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Controlador no encontrado']);
                break;
            }
            
            include_once $controllerPath;
            
            // Instanciar y ejecutar el controlador
            require_once resolveBackendPath('config/database.php');
            $database = new Database();
            $db = $database->getConnection();
            $controller = new ReservaPublicaController($db);
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $path);
            
        } catch (Exception $e) {
            error_log("Exception en public-reservas: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            http_response_code(500);
            // TEMPORAL: Mostrar error completo para debugging
            echo json_encode([
                'success' => false, 
                'message' => 'Error del servidor en api/index.php', 
                'debug_error' => $e->getMessage(),
                'debug_file' => $e->getFile(),
                'debug_line' => $e->getLine(),
                'debug_trace' => explode("\n", $e->getTraceAsString())
            ]);
        }
        break;
        
    case strpos($path, 'reservas') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a ReservaController");
        try {
            include_once resolveBackendPath('controllers/ReservaController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'clientes') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a ClienteController");
        try {
            include_once resolveBackendPath('controllers/ClienteController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'productos') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a ProductoController");
        try {
            include_once resolveBackendPath('controllers/ProductoController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'tarifas') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a TarifaController");
        try {
            include_once resolveBackendPath('controllers/TarifaController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'ventas') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a VentaController");
        try {
            include_once resolveBackendPath('controllers/VentaController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'salas') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a SalaController");
        try {
            include_once resolveBackendPath('controllers/SalaController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'checkin') === 0:
        if (Environment::isDevelopment()) error_log("Redirigiendo a CheckinController");
        try {
            include_once resolveBackendPath('controllers/CheckinController.php');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
        break;
        
    case strpos($path, 'auth') === 0:
        if (Environment::isDevelopment()) error_log("Manejando autenticación");
        
        // Manejar login
        if (strpos($path, 'auth/login') === 0) {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Obtener datos JSON del body
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                if (!empty($data['username']) && !empty($data['password'])) {
                    try {
                        // Usar las mismas credenciales que funcionan para reservas
                        require_once resolveBackendPath('config/database.php');
                        $database = new Database();
                        $db = $database->getConnection();
                        
                        $query = "SELECT id, username, password_hash, email, rol, nombre_completo 
                                  FROM usuarios 
                                  WHERE username = :username AND activo = 1";
                        
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':username', $data['username']);
                        $stmt->execute();
                        
                        if ($stmt->rowCount() == 1) {
                            $user = $stmt->fetch(PDO::FETCH_ASSOC);
                            
                            // Verificar contraseña
                            if (password_verify($data['password'], $user['password_hash'])) {
                                // Actualizar último login
                                $updateQuery = "UPDATE usuarios SET ultimo_login = NOW() WHERE id = :id";
                                $updateStmt = $db->prepare($updateQuery);
                                $updateStmt->bindParam(':id', $user['id']);
                                $updateStmt->execute();
                                
                                // Crear token 
                                $tokenData = [
                                    'id' => $user['id'],
                                    'username' => $user['username'],
                                    'rol' => $user['rol'],
                                    'exp' => time() + (24 * 60 * 60) // 24 horas
                                ];
                                
                                $token = base64_encode(json_encode($tokenData));
                                
                                http_response_code(200);
                                echo json_encode([
                                    'success' => true,
                                    'message' => 'Login exitoso',
                                    'token' => $token,
                                    'user' => [
                                        'id' => $user['id'],
                                        'username' => $user['username'],
                                        'email' => $user['email'],
                                        'rol' => $user['rol'],
                                        'nombre_completo' => $user['nombre_completo']
                                    ]
                                ]);
                            } else {
                                http_response_code(401);
                                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
                            }
                        } else {
                            http_response_code(401);
                            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                        }
                    } catch (Exception $e) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Error del servidor']);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Endpoint de autenticación no encontrado']);
        }
        break;
        
    default:
        if (Environment::isDevelopment()) error_log("Ruta no encontrada: " . $path);
        http_response_code(404);
        echo json_encode(array("message" => "Ruta no encontrada"));
        break;
}
?>