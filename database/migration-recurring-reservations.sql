-- Migration para agregar funcionalidad de reservas recurrentes
-- Fecha: 2025-01-05

USE sala_ensayos;

-- Agregar columnas para reservas recurrentes a la tabla reservas
ALTER TABLE reservas 
ADD COLUMN es_recurrente BOOLEAN DEFAULT FALSE AFTER notas,
ADD COLUMN tipo_recurrencia ENUM('semanal', 'mensual', 'anual') NULL AFTER es_recurrente,
ADD COLUMN fecha_fin_recurrencia DATE NULL AFTER tipo_recurrencia,
ADD COLUMN reserva_padre_id INT NULL AFTER fecha_fin_recurrencia,
ADD COLUMN serie_recurrencia_id VARCHAR(36) NULL AFTER reserva_padre_id;

-- Agregar índices para mejorar performance
CREATE INDEX idx_reserva_padre ON reservas(reserva_padre_id);
CREATE INDEX idx_serie_recurrencia ON reservas(serie_recurrencia_id);
CREATE INDEX idx_es_recurrente ON reservas(es_recurrente);

-- Agregar comentarios a las columnas
ALTER TABLE reservas 
MODIFY COLUMN es_recurrente BOOLEAN DEFAULT FALSE COMMENT 'Indica si esta reserva es parte de una serie recurrente',
MODIFY COLUMN tipo_recurrencia ENUM('semanal', 'mensual', 'anual') NULL COMMENT 'Tipo de repetición: semanal (cada semana), mensual (mismo día del mes), anual (misma fecha cada año)',
MODIFY COLUMN fecha_fin_recurrencia DATE NULL COMMENT 'Fecha límite hasta la cual se generan las reservas recurrentes',
MODIFY COLUMN reserva_padre_id INT NULL COMMENT 'ID de la reserva original que generó esta serie recurrente (NULL para la reserva padre)',
MODIFY COLUMN serie_recurrencia_id VARCHAR(36) NULL COMMENT 'UUID que identifica a todas las reservas de una misma serie recurrente';

-- Insertar ejemplos de reservas recurrentes (comentado para evitar datos de prueba)
/*
-- Ejemplo: Banda que reserva todos los miércoles de 10:00 a 12:00 durante 3 meses
INSERT INTO reservas (cliente_id, sala_id, usuario_id, fecha_reserva, hora_inicio, hora_fin, horas_reservadas, estado, importe_total, es_recurrente, tipo_recurrencia, fecha_fin_recurrencia, serie_recurrencia_id, notas) VALUES
(1, 1, 1, '2025-01-08', '10:00:00', '12:00:00', 2, 'confirmada', 5000.00, TRUE, 'semanal', '2025-04-08', UUID(), 'Ensayo semanal - Los Rockeros');
*/