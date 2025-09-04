-- Script para eliminar el campo tarifa_hora de la tabla salas
-- Ejecutar después de haber actualizado todo el código

USE sala_ensayos;

-- Verificar que el nuevo sistema de tarifas esté funcionando
-- antes de eliminar el campo legacy
SELECT 'Verificando sistema de tarifas...' as mensaje;

-- Verificar que existe la tabla tarifas
SELECT COUNT(*) as tarifas_configuradas FROM tarifas WHERE activo = TRUE;

-- Verificar que existen clientes con tipo_agrupacion
SELECT 
    tipo_agrupacion,
    COUNT(*) as cantidad_clientes 
FROM clientes 
WHERE activo = TRUE 
GROUP BY tipo_agrupacion;

-- Si las verificaciones son correctas, proceder a eliminar el campo
SELECT 'Procediendo a eliminar campo tarifa_hora...' as mensaje;

-- 1. Eliminar el campo tarifa_hora de la tabla salas
ALTER TABLE salas DROP COLUMN tarifa_hora;

-- 2. Verificar que se eliminó correctamente
DESCRIBE salas;

-- 3. Mostrar la estructura final de la tabla salas
SELECT 'Estructura final de tabla salas:' as mensaje;
SHOW COLUMNS FROM salas;

SELECT 'Campo tarifa_hora eliminado exitosamente' as resultado;