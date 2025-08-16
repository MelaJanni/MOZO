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

// Ya no inicializamos notificaciones aquí, se hace en App.vue después del login

// Registrar Service Worker para Firebase Messaging (si existe)
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/firebase-messaging-sw.js')
		.then(reg => console.log('Service Worker registrado:', reg.scope))
		.catch(err => console.warn('No se pudo registrar el Service Worker:', err))
}

// Ejecutar diagnóstico de notificaciones (logs en consola)
runNotificationDiagnostics().catch(err => console.warn('Error ejecutando diagnósticos de notificación:', err))
