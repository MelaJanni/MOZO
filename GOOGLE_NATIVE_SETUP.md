# 🚀 Configuración Google Sign-In Nativo - MOZO

## ✅ **Implementación completada:**

### 1. **Plugin instalado y configurado**
- ✅ cordova-plugin-googleplus@8.5.2 instalado
- ✅ Configuración agregada en capacitor.config.json
- ✅ Composable `useNativeGoogleAuth.js` creado
- ✅ Login.vue y Register.vue actualizados para detectar plataforma

### 2. **Detección automática de plataforma**
```javascript
// Detecta automáticamente si es móvil o web
if (isNativePlatform) {
  // Usar autenticación nativa para móviles
  const result = await signInNative()
} else {
  // Usar autenticación web
  const result = await signInWithGoogleAndCheckUser()
}
```

---

## 📋 **REQUERIDO: Configurar credenciales de Google**

### **Información técnica del proyecto:**
- **Package Name:** `com.mozoqr.app`
- **SHA-1 Debug:** `D4:3F:B8:80:B3:7C:48:09:D9:9B:C9:FE:FA:20:3B:EB:4B:42:F4:CE`

### **Pasos en Google Cloud Console:**

1. **Ir a Google Cloud Console**
   - https://console.cloud.google.com/

2. **Crear credenciales OAuth 2.0**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client IDs

3. **Configurar para Android:**
   - Application Type: **Android**
   - Package name: `com.mozoqr.app`
   - SHA-1 certificate fingerprint: `D4:3F:B8:80:B3:7C:48:09:D9:9B:C9:FE:FA:20:3B:EB:4B:42:F4:CE`
   
4. **Configurar para iOS:**
   - Application Type: **iOS** 
   - Bundle ID: `com.mozoqr.app`

5. **Ya tienes para Web:**
   - Tu client ID web actual: `VITE_GOOGLE_CLIENT_ID`

### **Actualizar variables de entorno (.env):**
```bash
# Tu client ID web existente
VITE_GOOGLE_CLIENT_ID=tu_client_id_web.apps.googleusercontent.com

# AGREGAR ESTAS NUEVAS:
VITE_GOOGLE_ANDROID_CLIENT_ID=tu_client_id_android.apps.googleusercontent.com
VITE_GOOGLE_IOS_CLIENT_ID=tu_client_id_ios.apps.googleusercontent.com
```

---

## 🔧 **Para probar en el emulador:**

1. **Actualizar .env con las nuevas credenciales**
2. **Construir la app:**
   ```bash
   npm run build
   npx cap sync
   ```

3. **Abrir en Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Ejecutar en emulador y probar Google Sign-In**

---

## 🎯 **Flujo implementado:**

### **En dispositivos móviles (Android/iOS):**
1. Usuario toca "Continuar con Google"
2. **Se abre ventana nativa de Google** (no modal web)
3. Usuario selecciona cuenta/autentica
4. App recibe `idToken` nativo
5. Procede con verificación de usuario y login/registro

### **En web (navegador):**
1. Usuario hace clic en "Continuar con Google"
2. **Se usa Google Identity Services** (como antes)
3. Modal personalizado con botón nativo
4. Mismo flujo de verificación

---

## 🚀 **Ventajas de la implementación nativa:**

1. **UX nativa** - Ventana de Google nativa en móviles
2. **Mejor seguridad** - Autenticación directa sin web views
3. **Funcionamiento offline** - No depende de conectividad web
4. **Detección automática** - Funciona en web y móvil sin cambios
5. **Reutilización** - Mismo código para Login y Register

---

**¡Siguiente paso: Configura las credenciales de Google y prueba en el emulador Android!** 📱