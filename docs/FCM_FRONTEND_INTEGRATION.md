Integración FCM (frontend) - Resumen rápido

Objetivo
- Registrar token FCM en login para que el backend lo tenga inmediatamente y el usuario pueda recibir notificaciones en segundo plano.
- Registrar Service Worker para background notifications.
- Unregister (DELETE) del token en logout.

Archivos creados
- `src/utils/notificationClient.js` - helpers: `loginWithFCM`, `registerTokenAfterLogin`, `logoutAndUnregister`, `getFCMTokenSafe`.

Integración rápida (ejemplos)

1) Uso en la pantalla de login (Vue):

```js
import { loginWithFCM } from '@/utils/notificationClient'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

async function onSubmit(credentials) {
  try {
    const resp = await loginWithFCM(credentials)
    // loginWithFCM usa apiService.login que devuelve respuesta con user/token
    // Si necesitas, actualizar state con authStore.login(resp.data) o usar la respuesta directa
    // Ejemplo simple: redirigir a dashboard
  } catch (err) {
    // manejar error
  }
}
```

2) Logout (llamar unregister antes de limpiar local):

```js
import { logoutAndUnregister } from '@/utils/notificationClient'

async function onLogout() {
  await logoutAndUnregister()
  // luego redirigir a login
}
```

3) Service Worker

- Asegúrate que `public/firebase-messaging-sw.js` exista (ya agregado en el repo). Registra el SW en la app:

```js
if ('serviceWorker' in navigator) {
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    console.log('Service Worker registered')
  } catch (e) {
    console.warn('SW registration failed', e)
  }
}
```

4) Pruebas rápidas
- Login -> verificar `GET /api/device-tokens/{userId}` que token existe.
- Enviar notificación desde backend o Firebase Console al token y comprobar que aparece en background.
- Logout -> verificar token eliminado.

Notas
- Si tu backend requiere un `token_id` en lugar de token string para eliminar, adapta `notificationsService.deleteDeviceToken(tokenId)` para usar el id.
- Asegúrate de configurar `VITE_FIREBASE_VAPID_KEY` y otras variables de Firebase para que `firebaseService.getFCMToken()` funcione.

Contacto
- Si querés que adapte el código para que use un flujo concreto de tu UI (ej. llamar `authStore.login` en vez de `apiService.login`), pegá la parte del login actual y lo integro.
