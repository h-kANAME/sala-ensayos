# Guía de Despliegue - Sala Ensayos

## Sistema de Entornos Automático

El sistema ahora detecta automáticamente si está ejecutándose en desarrollo o producción y configura los parámetros correspondientes.

## Configuración de Entornos

### Variables de Entorno

El sistema utiliza archivos `.env` para configurar diferentes entornos:

- `.env` - Desarrollo local (no incluido en git)
- `.env.example` - Plantilla de ejemplo
- `.env.production` - Configuración de producción (no incluido en git)

### Estructura de Variables

```bash
# Entorno: development, production
ENVIRONMENT=development

# Habilitar debug (true/false)  
DEBUG=true

# Orígenes permitidos para CORS (separados por coma)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# URL base de la API
API_URL=http://localhost/sala-ensayos/public/api

# Configuración de base de datos
DB_HOST=localhost
DB_NAME=sala_ensayos
DB_USER=root
DB_PASSWORD=
```

## Despliegue en Desarrollo

1. Asegúrate de tener el archivo `.env` con configuración de desarrollo:
```bash
cp .env.example .env
```

2. El sistema detectará automáticamente que está en desarrollo si:
   - El hostname es `localhost` o `127.0.0.1`
   - No se especifica `ENVIRONMENT=production` en .env

3. CORS permitirá automáticamente:
   - `http://localhost:3000` (React dev server)
   - `http://127.0.0.1:3000`
   - Cualquier puerto localhost en modo desarrollo

## Despliegue en Producción

1. Crea el archivo `.env` en el servidor con configuración de producción:
```bash
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://kyz.com.ar,https://www.kyz.com.ar
API_URL=https://kyz.com.ar/sala-ensayos/api
DB_HOST=localhost
DB_NAME=kyzcomar_sala-ensayos
DB_USER=kyzcomar_user-sala
DB_PASSWORD=tu_password_produccion
```

2. El sistema detectará automáticamente producción si:
   - El hostname NO es localhost/127.0.0.1
   - O si `ENVIRONMENT=production` está definido

3. Ejecutar el build de React:
```bash
npm run build
```

4. Copiar archivos al servidor manteniendo la estructura:
```
/sala-ensayos/
├── api/                 # API PHP
├── backend/            # Controllers, models, config
├── index.html          # React build
├── static/             # Assets de React
└── .htaccess           # Configuración Apache
```

## Detección Automática de Entorno

### Backend (PHP)
El sistema `Environment.php` detecta automáticamente:
- **Desarrollo**: hostname = localhost/127.0.0.1
- **Producción**: cualquier otro hostname o variable ENVIRONMENT=production

### Frontend (JavaScript) 
El sistema `api.js` detecta automáticamente:
- **Desarrollo**: hostname = localhost/127.0.0.1 → usa API en localhost
- **Producción**: cualquier otro hostname → usa API en el mismo dominio

## Características del Sistema

### CORS Dinámico
- ✅ Detecta automáticamente orígenes permitidos
- ✅ Permite localhost con cualquier puerto en desarrollo
- ✅ Restringe a dominios específicos en producción
- ✅ No requiere modificar .htaccess entre entornos

### Base de Datos Dinámica
- ✅ Configuración automática según entorno
- ✅ Variables de entorno para credenciales
- ✅ No expone credenciales en código

### Logging Inteligente
- ✅ Logs detallados solo en desarrollo
- ✅ Logs mínimos en producción
- ✅ Mejor rendimiento en producción

## Migración desde Sistema Anterior

Si tienes configuración hardcodeada anterior:

1. **CORS en .htaccess**: Ya no es necesario, se maneja dinámicamente
2. **URLs en API**: Se detectan automáticamente
3. **Credenciales DB**: Se mueven a variables de entorno

## Verificación del Entorno

Para verificar que el entorno se detecta correctamente:

### Backend
Revisar logs de PHP para ver:
```
Environment: development  # o production
```

### Frontend
Abrir consola del navegador para ver:
```
🚀 API Request: GET http://localhost/sala-ensayos/public/api/...  # desarrollo
🚀 API Request: GET https://kyz.com.ar/sala-ensayos/api/...      # producción
```

## Solución de Problemas

### Error CORS
1. Verificar que el origen esté en ALLOWED_ORIGINS
2. Verificar que no haya headers CORS duplicados en .htaccess
3. Revisar logs de PHP para ver la detección de entorno

### Error de Conexión DB
1. Verificar variables en .env
2. Verificar que la clase Database use el constructor actualizado
3. Revisar permisos de base de datos

### URLs Incorrectas
1. Verificar la detección automática en consola del navegador
2. Ajustar la lógica de detección en `api.js` si es necesario