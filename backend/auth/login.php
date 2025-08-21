<?php
// Incluir configuración CORS
include_once __DIR__ . '/../config/cors.php';

// Solo continuar si no es preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

session_start();

include_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Obtener datos JSON del body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!empty($data['username']) && !empty($data['password'])) {
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
            
            // Verificar contraseña (password = 'password')
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
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>