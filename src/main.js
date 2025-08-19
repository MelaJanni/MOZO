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
		console.log('🔍 DEBUG: window.Capacitor:', !!window.Capacitor)
		if (!window.Capacitor) return false
		
		// Capacitor v5+ expone isNativePlatform/Platforms
		if (typeof window.Capacitor.isNativePlatform === 'function') {
			const isNativePlatform = window.Capacitor.isNativePlatform()
			console.log('🔍 DEBUG: isNativePlatform():', isNativePlatform)
			return isNativePlatform
		}
		// fallback: si getPlatform devuelve 'android' o 'ios'
		if (typeof window.Capacitor.getPlatform === 'function') {
			const p = window.Capacitor.getPlatform()
			console.log('🔍 DEBUG: getPlatform():', p)
			return p === 'android' || p === 'ios'
		}
		return false
	} catch (e) { 
		console.log('🔍 DEBUG: Error detectando plataforma:', e)
		return false 
	}
})()

// FORZAR inicialización de notificaciones push en Android (DESPUÉS de definir isNative)
console.log('🔍 DEBUG: isNative =', isNative)
console.log('🔍 DEBUG: window.Capacitor?.getPlatform() =', window.Capacitor?.getPlatform())
console.log('🔍 DEBUG: Condición completa:', isNative && window.Capacitor?.getPlatform() === 'android')

if (isNative && window.Capacitor?.getPlatform() === 'android') {
  console.log('🔔 ANDROID: Inicializando FCM específico para Android...')
  console.log('🔍 DEBUG: Configurando setTimeout para Android FCM en 3 segundos...')
  
  setTimeout(async () => {
    console.log('🔍 DEBUG: setTimeout ejecutado - iniciando importación de androidFCM')
    try {
      console.log('🔍 DEBUG: Importando ./services/androidFCM.js...')
      const androidFCMModule = await import('./services/androidFCM.js')
      console.log('🔍 DEBUG: Módulo importado:', !!androidFCMModule)
      console.log('🔍 DEBUG: initializeAndroidFCM existe:', !!androidFCMModule?.initializeAndroidFCM)
      
      if (androidFCMModule?.initializeAndroidFCM) {
        console.log('🔍 DEBUG: Llamando a initializeAndroidFCM...')
        await androidFCMModule.initializeAndroidFCM()
        console.log('🔍 DEBUG: initializeAndroidFCM completado')
      } else {
        console.log('❌ DEBUG: initializeAndroidFCM no encontrado en el módulo')
      }
    } catch (error) {
      console.error('❌ Error inicializando Android FCM:', error)
      console.error('❌ Stack trace:', error.stack)
      // No re-lanzar el error para no romper la app
    }
  }, 3000) // 3 segundos para que Firebase se inicialice
} else {
  console.log('🔍 DEBUG: NO ejecutando Android FCM - condición no cumplida')
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
