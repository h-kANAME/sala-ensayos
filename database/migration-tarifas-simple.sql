-- Migración simplificada sin funciones MySQL
-- Para usuarios sin permisos SUPER

USE sala_ensayos;

-- 1. Agregar campo tipo_agrupacion a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN tipo_agrupacion ENUM('Standard', 'Extended') DEFAULT 'Standard' NOT NULL
AFTER contacto_telefono;

-- 2. Actualizar todos los clientes existentes como 'Standard' por defecto
UPDATE clientes SET tipo_agrupacion = 'Standard' WHERE tipo_agrupacion IS NULL;

-- 3. Crear tabla de tarifas
CREATE TABLE tarifas (
    id_tarifa INT PRIMARY KEY AUTO_INCREMENT,
    tipo_agrupacion ENUM('Standard', 'Extended') NOT NULL,
    duracion_min DECIMAL(3,1) NOT NULL COMMENT 'Duración mínima en horas',
    duracion_max DECIMAL(3,1) NULL COMMENT 'Duración máxima en horas (NULL = infinito)',
    precio_fijo DECIMAL(10,2) NULL COMMENT 'Precio fijo para duraciones específicas',
    precio_por_hora DECIMAL(10,2) NULL COMMENT 'Precio por hora para duraciones variables',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo_duracion (tipo_agrupacion, duracion_min, duracion_max)
);

-- 4. Insertar tarifas según la especificación
INSERT INTO tarifas (tipo_agrupacion, duracion_min, duracion_max, precio_fijo, precio_por_hora) VALUES
-- Tarifas Standard
('Standard', 1.0, 1.0, 11000.00, NULL),
('Standard', 1.5, 1.5, 13000.00, NULL),
('Standard', 2.0, 2.0, 18000.00, NULL),
('Standard', 3.0, NULL, NULL, 8500.00),

-- Tarifas Extended
('Extended', 1.0, 1.0, 13000.00, NULL),
('Extended', 1.5, 1.5, 16000.00, NULL),
('Extended', 2.0, 2.0, 20000.00, NULL),
('Extended', 3.0, NULL, NULL, 9000.00);

-- 5. Agregar columna para almacenar el tipo de agrupación usado en cada reserva (para auditoría)
ALTER TABLE reservas 
ADD COLUMN tipo_agrupacion_usado ENUM('Standard', 'Extended') NULL
AFTER horas_reservadas;

-- 6. Índices adicionales para optimizar consultas
CREATE INDEX idx_clientes_tipo_agrupacion ON clientes(tipo_agrupacion);
CREATE INDEX idx_reservas_tipo_agrupacion ON reservas(tipo_agrupacion_usado);

-- Verificaciones finales
SELECT 'Migración completada correctamente. Verificando datos...' as mensaje;

-- Mostrar las tarifas creadas
SELECT * FROM tarifas ORDER BY tipo_agrupacion, duracion_min;

-- Mostrar algunos clientes con su nueva clasificación
SELECT id, nombre_banda, tipo_agrupacion FROM clientes LIMIT 5;