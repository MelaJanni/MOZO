import { initFcmWindowListener } from '@/services/fcmEvents'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/styles/main.scss'
import 'bootstrap/dist/css/bootstrap.min.css'

import * as bootstrap from 'bootstrap'

import 'bootstrap-icons/font/bootstrap-icons.css'

// Importar servicios de notificaciones
import { initializePushNotifications } from './services/pushNotifications'
import { runNotificationDiagnostics } from '@/utils/notificationDiagnostics'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar notificaciones push después de que la app esté lista
app.mount('#app')

// Inicializar listener FCM ventana (para reconciliar eventos antes de snapshot)
initFcmWindowListener()

// Detectar si estamos en plataforma nativa real (Capacitor) evitando falsos positivos en escritorio
const isNative = (() => {
	try {
		if (!window.Capacitor) return false
		// Capacitor v5+ expone isNativePlatform/Platforms
		if (typeof window.Capacitor.isNativePlatform === 'function') {
			return window.Capacitor.isNativePlatform()
		}
		// fallback: si getPlatform devuelve 'android' o 'ios'
		if (typeof window.Capacitor.getPlatform === 'function') {
			const p = window.Capacitor.getPlatform()
			return p === 'android' || p === 'ios'
		}
		return false
	} catch (e) { return false }
})()

// FORZAR inicialización de notificaciones push en Android (DESPUÉS de definir isNative)
if (isNative) {
  console.log('🔔 NATIVE: Inicializando push notifications en startup...')
  setTimeout(async () => {
    try {
      await initializePushNotifications()
    } catch (error) {
      console.error('❌ Error inicializando push notifications en native:', error)
    }
  }, 1000)
}

// Registrar Service Worker solo en navegadores web puros
if (!isNative && 'serviceWorker' in navigator) {
	navigator.serviceWorker.register('/firebase-messaging-sw.js')
		.then(reg => console.log('Service Worker registrado:', reg.scope))
		.catch(err => console.warn('No se pudo registrar el Service Worker:', err))
}

// Ejecutar diagnósticos solo en web (evita accesos a Notification en WebView que no soporta SW push)
if (!isNative) {
	runNotificationDiagnostics().catch(err => console.warn('Error ejecutando diagnósticos de notificación:', err))
} else {
	console.log('Saltando runNotificationDiagnostics en entorno nativo')
}
