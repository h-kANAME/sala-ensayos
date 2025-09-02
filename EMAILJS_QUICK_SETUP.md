# ⚡ Configuración Rápida de EmailJS

## 📦 Prerequisito - Instalar Dependencia

```bash
npm install @emailjs/browser
```

> ✅ **Ya instalado** en el proyecto

## 🔑 Valores que necesitas obtener de EmailJS:

### 1. **Service ID** 
- Ve a https://dashboard.emailjs.com/admin
- En la sección "Email Services" 
- Crea o selecciona un servicio (Gmail, Outlook, etc.)
- Copia el **Service ID** (ej: `service_abc123`)

### 2. **Template ID**
- Ve a "Email Templates"
- Crea un template nuevo o selecciona uno existente
- Copia el **Template ID** (ej: `template_xyz789`)

### 3. **Public Key** (antes llamado User ID)
- Ve a "Account" → "General"
- En la sección "API Keys" 
- Copia la **Public Key** (ej: `user_1a2b3c4d5e`)

## 📧 Template de Email Recomendado:

**Subject:** `Código de verificación - {{banda_nombre}}`

**Body:**
```
Hola {{banda_nombre}},

Tu código de verificación es: **{{codigo_verificacion}}**

Detalles de la reserva:
📅 Fecha: {{fecha_reserva}}
🕐 Hora: {{hora_reserva}}
🏢 Sala: {{sala_nombre}}
💰 Importe: ${{importe_total}}

Este código expira en 15 minutos.

¡Gracias por elegirnos!
```

## ⚙️ Configuración en el Código:

### En `reservas.html` (línea ~154):
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_vqjf41e',     // ← Tu Service ID aquí
    templateId: 'template_e34j08k',   // ← Tu Template ID aquí
    publicKey: 'user_1a2b3c4d5e'     // ← Tu Public Key aquí
};
```

### En Base de Datos:
```sql
UPDATE configuracion_reservas_publicas 
SET valor = 'service_vqjf41e' WHERE clave = 'emailjs_service_id';

UPDATE configuracion_reservas_publicas 
SET valor = 'template_e34j08k' WHERE clave = 'emailjs_template_codigo';

UPDATE configuracion_reservas_publicas 
SET valor = 'user_1a2b3c4d5e' WHERE clave = 'emailjs_user_id';
```

## ✅ ¿Dónde encontrar cada valor?

| Valor | Ubicación en EmailJS Dashboard |
|-------|-------------------------------|
| **Service ID** | Email Services → [Tu servicio] → Service ID |
| **Template ID** | Email Templates → [Tu template] → Template ID |  
| **Public Key** | Account → General → API Keys → Public Key |

## 🧪 Probar la Configuración:

1. Actualiza `reservas.html` con tus valores
2. Ve a: `http://localhost/sala-ensayos/public/reservas.html`
3. Busca: "Los Rockeros" o "Jazz Fusion"  
4. Completa el flujo y verifica que llegue el email

## 🚨 Notas Importantes:

- ✅ EmailJS es **gratuito** hasta 200 emails/mes
- ✅ Los valores van **en el frontend** (es seguro)
- ✅ EmailJS maneja el rate limiting automáticamente
- ⚠️ Configurar restricciones de dominio en EmailJS dashboard para seguridad extra

## 🔄 Si algo no funciona:

1. **Verificar en la consola del navegador** si hay errores
2. **Revisar el dashboard de EmailJS** para estadísticas de envío
3. **Probar con `test_api.html`** primero para verificar backend
4. **Verificar que el email del cliente existe** en la tabla `clientes`