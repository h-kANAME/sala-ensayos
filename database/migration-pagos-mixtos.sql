-- Migración para soportar pagos mixtos en el sistema de ventas
-- Fecha: 2025-01-04

USE sala_ensayos;

-- Paso 1: Agregar nuevos campos a la tabla ventas para pagos mixtos
ALTER TABLE ventas 
ADD COLUMN anulada BOOLEAN DEFAULT FALSE AFTER notas,
ADD COLUMN monto_efectivo DECIMAL(10,2) NULL DEFAULT NULL AFTER tipo_pago,
ADD COLUMN monto_transferencia DECIMAL(10,2) NULL DEFAULT NULL AFTER monto_efectivo;

-- Paso 2: Modificar el ENUM de tipo_pago para incluir 'mixto'
ALTER TABLE ventas 
MODIFY COLUMN tipo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'mixto') NOT NULL;

-- Paso 3: Actualizar registros existentes para compatibilidad
-- Los pagos existentes tendrán el monto completo en el método correspondiente
UPDATE ventas SET 
    monto_efectivo = total,
    monto_transferencia = 0
WHERE tipo_pago = 'efectivo';

UPDATE ventas SET 
    monto_efectivo = 0,
    monto_transferencia = total
WHERE tipo_pago IN ('transferencia', 'tarjeta');

-- Paso 4: Crear constraint para validar que la suma de montos sea igual al total
-- Solo para pagos mixtos
DELIMITER //
CREATE TRIGGER tr_validar_pagos_mixtos_insert
    BEFORE INSERT ON ventas
    FOR EACH ROW
BEGIN
    -- Validar pagos mixtos
    IF NEW.tipo_pago = 'mixto' THEN
        -- Debe tener ambos montos definidos y mayores a 0
        IF NEW.monto_efectivo IS NULL OR NEW.monto_transferencia IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los pagos mixtos deben especificar monto_efectivo y monto_transferencia';
        END IF;
        
        IF NEW.monto_efectivo <= 0 OR NEW.monto_transferencia <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los montos de pago mixto deben ser mayores a cero';
        END IF;
        
        -- La suma debe ser igual al total
        IF ABS((NEW.monto_efectivo + NEW.monto_transferencia) - NEW.total) > 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La suma de monto_efectivo y monto_transferencia debe ser igual al total';
        END IF;
    END IF;
    
    -- Validar pagos simples
    IF NEW.tipo_pago IN ('efectivo', 'transferencia', 'tarjeta') THEN
        -- Para pagos simples, uno debe ser igual al total y el otro debe ser 0
        IF NEW.tipo_pago = 'efectivo' THEN
            IF ABS(NEW.monto_efectivo - NEW.total) > 0.01 OR NEW.monto_transferencia != 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Para pago en efectivo, monto_efectivo debe ser igual al total y monto_transferencia debe ser 0';
            END IF;
        END IF;
        
        IF NEW.tipo_pago IN ('transferencia', 'tarjeta') THEN
            IF ABS(NEW.monto_transferencia - NEW.total) > 0.01 OR NEW.monto_efectivo != 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Para pago por transferencia/tarjeta, monto_transferencia debe ser igual al total y monto_efectivo debe ser 0';
            END IF;
        END IF;
    END IF;
END//

CREATE TRIGGER tr_validar_pagos_mixtos_update
    BEFORE UPDATE ON ventas
    FOR EACH ROW
BEGIN
    -- Validar pagos mixtos
    IF NEW.tipo_pago = 'mixto' THEN
        -- Debe tener ambos montos definidos y mayores a 0
        IF NEW.monto_efectivo IS NULL OR NEW.monto_transferencia IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los pagos mixtos deben especificar monto_efectivo y monto_transferencia';
        END IF;
        
        IF NEW.monto_efectivo <= 0 OR NEW.monto_transferencia <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los montos de pago mixto deben ser mayores a cero';
        END IF;
        
        -- La suma debe ser igual al total
        IF ABS((NEW.monto_efectivo + NEW.monto_transferencia) - NEW.total) > 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La suma de monto_efectivo y monto_transferencia debe ser igual al total';
        END IF;
    END IF;
    
    -- Validar pagos simples
    IF NEW.tipo_pago IN ('efectivo', 'transferencia', 'tarjeta') THEN
        -- Para pagos simples, uno debe ser igual al total y el otro debe ser 0
        IF NEW.tipo_pago = 'efectivo' THEN
            IF ABS(NEW.monto_efectivo - NEW.total) > 0.01 OR NEW.monto_transferencia != 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Para pago en efectivo, monto_efectivo debe ser igual al total y monto_transferencia debe ser 0';
            END IF;
        END IF;
        
        IF NEW.tipo_pago IN ('transferencia', 'tarjeta') THEN
            IF ABS(NEW.monto_transferencia - NEW.total) > 0.01 OR NEW.monto_efectivo != 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Para pago por transferencia/tarjeta, monto_transferencia debe ser igual al total y monto_efectivo debe ser 0';
            END IF;
        END IF;
    END IF;
END//
DELIMITER ;

-- Paso 5: Crear vista para facilitar consultas de ventas con desglose de pagos
CREATE VIEW vista_ventas_detalle AS
SELECT 
    v.id,
    v.cliente_id,
    v.usuario_id,
    v.fecha_venta,
    v.total,
    v.tipo_pago,
    v.monto_efectivo,
    v.monto_transferencia,
    v.notas,
    v.anulada,
    c.nombre_banda as cliente_nombre,
    c.contacto_nombre as cliente_apellido,
    u.nombre_completo as usuario_nombre,
    CASE 
        WHEN v.tipo_pago = 'mixto' THEN CONCAT('Efectivo: $', FORMAT(v.monto_efectivo, 2), ' - Transferencia: $', FORMAT(v.monto_transferencia, 2))
        WHEN v.tipo_pago = 'efectivo' THEN CONCAT('Efectivo: $', FORMAT(v.total, 2))
        WHEN v.tipo_pago IN ('transferencia', 'tarjeta') THEN CONCAT('Transferencia: $', FORMAT(v.total, 2))
    END as detalle_pago
FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN usuarios u ON v.usuario_id = u.id;

-- Mostrar resultado de la migración
SELECT 'Migración completada exitosamente' as resultado;

-- Verificar estructura actualizada
DESCRIBE ventas;