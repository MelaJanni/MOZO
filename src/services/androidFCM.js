/**
 * Android FCM Service - Solo para Android
 * NO afecta el funcionamiento de web
 */

import { Capacitor } from '@capacitor/core'

// Imports dinámicos para evitar errores en web
let useAuthStore, notificationsService

const getAuthStore = async () => {
  if (!useAuthStore) {
    const { useAuthStore: authStore } = await import('@/stores/auth')
    useAuthStore = authStore
  }
  return useAuthStore()
}

const getNotificationsService = async () => {
  if (!notificationsService) {
    const service = await import('./notifications')
    notificationsService = service.default
  }
  return notificationsService
}

/**
 * Enviar token al backend
 */
const sendTokenToBackend = async (token) => {
  try {
    const authStore = await getAuthStore()
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      console.warn('🔔 ANDROID FCM: Usuario no autenticado, guardando token para después')
      localStorage.setItem('pending_android_fcm_token', token)
      return false
    }

    console.log('🔔 ANDROID FCM: Enviando token al backend...')
    console.log('🔔 ANDROID FCM: Token completo:', token)
    console.log('🔔 ANDROID FCM: Usuario ID:', authStore.user.id)
    console.log('🔔 ANDROID FCM: Plataforma: android')
    
    const notificationService = await getNotificationsService()
    const response = await notificationService.storeDeviceToken(token, 'android', authStore.user.id)
    
    console.log('🔔 ANDROID FCM: Respuesta del backend:', response)
    
    if (response) {
      console.log('✅ ANDROID FCM: Token enviado exitosamente al backend')
      localStorage.removeItem('pending_android_fcm_token')
      return true
    } else {
      console.error('❌ ANDROID FCM: Error enviando token al backend')
      return false
    }
  } catch (error) {
    console.error('❌ ANDROID FCM: Error enviando token:', error)
    console.error('❌ ANDROID FCM: Stack trace:', error.stack)
    return false
  }
}

/**
 * Configurar listeners y registrar para notificaciones push
 */
export const initializeAndroidFCM = async () => {
  // Solo ejecutar en Android nativo
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    console.log('🔔 ANDROID FCM: Skip - no es Android nativo')
    return { success: false, reason: 'not_android' }
  }

  console.log('🔔 ANDROID FCM: Inicializando...')

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    
    // Configurar listener para el token de registro
    await PushNotifications.addListener('registration', (token) => {
      console.log('🔔 ANDROID FCM: Token recibido:', token.value.substring(0, 20) + '...')
      sendTokenToBackend(token.value)
    })

    // Configurar listener para errores de registro
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ ANDROID FCM: Error de registro:', error)
    })

    // Configurar listener para notificaciones recibidas (cuando la app está en foreground)
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 ANDROID FCM: Notificación recibida (FOREGROUND):', notification)
      console.log('🔔 ANDROID FCM: Título:', notification.title)
      console.log('🔔 ANDROID FCM: Cuerpo:', notification.body)
      console.log('🔔 ANDROID FCM: Datos:', notification.data)
    })

    // Configurar listener para notificaciones tocadas (cuando el usuario toca una notificación)
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('🔔 ANDROID FCM: Notificación TOCADA por el usuario:', notification)
      console.log('🔔 ANDROID FCM: Título:', notification.notification.title)
      console.log('🔔 ANDROID FCM: Cuerpo:', notification.notification.body)
      console.log('🔔 ANDROID FCM: Datos:', notification.notification.data)
    })

    // Solicitar permisos
    console.log('🔔 ANDROID FCM: Solicitando permisos...')
    const permResult = await PushNotifications.requestPermissions()
    console.log('🔔 ANDROID FCM: Resultado permisos:', permResult)
    
    if (permResult.receive !== 'granted') {
      console.warn('🔔 ANDROID FCM: Permisos de notificaciones denegados')
      return { success: false, reason: 'permissions_denied' }
    }

    // Registrar para notificaciones (esto activará el listener 'registration')
    console.log('🔔 ANDROID FCM: Registrando PushNotifications...')
    await PushNotifications.register()
    
    console.log('✅ ANDROID FCM: PushNotifications registrado exitosamente')
    
    // Esperar un poco para que se dispare el token
    setTimeout(async () => {
      console.log('🔔 ANDROID FCM: Esperando token de registro...')
      
      // Intentar obtener token desde SharedPreferences (guardado por MyFirebaseMessagingService)
      try {
        const { Preferences } = await import('@capacitor/preferences')
        const { value: storedToken } = await Preferences.get({ key: 'fcm_token' })
        if (storedToken) {
          console.log('🔔 ANDROID FCM: Token encontrado en SharedPreferences:', storedToken.substring(0, 20) + '...')
          sendTokenToBackend(storedToken)
        } else {
          console.log('🔔 ANDROID FCM: No hay token en SharedPreferences aún')
        }
      } catch (error) {
        console.error('❌ ANDROID FCM: Error obteniendo token desde SharedPreferences:', error)
      }
      
      // TEST: Crear una notificación local para probar que el sistema funciona
      console.log('🔔 ANDROID FCM: TEST - Creando notificación local de prueba...')
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'TEST - Android FCM',
              body: 'Si ves esto, las notificaciones Android funcionan ✅',
              id: 99999,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null
            }
          ]
        })
        console.log('✅ ANDROID FCM: Notificación local de prueba programada')
      } catch (error) {
        console.error('❌ ANDROID FCM: Error creando notificación de prueba:', error)
      }
    }, 2000)
    
    return { success: true }

  } catch (error) {
    console.error('❌ ANDROID FCM: Error:', error)
    return { success: false, reason: 'exception', error: error.message }
  }
}

/**
 * Intentar enviar token pendiente después del login
 */
export const sendPendingAndroidToken = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  const pendingToken = localStorage.getItem('pending_android_fcm_token')
  if (!pendingToken) {
    return
  }

  console.log('🔔 ANDROID FCM: Enviando token pendiente...')
  
  try {
    const authStore = await getAuthStore()
    if (authStore.isAuthenticated && authStore.user?.id) {
      const notificationService = await getNotificationsService()
      const response = await notificationService.storeDeviceToken(pendingToken, 'android', authStore.user.id)
      if (response) {
        console.log('✅ ANDROID FCM: Token pendiente enviado exitosamente')
        localStorage.removeItem('pending_android_fcm_token')
      }
    }
  } catch (error) {
    console.error('❌ ANDROID FCM: Error enviando token pendiente:', error)
  }
}

export default {
  initializeAndroidFCM,
  sendPendingAndroidToken
}