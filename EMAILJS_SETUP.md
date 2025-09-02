# Configuración de EmailJS para Sistema de Reservas Públicas

## Pasos para configurar EmailJS

### 1. Crear cuenta en EmailJS
- Registrarse en https://www.emailjs.com/
- Verificar email y activar cuenta

### 2. Configurar servicio de email
- Ir a "Email Services" en el dashboard
- Agregar nuevo servicio (Gmail, Outlook, etc.)
- Seguir las instrucciones específicas del proveedor
- Anotar el **Service ID** generado

### 3. Crear template de email
- Ir a "Email Templates" en el dashboard
- Crear nuevo template con el siguiente contenido:

#### Template para código de verificación:
**Subject:** Código de verificación para tu reserva - {{banda_nombre}}

**Body:**
```
Hola {{banda_nombre}},

Has iniciado una reserva en nuestra sala de ensayos. Para confirmarla, ingresa el siguiente código de verificación:

**CÓDIGO: {{codigo_verificacion}}**

Detalles de tu reserva:
- Fecha: {{fecha_reserva}}
- Horario: {{hora_reserva}}
- Sala: {{sala_nombre}}
- Importe: ${{importe_total}}

Este código expira en 15 minutos. Si no fuiste tú quien inició esta reserva, ignora este email.

¡Gracias por elegirnos!
Equipo de la Sala de Ensayos
```

- Anotar el **Template ID** generado

### 4. Obtener Public Key (antes llamado User ID)
- Ir a "Account" → "General" 
- Copiar la **Public Key** (antes se llamaba User ID)
- Nota: EmailJS cambió la terminología, pero la funcionalidad es la misma

### 5. Configurar variables de entorno

#### Para desarrollo (local):
Crear archivo `.env.local` en la raíz del proyecto React:
```
REACT_APP_EMAILJS_SERVICE_ID=tu_service_id_aqui
REACT_APP_EMAILJS_TEMPLATE_ID=tu_template_id_aqui  
REACT_APP_EMAILJS_PUBLIC_KEY=tu_public_key_aqui
```

#### Para producción:
Actualizar el archivo `reservas.html` con las configuraciones reales:
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'tu_service_id_aqui',
    templateId: 'tu_template_id_aqui', 
    publicKey: 'tu_public_key_aqui'  // Antes se llamaba userId
};
```

### 6. Configurar base de datos
Ejecutar el script de migración:
```sql
-- Aplicar migration-public-reservations.sql
-- Actualizar configuracion_reservas_publicas con los valores de EmailJS

UPDATE configuracion_reservas_publicas 
SET valor = 'tu_service_id_aqui' 
WHERE clave = 'emailjs_service_id';

UPDATE configuracion_reservas_publicas 
SET valor = 'tu_template_id_aqui' 
WHERE clave = 'emailjs_template_codigo';

UPDATE configuracion_reservas_publicas 
SET valor = 'tu_public_key_aqui' 
WHERE clave = 'emailjs_user_id';  -- Mantener el nombre de la clave pero usar public key
```

### 7. Testing
1. Probar en desarrollo: `npm start` y ir a la página de reservas
2. Probar en producción: acceder a `https://tudominio.com/reservas.html`

### 8. Limitaciones de EmailJS
- Plan gratuito: 200 emails/mes
- Para mayor volumen considerar upgrade o integrar con servicio SMTP propio

## URLs de acceso

### Desarrollo:
- http://localhost:3000/reservas-publicas (React app)
- http://localhost/sala-ensayos/public/reservas.html (HTML standalone)

### Producción:
- https://kyz.com.ar/sala-ensayos/reservas (según especificación)

## Notas importantes

1. **Seguridad**: Las claves de EmailJS estarán expuestas en el frontend. EmailJS maneja esto con rate limiting y restricciones de dominio.

2. **Rate Limiting**: Implementar rate limiting adicional en el backend para prevenir abuso.

3. **Fallback**: Si EmailJS falla, el sistema puede seguir funcionando enviando notificaciones por otros medios.

4. **Monitoreo**: Revisar logs de EmailJS regularmente para identificar problemas de entrega.

## Template adicional para confirmación de reserva

Crear un segundo template para confirmación:

**Subject:** Reserva confirmada - {{banda_nombre}}

**Body:**
```
¡Hola {{banda_nombre}}!

Tu reserva ha sido confirmada exitosamente:

**Detalles de la reserva:**
- Fecha: {{fecha_reserva}}
- Horario: {{hora_reserva}}
- Sala: {{sala_nombre}}
- Importe: ${{importe_total}}

**Información importante:**
- Llega 10 minutos antes de tu horario
- Trae identificación del responsable de la banda
- El pago se realiza en el momento del servicio

¡Te esperamos!
Equipo de la Sala de Ensayos

---
Si tienes dudas, contáctanos: [email/teléfono de contacto]
```