<?php
/**
 * Environment Configuration System
 * Detecta automáticamente el entorno y configura las variables correspondientes
 */

class Environment {
    private static $config = null;
    
    /**
     * Detecta automáticamente el entorno basándose en el dominio/host
     */
    public static function detect() {
        if (self::$config !== null) {
            return self::$config;
        }
        
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
        
        // Cargar variables de entorno desde .env si existe
        self::loadEnvFile();
        
        // Detectar si estamos en Docker
        $isDocker = file_exists('/.dockerenv') || getenv('DOCKER_ENV') === 'true';
        
        // Configuraciones por defecto
        if ($isDocker) {
            // Configuración para Docker
            $config = [
                'environment' => 'development',
                'debug' => true,
                'allowed_origins' => [
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://localhost:8080'
                ],
                'api_url' => 'http://localhost:8080/public/api',
                'database' => [
                    'host' => 'mysql',
                    'database' => 'sala_ensayos',
                    'username' => 'sala_user',
                    'password' => 'salapassword'
                ]
            ];
        } else {
            // Configuración local sin Docker
            $config = [
                'environment' => 'development',
                'debug' => true,
                'allowed_origins' => [
                    'http://localhost:3000',
                    'http://127.0.0.1:3000'
                ],
                'api_url' => 'http://localhost/sala-ensayos/public/api',
                'database' => [
                    'host' => 'localhost',
                    'database' => 'sala_ensayos',
                    'username' => 'root',
                    'password' => ''
                ]
            ];
        }
        
        // Detectar entorno de producción
        if (strpos($host, 'kyz.com.ar') !== false || 
            strpos($host, 'localhost') === false && strpos($host, '127.0.0.1') === false) {
            $config = [
                'environment' => 'production',
                'debug' => false,
                'allowed_origins' => [
                    'https://kyz.com.ar',
                    'https://www.kyz.com.ar'
                ],
                'api_url' => 'https://kyz.com.ar/sala-ensayos/api',
                'database' => [
                    'host' => getenv('DB_HOST') ?: 'localhost',
                    'database' => getenv('DB_NAME') ?: 'kyzcomar_sala-ensayos',
                    'username' => getenv('DB_USER') ?: 'kyzcomar_user-sala',
                    'password' => getenv('DB_PASSWORD') ?: 'salapassword'
                ]
            ];
        }
        
        // Sobrescribir con variables de entorno si existen
        if (getenv('ENVIRONMENT')) {
            $config['environment'] = getenv('ENVIRONMENT');
        }
        if (getenv('DEBUG') !== false) {
            $config['debug'] = getenv('DEBUG') === 'true';
        }
        if (getenv('ALLOWED_ORIGINS')) {
            $config['allowed_origins'] = explode(',', getenv('ALLOWED_ORIGINS'));
        }
        if (getenv('API_URL')) {
            $config['api_url'] = getenv('API_URL');
        }
        
        self::$config = $config;
        return $config;
    }
    
    /**
     * Obtiene una configuración específica
     */
    public static function get($key, $default = null) {
        $config = self::detect();
        return $config[$key] ?? $default;
    }
    
    /**
     * Verifica si estamos en entorno de desarrollo
     */
    public static function isDevelopment() {
        return self::get('environment') === 'development';
    }
    
    /**
     * Verifica si estamos en entorno de producción
     */
    public static function isProduction() {
        return self::get('environment') === 'production';
    }
    
    /**
     * Obtiene los orígenes permitidos para CORS
     */
    public static function getAllowedOrigins() {
        return self::get('allowed_origins', []);
    }
    
    /**
     * Verifica si un origen está permitido
     */
    public static function isOriginAllowed($origin) {
        return in_array($origin, self::getAllowedOrigins());
    }
    
    /**
     * Carga variables desde archivo .env
     */
    private static function loadEnvFile() {
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value, '"\'');
                    if (!getenv($name)) {
                        putenv("$name=$value");
                    }
                }
            }
        }
    }
    
    /**
     * Establece headers CORS dinámicamente
     */
    public static function setCorsHeaders() {
        // Verificar si los headers ya fueron enviados
        if (headers_sent()) {
            error_log("WARNING: Headers ya enviados, no se pueden configurar CORS");
            return;
        }
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = self::getAllowedOrigins();
        
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else if (self::isDevelopment()) {
            // En desarrollo, permitir localhost con cualquier puerto
            if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
                header("Access-Control-Allow-Origin: $origin");
            }
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
    }
}
?>