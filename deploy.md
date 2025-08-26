# Instrucciones de Deployment

## 1. Preparar el Build

```bash
npm run build
```

## 2. Estructura de Archivos para Subir

**RECOMENDADO - Estructura Completa:**
```
/sala-ensayos/
├── index.html          # De build/
├── static/             # De build/static/
├── manifest.json       # De build/
├── robots.txt         # De build/
├── api/               # Crear carpeta
│   └── index.php      # De public/api/index.php (actualizado)
├── backend/           # TODO EL DIRECTORIO backend/ completo
│   ├── auth/
│   ├── config/
│   ├── controllers/
│   └── models/
└── .htaccess         # De build/.htaccess
```

**IMPORTANTE**: Debes subir **TODO** el directorio `backend/` para que funcionen todos los endpoints (reservas, clientes, productos, ventas).

## 3. Variables de entorno (OPCIONAL)

El sistema ahora detecta automáticamente el entorno de producción basándose en el dominio `kyz.com.ar`.

**Si usas OPCIÓN A (con backend/)**, puedes crear un archivo `.env` para personalizar la configuración:

```bash
# Environment Configuration - Production
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://kyz.com.ar,https://www.kyz.com.ar
API_URL=https://kyz.com.ar/sala-ensayos/api
DB_HOST=localhost
DB_NAME=kyzcomar_sala-ensayos
DB_USER=kyzcomar_user-sala
DB_PASSWORD=salapassword
```

**Si usas OPCIÓN B (solo API)**, no necesitas crear ningún archivo .env - todo funciona automáticamente.

## 4. URLs que funcionarán automáticamente

- **Frontend**: `https://kyz.com.ar/sala-ensayos/`
- **API**: `https://kyz.com.ar/sala-ensayos/api/auth/login`

## 5. Verificación Post-Deploy

1. **Verificar detección de entorno**:
   - Abrir consola del navegador
   - Debería mostrar: `🚀 API Request: GET https://kyz.com.ar/sala-ensayos/api/...`

2. **Test de API**:
   ```bash
   curl -I https://kyz.com.ar/sala-ensayos/api/auth/login
   # Debería mostrar headers CORS con kyz.com.ar
   ```

3. **Test de login**:
   - Intentar hacer login desde la web
   - Verificar en Network tab que las URLs sean correctas

## 6. Notas Importantes

- ✅ **CORS automático**: Detecta `kyz.com.ar` y permite solo ese origen
- ✅ **URLs automáticas**: Frontend usa `https://kyz.com.ar/sala-ensayos/api`
- ✅ **Base de datos**: Usa credenciales de producción automáticamente
- ✅ **Sin logs**: `DEBUG=false` desactiva logs innecesarios