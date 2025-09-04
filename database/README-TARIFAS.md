# Sistema de Tarifas por Tipo de Agrupación

## Resumen de Cambios

Este sistema implementa un nuevo modelo de tarifas diferenciadas por tipo de agrupación (Standard/Extended) y duración de reserva, reemplazando el modelo anterior de tarifa única por hora.

### Nuevas Funcionalidades

1. **Tipos de Agrupación**:
   - **Standard**: Bandas de 1 a 5 integrantes
   - **Extended**: Bandas de 6 o más integrantes

2. **Sistema de Tarifas**:
   - **Tarifas fijas**: Para duraciones de 1h, 1.5h y 2h
   - **Tarifas variables**: Para duraciones de 3h o más (precio por hora decreciente)

3. **Estructura de Precios**:
   ```
   Standard (1-5 integrantes):
   - 1 hora: $11,000 (fijo)
   - 1.5 horas: $13,000 (fijo)
   - 2 horas: $18,000 (fijo)
   - 3+ horas: $8,500/hora (variable)

   Extended (6+ integrantes):
   - 1 hora: $13,000 (fijo)
   - 1.5 horas: $16,000 (fijo)
   - 2 horas: $20,000 (fijo)
   - 3+ horas: $9,000/hora (variable)
   ```

## Instrucciones de Migración

### 1. Ejecutar la Migración SQL

```bash
# Conectarse al contenedor de MySQL
docker exec -it <nombre-contenedor-mysql> mysql -u root -p

# Ejecutar el script de migración
source /path/to/migration-tarifas-sistema.sql
```

### 2. Verificar la Migración

```bash
# Ejecutar el script de prueba
cd /xampp/htdocs/sala-ensayos
php test/test-tarifas-sistema.php
```

### 3. Verificar en Base de Datos

```sql
-- Verificar que se agregó el campo tipo_agrupacion
DESCRIBE clientes;

-- Verificar tabla de tarifas
SELECT * FROM tarifas ORDER BY tipo_agrupacion, duracion_min;

-- Verificar funciones SQL
SELECT calcular_duracion_horas('20:00:00', '22:30:00');
SELECT obtener_precio_reserva('Standard', 2.5);

-- Verificar vista
SELECT * FROM v_reservas_con_tarifas LIMIT 5;
```

## Cambios en el Código

### Backend

1. **Modelo Cliente**: Agregado campo `tipo_agrupacion`
2. **Modelo Reserva**: Nuevos métodos para cálculo de precios
3. **Controladores**: Actualización de lógica de precios en reservas
4. **Base de datos**: Nuevas funciones SQL y triggers

### Frontend (Requerido)

El frontend debe actualizarse para:

1. **ABM Clientes**:
   - Agregar campo "Tipo Agrupación" (Standard/Extended)
   - Solo editable desde el ABM, no durante reservas

2. **Sistema de Reservas**:
   - Mostrar precios calculados automáticamente
   - No permitir edición manual del precio

## Convivencia con Sistema Anterior

- El campo `tarifa_hora` en la tabla `salas` se mantiene por compatibilidad
- Las reservas existentes conservan su `importe_total` original
- Las nuevas reservas usan automáticamente el nuevo sistema
- Se registra el `tipo_agrupacion_usado` en cada reserva para auditoría

## Estructura de Archivos Modificados

```
backend/
├── models/
│   ├── Cliente.php (actualizado)
│   └── Reserva.php (actualizado)
├── controllers/
│   ├── ClienteController.php (actualizado)
│   ├── ReservaController.php (actualizado)
│   └── ReservaPublicaController.php (actualizado)
database/
├── migration-tarifas-sistema.sql (nuevo)
└── README-TARIFAS.md (nuevo)
test/
└── test-tarifas-sistema.php (nuevo)
```

## Funciones SQL Agregadas

1. **calcular_duracion_horas(hora_inicio, hora_fin)**:
   - Calcula duración en horas decimales
   - Retorna DECIMAL(3,1)

2. **obtener_precio_reserva(tipo_agrupacion, duracion_horas)**:
   - Calcula precio según reglas de negocio
   - Retorna DECIMAL(10,2)

## Triggers y Vistas

1. **tr_reservas_tipo_agrupacion**: Asigna automáticamente el tipo de agrupación en nuevas reservas
2. **v_reservas_con_tarifas**: Vista para consultas con precios calculados

## Pruebas Recomendadas

1. Crear clientes de ambos tipos (Standard/Extended)
2. Probar reservas de diferentes duraciones
3. Verificar cálculos de precio
4. Probar sistema de reservas públicas
5. Verificar retrocompatibilidad con reservas existentes

## Notas Importantes

- El sistema es **retrocompatible** con datos existentes
- Los clientes existentes se clasifican como "Standard" por defecto
- La migración es **segura** y no afecta reservas en curso
- Se mantienen logs detallados para auditoría

## Soporte y Troubleshooting

Si hay problemas con la migración:

1. Verificar que las funciones SQL se crearon correctamente
2. Revisar logs de error en PHP
3. Ejecutar el script de prueba
4. Verificar permisos de base de datos

Para rollback (si es necesario):
```sql
-- Revertir cambios (usar con precaución)
DROP TABLE IF EXISTS tarifas;
ALTER TABLE clientes DROP COLUMN tipo_agrupacion;
ALTER TABLE reservas DROP COLUMN tipo_agrupacion_usado;
DROP FUNCTION IF EXISTS calcular_duracion_horas;
DROP FUNCTION IF EXISTS obtener_precio_reserva;
DROP VIEW IF EXISTS v_reservas_con_tarifas;
```