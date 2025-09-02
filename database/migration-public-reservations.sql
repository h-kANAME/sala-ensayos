-- Migration para Sistema de Reservas Públicas con Verificación por Email
-- Fecha: 2025-08-26
-- IMPORTANTE: Ejecutar cada comando por separado para evitar errores

USE sala_ensayos;

-- Agregar campos de verificación a la tabla reservas (uno por uno)
ALTER TABLE reservas 
ADD COLUMN codigo_verificacion VARCHAR(6) DEFAULT NULL AFTER notas;

ALTER TABLE reservas 
ADD COLUMN intentos_verificacion INT DEFAULT 0 AFTER codigo_verificacion;

ALTER TABLE reservas 
ADD COLUMN fecha_expiracion_codigo DATETIME DEFAULT NULL AFTER intentos_verificacion;

ALTER TABLE reservas 
ADD COLUMN estado_verificacion ENUM('pendiente','verificado','expirado','bloqueado') DEFAULT 'pendiente' AFTER fecha_expiracion_codigo;

-- Modificar el campo usuario_id para permitir NULL (reservas públicas)
ALTER TABLE reservas 
MODIFY COLUMN usuario_id INT NULL;

-- Crear índice para búsquedas eficientes de códigos de verificación
CREATE INDEX idx_codigo_verificacion ON reservas(codigo_verificacion, estado_verificacion);

-- Crear índice para búsquedas de bandas (autocompletado)
CREATE INDEX idx_nombre_banda ON clientes(nombre_banda);
CREATE INDEX idx_contacto_email ON clientes(contacto_email);

-- Crear tabla para configuración del sistema de reservas públicas
CREATE TABLE configuracion_reservas_publicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT INTO configuracion_reservas_publicas (clave, valor, descripcion) VALUES
('url_publica_reservas', 'https://kyz.com.ar/sala-ensayos/reservas', 'URL pública para acceso al sistema de reservas'),
('emailjs_service_id', 'service_vqjf41e', 'Service ID de EmailJS para envío de códigos de verificación'),
('emailjs_template_codigo', 'template_e34j08k', 'Template ID para códigos de verificación'),
('emailjs_template_confirmacion', '', 'Template ID para confirmación de reservas'),
('emailjs_user_id', 'bAa_Sm9VX9RKw5KJq', 'Public Key de EmailJS'),
('codigo_expiracion_minutos', '15', 'Minutos antes de que expire un código de verificación'),
('max_intentos_verificacion', '3', 'Máximo número de intentos de verificación permitidos'),
('notificacion_emails', 'luipso@gmail.com, emmanuel.lopez@kyz.com.ar', 'Lista de emails separados por coma para notificaciones de nuevas reservas');

-- Crear tabla para logs de reservas públicas (auditoría)
CREATE TABLE logs_reservas_publicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    reserva_id INT NULL,
    accion ENUM('busqueda_banda', 'inicio_reserva', 'envio_codigo', 'intento_verificacion', 'verificacion_exitosa', 'reserva_confirmada', 'error') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    datos_adicionales JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);

-- Crear índices para logs
CREATE INDEX idx_logs_fecha ON logs_reservas_publicas(fecha_creacion);
CREATE INDEX idx_logs_accion ON logs_reservas_publicas(accion);

-- Comentarios sobre la estructura
-- Los campos agregados a la tabla reservas son:
-- - codigo_verificacion: código de 6 dígitos enviado por email
-- - intentos_verificacion: contador de intentos fallidos
-- - fecha_expiracion_codigo: timestamp cuando expira el código
-- - estado_verificacion: estado actual del proceso de verificación

-- IMPORTANTE: Ejecutar este script después de respaldar la base de datos existente