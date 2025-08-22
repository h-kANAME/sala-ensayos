<?php
// Script para mostrar usuarios existentes
include_once 'config/database.php';

echo "<h2>🧪 Test - Sistema de Usuarios</h2>";

try {
    // Conectar base de datos
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Conexión a base de datos OK<br>";

    // Verificar usuarios existentes
    $query = "SELECT id, username, email, rol, nombre_completo, activo, ultimo_login, fecha_creacion FROM usuarios ORDER BY id";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $usuarios = [];
    $count = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $usuarios[] = $row;
        $count++;
    }
    
    echo "<h3>👥 Usuarios encontrados: $count</h3>";
    
    if ($count > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID</th><th>Username</th><th>Email</th><th>Rol</th><th>Nombre Completo</th><th>Activo</th><th>Último Login</th>";
        echo "</tr>";
        
        foreach ($usuarios as $usuario) {
            echo "<tr>";
            echo "<td>" . $usuario['id'] . "</td>";
            echo "<td><strong>" . $usuario['username'] . "</strong></td>";
            echo "<td>" . $usuario['email'] . "</td>";
            echo "<td>" . $usuario['rol'] . "</td>";
            echo "<td>" . $usuario['nombre_completo'] . "</td>";
            echo "<td>" . ($usuario['activo'] ? '✅' : '❌') . "</td>";
            echo "<td>" . ($usuario['ultimo_login'] ?? 'Nunca') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<hr>";
        echo "<h3>🔑 Información de credenciales:</h3>";
        echo "<p><strong>Nota:</strong> Según el código, todos los usuarios parecen usar la contraseña: <code>password</code></p>";
        echo "<p><strong>Específicamente para operario1:</strong></p>";
        echo "<ul>";
        echo "<li><strong>Usuario:</strong> operario1</li>";
        echo "<li><strong>Contraseña:</strong> password</li>";
        echo "</ul>";
        
    } else {
        echo "❗ No hay usuarios en la base de datos.<br>";
        echo "💡 Puede que necesites ejecutar un script de inicialización o insertar usuarios manualmente.<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "💡 Verifica que la tabla 'usuarios' exista en la base de datos.<br>";
}
?>