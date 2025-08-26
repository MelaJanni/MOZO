// ==== FCM SERVICE WORKER (ACTUALIZADO) ====
// Debe usar la MISMA versión y config que la app principal para que el token sea válido también en background.
// Usamos compat v12 (coincide con dependency ^12.x instalada).
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js')

// Versión SW para diagnóstico incremental
const SW_VERSION = '1.0.3-heartbeat';
//console.log('[SW][boot] Parseado firebase-messaging-sw.js version', SW_VERSION, 'timestamp', Date.now());

// ==== Lifecycle diagnostics ====
self.addEventListener('install', (e) => {
  //console.log('[SW][lifecycle] install');
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  //console.log('[SW][lifecycle] activate');
  e.waitUntil(clients.claim());
});

// Heartbeat cada 30s para verificar que el SW está vivo (solo en dev / localhost)
if (location.hostname === 'localhost') {
  setInterval(() => {
    //console.log('[SW][heartbeat] vivo version', SW_VERSION, 'at', new Date().toISOString());
  }, 30000);
}

// IMPORTANTE: appId anterior era de Android (terminaba en :android:). Para Web debe ser el appId web (termina en :web:xxxx).
// Sustituye VITE_... al build (si no, coloca valores literales correctos). Si usas Vite, puedes generar este archivo dinámicamente en /dist.
const FALLBACK_CONFIG = {
  apiKey: 'AIzaSyBlupKSIy7qtTsXukqROyVjMNx03X8CCzU',
  authDomain: 'mozoqr-7d32c.firebaseapp.com',
  projectId: 'mozoqr-7d32c',
  storageBucket: 'mozoqr-7d32c.firebasestorage.app',
  messagingSenderId: '175482362472',
  appId: '1:175482362472:web:308070c885bacc71b6b9dd'
}

try {
  firebase.initializeApp(FALLBACK_CONFIG)
  //console.log('[SW][FCM] Firebase inicializado (compat 12) projectId=', FALLBACK_CONFIG.projectId, 'appId=', FALLBACK_CONFIG.appId)
} catch (e) {
  //console.warn('[SW][FCM] Error inicializando Firebase:', e)
}

const messaging = firebase.messaging()

// Notificaciones en background (app cerrada/minimizada) + reenvío a clientes
messaging.onBackgroundMessage(async (payload) => {
  //console.log('🔔 [SW] Background notification received (UNIFIED):', payload)

  // Normalizar claves posibles de callId
  const data = payload.data || {}
  const callId = data.call_id || data.callId || data.callID || null

  // Extraer título y cuerpo de la notificación
  let notificationTitle = payload.notification?.title || data.title || 'Nueva notificación'
  let notificationBody = payload.notification?.body || data.body || data.message || 'Tienes una nueva notificación'

  // Dedupe: si ya existe una notificación con misma tag (callId) la cerramos antes
  let tag = 'mozo-notification'
  if (callId) {
    tag = `call-${callId}`
    try {
      const existing = await self.registration.getNotifications({ tag })
      if (existing && existing.length) {
        existing.forEach(n => n.close())
        console.log('🔁 Reemplazando notificación previa para callId:', callId)
      }
    } catch (e) {
      console.warn('⚠️ Error comprobando notificaciones existentes:', e)
    }
  }

  const urgency = data.urgency || data.priority || 'normal'
  const requireInteraction = urgency === 'high' || urgency === 'urgent'

  const notificationOptions = {
    body: notificationBody,
    icon: '/assets/mozo-logo-BesTuNgc.svg',
    badge: '/assets/mozo-logo-BesTuNgc.svg',
    tag,
    requireInteraction,
    vibrate: [200, 100, 200],
    data: {
      ...data,
      // prefer route for deep linking in the SPA
      route: data.route || data.url || '/',
      callId,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '👀 Abrir App' },
      { action: 'dismiss', title: '❌ Cerrar' }
    ]
  }

  //console.log('🔔 [SW] Showing background notification:', { title: notificationTitle, options: notificationOptions })
  await self.registration.showNotification(notificationTitle, notificationOptions)
  // Reenviar a pestañas (si las hubiera) para reconciliación futura al abrir
  try {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    allClients.forEach(c => c.postMessage({ type: 'fcm_event', payload }))
    //console.log('[SW] postMessage enviado a', allClients.length, 'clientes')
  } catch(e){ console.warn('⚠️ [SW] postMessage background failed', e) }
  return
})

// (placeholder removed)

self.addEventListener('push', (event) => {
  // Diagnóstico low-level: este evento se dispara para TODOS los push (incluyendo FCM) antes o además de onBackgroundMessage.
  try {
    const raw = event.data ? event.data.text() : null
    //console.log('[SW][push] Evento push bruto recibido raw=', raw)
    // Intentar parsear JSON
    let parsed = null
    if (raw && raw.startsWith('{')) {
      try { parsed = JSON.parse(raw) } catch (e) { /* ignore */ }
    }
    if (parsed) {
      const fcmMsg = parsed.notification || parsed.data || parsed
      console.log('[SW][push] parsed keys=', Object.keys(parsed), 'notifKeys=', parsed.notification ? Object.keys(parsed.notification) : [], 'dataKeys=', parsed.data ? Object.keys(parsed.data) : [])
      // Si por alguna razón onBackgroundMessage no se ejecuta (porque FCM mostró automáticamente la notificación al incluir notification), podemos opcionalmente unificar logging.
      // No mostramos notificación aquí para evitar duplicados salvo que queramos forzar:
      if (!parsed.notification) {
        // DATA-ONLY FCM: forzamos notificación si el handler principal no corre (por seguridad).
        const data = parsed.data || parsed;
        const callId = data.call_id || data.callId || data.callID;
        const title = data.title || `Mesa ${data.table_number || '?'} llama`;
        const body = data.message || data.body || 'Nueva llamada (fallback)';
        const tag = callId ? `call-${callId}` : 'mozo-fallback';
        event.waitUntil((async () => {
          try {
            const existing = await self.registration.getNotifications({ tag });
            existing.forEach(n => n.close());
            await self.registration.showNotification(title, {
              body,
              tag,
              data: { ...data, callId, fallback: true, timestamp: Date.now() },
              vibrate: [150,75,150]
            });
            //console.log('[SW][push][fallback] Notificación mostrada por listener push (data-only)');
          } catch (e) {
            //console.warn('[SW][push][fallback] Error mostrando notificación', e);
          }
        })());
      }
    } else {
      //console.log('[SW][push] No se pudo parsear payload JSON');
    }
  } catch (e) {
    //console.warn('[SW][push] Error procesando evento push', e)
  }
})

// (El segundo onBackgroundMessage se ha consolidado arriba para evitar doble manejo)

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  //console.log('🔔 Notification clicked:', event)

  event.notification.close()
  
  // Si se hizo clic en la acción "dismiss", solo cerrar
  if (event.action === 'dismiss') {
    return
  }
  
  // Para "open" o clic general, abrir/enfocar la app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
      //console.log('🔔 Focusing existing window')
      try { client.postMessage({ type: 'notification_click', data: event.notification.data }) } catch(e){}
      return client.focus()
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
    const routeToOpen = event.notification.data?.route || '/'
    //console.log('🔔 Opening new window route:', routeToOpen)
    return clients.openWindow(routeToOpen)
    })
  )
})

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  //console.log('🔔 Notification closed:', event.notification.tag)
})