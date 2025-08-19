<?php
// Incluir configuración CORS
include_once '../config/cors.php';

// Solo continuar si no es preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Verificar token
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token no proporcionado']);
        exit;
    }
    
    $token = $matches[1];
    
    try {
        // Decodificar token
        $decoded = json_decode(base64_decode($token), true);
        
        if (!$decoded || !isset($decoded['id']) || !isset($decoded['exp'])) {
            throw new Exception('Token inválido');
        }
        
        // Verificar expiración
        if (time() > $decoded['exp']) {
            throw new Exception('Token expirado');
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "SELECT id, username, email, rol, nombre_completo 
                  FROM usuarios 
                  WHERE id = :id AND activo = 1";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $decoded['id']);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
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
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>