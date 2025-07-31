import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { useAuthStore } from '@/stores/auth'
import notificationsService from './notifications'

const register = async () => {
  if (Capacitor.isPluginAvailable('PushNotifications')) {
    const permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      const result = await PushNotifications.requestPermissions()
      if (result.receive !== 'granted') {
        return
      }
    }

    if (permStatus.receive !== 'granted') {
      return
    }

    await PushNotifications.register()
  }
}

const addListeners = async () => {
  if (Capacitor.isPluginAvailable('PushNotifications')) {
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value)
      localStorage.setItem('fcm_token', token.value)
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        try {
          const platform = Capacitor.getPlatform()
          await notificationsService.storeDeviceToken(token.value, platform)
          console.log('Device token stored successfully')
        } catch (error) {
          console.error('Error storing device token:', error)
        }
      }
    })

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error))
    })

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received: ' + JSON.stringify(notification))
      }
    )

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log(
          'Push action performed: ' + JSON.stringify(notification)
        )
      }
    )
  }
}

export const initializePushNotifications = async () => {
  await register()
  await addListeners()
} 