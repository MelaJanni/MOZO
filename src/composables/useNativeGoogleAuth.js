import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { GoogleAuthProvider } from 'firebase/auth'
import { getAuth } from '../services/firebase'
import { googleInAppLogin } from '@/services/googleInAppAuth'

export function useNativeGoogleAuth() {
  const isLoading = ref(false)
  const isNativePlatform = Capacitor.isNativePlatform()
  
  // Client IDs para cada plataforma
  const CLIENT_IDS = {
    web: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    android: import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID,
    ios: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID
  }
  
  const getPlatformClientId = () => {
    const platform = Capacitor.getPlatform()
    return CLIENT_IDS[platform] || CLIENT_IDS.web
  }
  
  const signInWithGoogle = async () => {
    isLoading.value = true
    
    try {
      if (isNativePlatform) {
        // Usar Google Play Services nativo en móviles
        return await signInNative()
      } else {
        // Usar Google Identity Services para web
        return await signInWeb()
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const signInNative = async () => {
    try {
      console.log('🔵 Starting in-app Google OAuth (Browser + PKCE)...')

      // 1) Intentar flujo in-app con ventana embebida (recomendado)
      const result = await googleInAppLogin()
      if (result && result.id_token) {
        return {
          token: result.id_token,
          email: result.email,
          name: result.name,
          imageUrl: result.imageUrl,
          uid: result.sub,
          accessToken: result.access_token
        }
      }
      
      // 2) Fallback opcional: Firebase redirect (si fuera necesario)
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      const auth = await getAuth()
      if (!auth) throw new Error('Firebase Auth not initialized')
      const { signInWithRedirect } = await import('firebase/auth')
      console.log('🔵 Falling back to Firebase signInWithRedirect...')
      await signInWithRedirect(auth, provider)
      return null
      
    } catch (error) {
      console.error('❌ Native Firebase Google Sign-In failed:', error)
      throw new Error(`Native Firebase Google Sign-In failed: ${error.message}`)
    }
  }
  
  const signInWeb = async () => {
    // Para web, usar Google Identity Services
    return new Promise(async (resolve, reject) => {
      try {
        if (typeof window.google === 'undefined') {
          throw new Error('Google Identity Services not loaded')
        }
        
        // Inicializar Google Identity Services
        window.google.accounts.id.initialize({
          client_id: CLIENT_IDS.web,
          callback: (response) => {
            if (response.credential) {
              const payload = JSON.parse(atob(response.credential.split('.')[1]))
              resolve({
                token: response.credential,
                email: payload.email,
                name: payload.name,
                imageUrl: payload.picture
              })
            } else {
              reject(new Error('No credential received'))
            }
          }
        })
        
        // Mostrar prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: crear un botón temporal
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '50%'
            container.style.left = '50%'
            container.style.transform = 'translate(-50%, -50%)'
            container.style.zIndex = '10000'
            container.style.background = 'white'
            container.style.padding = '20px'
            container.style.borderRadius = '8px'
            container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
            
            document.body.appendChild(container)
            
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              width: 300
            })
            
            // Limpiar al completar
            const originalCallback = window.google.accounts.id.callback
            window.google.accounts.id.initialize({
              client_id: CLIENT_IDS.web,
              callback: (response) => {
                document.body.removeChild(container)
                originalCallback(response)
              }
            })
          }
        })
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  const extractEmailFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email
    } catch (error) {
      console.error('Error extracting email from token:', error)
      return null
    }
  }
  
  return {
    isLoading,
    isNativePlatform,
    signInWithGoogle,
    extractEmailFromToken,
    getPlatformClientId
  }
}