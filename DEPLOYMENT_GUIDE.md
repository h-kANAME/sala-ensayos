# Guía de Despliegue - Sistema de Reservas Públicas

## Resumen de Implementación

Se ha implementado un sistema completo de reservas públicas con verificación por email que incluye:

### 🎯 Funcionalidades Implementadas

1. **Sistema de Búsqueda de Bandas**
   - Búsqueda con autocompletado en tiempo real
   - Validación de bandas registradas con email

2. **Calendario de Disponibilidad**
   - Selección de salas y fechas
   - Verificación de disponibilidad en tiempo real
   - Interface intuitiva y responsive

3. **Sistema de Verificación por Email**
   - Códigos de 6 dígitos con expiración de 15 minutos
   - Máximo 3 intentos por código
   - Integración con EmailJS

4. **Backend API Completo**
   - Endpoints seguros para todas las operaciones
   - Sistema de auditoría y logs
   - Validaciones de seguridad

## 📋 Pasos de Despliegue

### 1. Instalar Dependencias

```bash
# Instalar EmailJS para React
npm install @emailjs/browser

# Si hay vulnerabilidades (opcional)
npm audit fix
```

### 2. Base de Datos

```sql
-- Ejecutar migration-public-reservations.sql
-- Esto agregará los campos necesarios y tablas de configuración
SOURCE /ruta/database/migration-public-reservations.sql;

-- Verificar que se crearon las tablas
SHOW TABLES LIKE '%public%';
DESCRIBE reservas;
```

### 3. Configuración de EmailJS

1. **Crear cuenta en EmailJS.com**
2. **Configurar servicio de email** (Gmail, Outlook, etc.)
3. **Crear templates de email** (ver EMAILJS_SETUP.md)
4. **Actualizar configuración**:

```javascript
// En reservas.html línea ~86
const EMAILJS_CONFIG = {
    serviceId: 'service_vqjf41e',
    templateId: 'template_e34j08k',
    userId: 'tu_user_id'
};
```

### 4. Configuración de Base de Datos

```sql
-- Actualizar configuración EmailJS en BD
UPDATE configuracion_reservas_publicas 
SET valor = 'tu_service_id' WHERE clave = 'emailjs_service_id';

UPDATE configuracion_reservas_publicas 
SET valor = 'tu_template_id' WHERE clave = 'emailjs_template_codigo';

UPDATE configuracion_reservas_publicas 
SET valor = 'tu_user_id' WHERE clave = 'emailjs_user_id';

-- Configurar emails de notificación (opcional)
UPDATE configuracion_reservas_publicas 
SET valor = 'luipso@gmail.com, emmanuel.lopez@kyz.com.ar' 
WHERE clave = 'notificacion_emails';
```

### 5. Archivos a Verificar

Asegurarse de que existen estos archivos:

```
C:\xampp\htdocs\sala-ensayos\
├── backend\controllers\ReservaPublicaController.php ✅
├── database\migration-public-reservations.sql ✅
├── public\reservas.html ✅
├── public\.htaccess ✅ (actualizado)
├── src\components\reservas-publicas\ ✅
│   ├── PublicReservationLanding.js
│   ├── PublicReservationLanding.css
│   ├── BandSearch.js
│   ├── BandSearch.css
│   ├── AvailabilityCalendar.js
│   ├── AvailabilityCalendar.css
│   ├── VerificationForm.js
│   └── VerificationForm.css
└── src\pages\ReservasPublicas.js ✅
```

### 6. Verificar API Endpoints

Probar que estos endpoints funcionen:

```bash
# Búsqueda de bandas
GET /api/public-reservas/search-bands?q=rock

# Disponibilidad
GET /api/public-reservas/availability?sala_id=1&fecha=2025-08-27

# Listar salas
GET /api/public-reservas/salas

# Iniciar reserva (POST)
POST /api/public-reservas/start-reservation

# Verificar código (POST)
POST /api/public-reservas/verify-code
```

### 7. URLs de Acceso

