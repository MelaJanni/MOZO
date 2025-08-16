importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCecfSTfyxk3D2X4XsLaSGkckvf-OvhFZA",
  authDomain: "mozoqr-7d32c.firebaseapp.com",
  projectId: "mozoqr-7d32c",
  storageBucket: "mozoqr-7d32c.appspot.com",
  messagingSenderId: "175482362472",
  appId: "1:175482362472:android:f2589ca9ec71fd0cb6b9dd"
})

const messaging = firebase.messaging()

// Notificaciones en background (app cerrada/minimizada)
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background notification received:', payload)

  // Extraer título y cuerpo de la notificación
  let notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva notificación'
  let notificationBody = payload.notification?.body || payload.data?.body || 'Tienes una nueva notificación'
  
  // Si el payload viene solo con data (sin notification), usar los datos
  if (!payload.notification && payload.data) {
    notificationTitle = payload.data.title || 'MozoApp'
    notificationBody = payload.data.message || payload.data.body || 'Nueva notificación'
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/assets/mozo-logo-BesTuNgc.svg',
    badge: '/assets/mozo-logo-BesTuNgc.svg',
    tag: 'mozo-notification',
    requireInteraction: true, // Mantener la notificación visible
    vibrate: [200, 100, 200],
    data: {
      ...payload.data,
      url: '/', // URL para abrir cuando se haga clic
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '👀 Abrir App' },
      { action: 'dismiss', title: '❌ Cerrar' }
    ]
  }

  console.log('🔔 Showing background notification:', { title: notificationTitle, options: notificationOptions })
  
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event)
  
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
          console.log('🔔 Focusing existing window')
          return client.focus()
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      const urlToOpen = event.notification.data?.url || '/'
      console.log('🔔 Opening new window:', urlToOpen)
      return clients.openWindow(urlToOpen)
    })
  )
})

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Notification closed:', event.notification.tag)
})