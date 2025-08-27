import { ref, onMounted } from 'vue'
import { GoogleAuthProvider } from 'firebase/auth'
import { getAuth } from '../services/firebase'

export function useGoogleAuth() {
  const isGoogleLoaded = ref(false)
  const isInitializing = ref(false)
  
  // Función para extraer email del JWT token de Google (sin verificar)
  const extractEmailFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email
    } catch (error) {
      console.error('Error extracting email from token:', error)
      return null
    }
  }
  
  const initializeGoogle = async () => {
    if (isGoogleLoaded.value) {
      return
    }
    
    if (isInitializing.value) {
      // Si ya se está inicializando, esperar a que termine
      while (isInitializing.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }
    
    isInitializing.value = true
    
    try {
      // Verificar que Firebase Auth esté disponible
      const auth = await getAuth()
      if (!auth) {
        throw new Error('Firebase Auth not initialized')
      }
      
      isGoogleLoaded.value = true
      isInitializing.value = false
      console.log('✅ Firebase Auth initialized for Google Sign-In')
    } catch (error) {
      console.error('❌ Error initializing Firebase Auth:', error)
      isInitializing.value = false
      throw error
    }
  }
  
  const signInWithGoogle = async () => {
    try {
      await initializeGoogle()
      
      console.log('🔵 Starting Firebase Google Sign-In...')
      
      // Usar Firebase Auth con signInWithRedirect (más confiable que popups)
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      // Configurar para usar el flujo más seguro
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      const auth = await getAuth()
      const { signInWithRedirect, getRedirectResult } = await import('firebase/auth')
      
      // Verificar si hay resultado previo
      const redirectResult = await getRedirectResult(auth)
      if (redirectResult) {
        const user = redirectResult.user
        console.log('✅ Firebase redirect result obtained')
        
        const token = await user.getIdToken()
        return token
      }
      
      // Si no hay resultado, iniciar redirect
      console.log('🔄 Starting Firebase redirect...')
      await signInWithRedirect(auth, provider)
      
      // No retorna inmediatamente - el resultado se obtiene después del redirect
      return null
      
    } catch (error) {
      console.error('Error in Google sign-in:', error)
      throw error
    }
  }
  
  
  // Inicializar cuando se monta el componente
  onMounted(() => {
    // Inicializar Firebase Auth
    initializeGoogle().catch(console.error)
  })
  
  const signInWithGoogleAndCheckUser = async (isRegistering = false) => {
    const token = await signInWithGoogle()
    
    if (!token) {
      // Redirect en progreso, no hay token inmediato
      return null
    }
    
    const email = extractEmailFromToken(token)
    
    return {
      token,
      email,
      isRegistering
    }
  }
  
  return {
    isGoogleLoaded,
    isInitializing,
    initializeGoogle,
    signInWithGoogle,
    signInWithGoogleAndCheckUser,
    extractEmailFromToken
  }
}