#### Desarrollo (DOCKER):
- Reservas públicas: `http://localhost:8080/public/reservas-local.html`
- Admin interface:  `http://localhost:3000/`

#### Producción:
- Reservas públicas: `https://kyz.com.ar/sala-ensayos/reservas.html`
- Admin interface:  `https://kyz.com.ar/sala-ensayos/` (si existe) 

#### Producción:
- Reservas públicas: `https://kyz.com.ar/sala-ensayos/reservas`
- Admin interface: `https://kyz.com.ar/sala-ensayos/`

## 🔒 Configuraciones de Seguridad

### Rate Limiting (Recomendado)
Implementar en servidor web:

```apache
# En .htaccess o configuración del servidor
<IfModule mod_evasive.c>
    DOSHashTableSize    512
    DOSPageCount        3
    DOSPageInterval     1
    DOSEmailNotify      admin@kyz.com.ar
</IfModule>
```

### CORS Configuration
Ya configurado en `backend/config/environment.php`:
- Desarrollo: `localhost:3000`, `127.0.0.1:3000`
- Producción: `kyz.com.ar`, `www.kyz.com.ar`

## 🧪 Testing

### 1. Test Manual del Flujo Completo

1. **Acceder a** `/reservas`
2. **Buscar banda:** Escribir nombre de banda existente
3. **Seleccionar slot:** Elegir fecha y horario disponible
4. **Verificar email:** Ingresar código recibido
5. **Confirmar:** Verificar que se muestra confirmación

### 2. Test de API

```bash
# Test de búsqueda
curl "http://localhost/sala-ensayos/public/api/public-reservas/search-bands?q=test"

# Test de disponibilidad
curl "http://localhost/sala-ensayos/public/api/public-reservas/availability?sala_id=1&fecha=2025-08-27"
```

## 📊 Monitoreo

### Logs a Revisar

1. **PHP Error Log:** Errores del servidor
2. **Tabla `logs_reservas_publicas`:** Actividad del sistema
3. **EmailJS Dashboard:** Estadísticas de envío

```sql
-- Ver logs de actividad
SELECT * FROM logs_reservas_publicas 
ORDER BY fecha_creacion DESC 
LIMIT 50;

-- Ver reservas pendientes de verificación
SELECT * FROM reservas 
WHERE estado_verificacion = 'pendiente' 
AND fecha_expiracion_codigo > NOW();
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **EmailJS no envía emails**
   - Verificar configuración en reservas.html
   - Revisar cuota en dashboard de EmailJS
   - Validar template IDs

2. **API returns 404**
   - Verificar .htaccess configuration
   - Comprobar que ReservaPublicaController.php existe
   - Revisar permisos de archivos

3. **CORS errors**
   - Verificar configuración en Environment.php
   - Comprobar que el dominio está en allowed_origins

4. **Base de datos errors**
   - Ejecutar migration-public-reservations.sql
   - Verificar conexión en config/database.php

## 🔄 Mantenimiento

### Tareas Periódicas

1. **Limpiar códigos expirados** (diario):
```sql
UPDATE reservas 
SET estado = 'cancelada', estado_verificacion = 'expirado'
WHERE estado_verificacion = 'pendiente' 
AND fecha_expiracion_codigo < NOW();
```

2. **Revisar logs** (semanal):
```sql
DELETE FROM logs_reservas_publicas 
WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

3. **Monitorear EmailJS quota** (mensual)

## 🎉 Funcionalidades Futuras

Extensiones posibles:
- Notificaciones SMS
- Pago online integrado
- Recordatorios automáticos
- Sistema de promociones
- Analytics avanzado

## 📞 Soporte

Para problemas técnicos:
1. Revisar logs del servidor
2. Verificar configuración de EmailJS
3. Comprobar conexión de base de datos
4. Validar permisos de archivos

---

**Fecha de Implementación:** Agosto 2025  
**Versión:** 1.0.0  
**Desarrollado con:** PHP 8.x, React 18, EmailJS, MySQL 8.x