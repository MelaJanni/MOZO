# 🔐 Google OAuth Setup - MOZO Frontend

## ✅ Lo que ya está implementado:

### 1. **Frontend completamente funcional:**
- ✅ Google Identity Services integrado en `index.html`
- ✅ Composable `useGoogleAuth.js` para manejar autenticación
- ✅ Login.vue con botón "Continuar con Google" 
- ✅ Register.vue con botón "Continuar con Google"
- ✅ Manejo de tokens, errores y redirecciones
- ✅ Soporte para códigos de invitación de negocio en la URL

### 2. **Backend listo:**
- ✅ Endpoint `POST /api/login/google` funcional
- ✅ Verificación de tokens con Google tokeninfo
- ✅ Campos `google_id` y `google_avatar` en usuarios
- ✅ Registro automático si no existe el usuario
- ✅ Integración con códigos de invitación de staff

---

## 🔧 Configuración requerida:

### 1. **Obtener Google Client ID:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Habilita la **Google+ API** y **Google Identity Services**
4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente OAuth 2.0**
5. Tipo de aplicación: **Aplicación web**
6. Orígenes autorizados de JavaScript:
   ```
   http://localhost:5173
   https://mozoqr.com
   https://tu-dominio.com
   ```
7. URI de redirección autorizados:
   ```
   http://localhost:5173
   https://mozoqr.com
   https://tu-dominio.com
   ```

### 2. **Configurar variables de entorno:**

**Frontend** (`.env`):
```bash
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

**Backend** (Laravel `.env`):
```bash
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 3. **Verificar configuración en backend:**

En `config/services.php` debe tener:
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
],
```

---

## 🚀 Cómo funciona:

### **Login/Registro con Google:**

1. **Usuario hace clic** en "Continuar con Google"
2. **Se abre popup** de Google para autenticación
3. **Google devuelve** un `id_token` (JWT)
4. **Frontend envía** el token a `POST /api/login/google`:
   ```json
   {
     "google_token": "<id_token_de_google>",
     "fcm_token": "<opcional>",
     "platform": "web",
     "business_invitation_code": "<opcional>"
   }
   ```
5. **Backend verifica** el token con Google tokeninfo
6. **Si existe usuario**: inicia sesión
7. **Si no existe**: crea usuario automáticamente
8. **Si hay invitation_code**: crea solicitud de staff

### **Respuesta del backend:**
```json
{
  "success": true,
  "user": { 
    "id": 123, 
    "name": "Ana García", 
    "email": "ana@example.com",
    "google_id": "...",
    "google_avatar": "https://..."
  },
  "access_token": "<sanctum_token>",
  "token_type": "Bearer",
  "staff_request_created": true,
  "business_name": "Restaurante La Plaza",
  "message": "Bienvenido Ana. Tu solicitud..."
}
```

---

## 🧪 Para probar:

1. **Configura las variables** de entorno
2. **Reinicia el servidor** de desarrollo: `npm run dev`
3. **Ve a `/login`** o `/register`
4. **Haz clic** en "Continuar con Google"
5. **Autentica** con tu cuenta de Google
6. **Verifica** que se crea/loguea correctamente

---

## 🔍 Debug:

Si algo no funciona, revisa:

1. **Consola del navegador** para errores de JavaScript
2. **Network tab** para ver las peticiones HTTP
3. **Logs del servidor** Laravel para errores de backend
4. **Variables de entorno** están configuradas correctamente
5. **Dominios autorizados** en Google Cloud Console

---

## 📝 Notas importantes:

- ✅ **El Google Client ID** debe ser el mismo en frontend y backend
- ✅ **Los dominios** deben estar autorizados en Google Cloud Console
- ✅ **Para producción**: cambiar dominios en Google Cloud Console
- ✅ **Códigos de invitación**: funciona con URLs como `/login?invitation_code=ABC123`
- ✅ **FCM tokens**: se registran automáticamente si están disponibles

---

¡Ya tienes Google OAuth completamente implementado! 🎉