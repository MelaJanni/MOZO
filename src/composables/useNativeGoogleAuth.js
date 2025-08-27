import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { GoogleAuthProvider } from 'firebase/auth'
import { getAuth } from '../services/firebase'
import { googleInAppLogin } from '@/services/googleInAppAuth'
import { getStoredOAuthToken, clearStoredOAuthToken } from '@/utils/oauthHandler'

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
    try {
      console.log('🔵 Starting OAuth2 Implicit Flow for web...')
      
      // Primero verificar si hay token almacenado por el handler global
      const storedToken = getStoredOAuthToken()
      if (storedToken && storedToken.access_token) {
        console.log('✅ Found stored OAuth token - processing...')
        return await processStoredToken(storedToken)
      }
      
      console.log('🔍 Current URL:', window.location.href)
      console.log('🔍 Hash:', window.location.hash)
      
      // Verificar si estamos regresando de un redirect OAuth (fallback)
      const currentUrl = window.location.href
      if (currentUrl.includes('#access_token=') || currentUrl.includes('#id_token=')) {
        console.log('✅ OAuth2 redirect detected - processing response...')
        return await handleOAuthRedirectResponse()
      } else {
        console.log('🔄 No OAuth2 redirect detected - initiating new flow...')
      }
      
      // Generar state para protección CSRF
      const state = generateRandomState()
      localStorage.setItem('oauth_state', state)
      
      // Construir URL de autorización OAuth2 implícito
      const clientId = CLIENT_IDS.web
      
      // Usar solo el origen sin ruta (requerido por Google OAuth2)
      const redirectUrl = window.location.origin
      const redirectUri = encodeURIComponent(redirectUrl)
      const scopes = encodeURIComponent('email profile openid')
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=id_token token&` +
        `scope=${scopes}&` +
        `state=${state}&` +
        `prompt=select_account&` +
        `include_granted_scopes=true&` +
        `nonce=${generateRandomState()}`
      
      console.log('🔄 OAuth2 Redirect URI:', redirectUrl)
      console.log('🔄 Redirecting to Google OAuth2...')
      window.location.href = authUrl
      
      // No retorna inmediatamente - el resultado se obtiene después del redirect
      return null
      
    } catch (error) {
      console.error('❌ Web OAuth2 Implicit Flow failed:', error)
      throw new Error(`Web OAuth2 failed: ${error.message}`)
    }
  }
  
  const generateRandomState = () => {
    const array = new Uint32Array(8)
    crypto.getRandomValues(array)
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('')
  }
  
  const processStoredToken = async (tokenData) => {
    try {
      console.log('🔍 Processing stored OAuth token...')
      
      // Verificar state para protección CSRF
      const storedState = localStorage.getItem('oauth_state')
      console.log('🔍 State verification:', { received: tokenData.state, stored: storedState })
      
      if (tokenData.state !== storedState) {
        throw new Error('Invalid state parameter in stored token - possible CSRF attack')
      }
      
      // Limpiar state del localStorage
      localStorage.removeItem('oauth_state')
      
      if (!tokenData.id_token) {
        throw new Error('No ID token in stored data')
      }
      
      console.log('✅ Stored OAuth token validated - using ID token for backend')
      
      // Extraer información del usuario del ID token (JWT)
      let userInfo
      if (tokenData.access_token) {
        // Si tenemos access token, obtener info completa de la API
        const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenData.access_token}`)
        if (userInfoResponse.ok) {
          userInfo = await userInfoResponse.json()
        }
      }
      
      // Si no pudimos obtener de la API, extraer del ID token
      if (!userInfo && tokenData.id_token) {
        try {
          const payload = JSON.parse(atob(tokenData.id_token.split('.')[1]))
          userInfo = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          }
        } catch (error) {
          console.error('Error decoding ID token:', error)
          throw new Error('Failed to decode ID token')
        }
      }
      
      console.log('✅ User info obtained from stored token')
      
      // Limpiar token almacenado
      clearStoredOAuthToken()
      
      return {
        token: tokenData.id_token, // Usar ID token para el backend
        email: userInfo.email,
        name: userInfo.name,
        imageUrl: userInfo.picture,
        uid: userInfo.id,
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        tokenType: tokenData.token_type,
        expiresIn: parseInt(tokenData.expires_in),
        scope: tokenData.scope,
        userInfo: userInfo
      }
      
    } catch (error) {
      console.error('❌ Error processing stored OAuth token:', error)
      // Limpiar token almacenado en caso de error
      clearStoredOAuthToken()
      throw error
    }
  }
  
  const handleOAuthRedirectResponse = async () => {
    try {
      console.log('🔍 Processing OAuth redirect response...')
      
      // Extraer parámetros del fragment identifier
      const hash = window.location.hash.substring(1)
      console.log('🔍 Hash parameters:', hash)
      
      const params = new URLSearchParams(hash)
      
      const accessToken = params.get('access_token')
      const tokenType = params.get('token_type')
      const expiresIn = params.get('expires_in')
      const state = params.get('state')
      const scope = params.get('scope')
      
      console.log('🔍 Extracted params:', {
        accessToken: accessToken ? '***' : null,
        tokenType,
        expiresIn,
        state,
        scope
      })
      
      // Verificar state para protección CSRF
      const storedState = localStorage.getItem('oauth_state')
      console.log('🔍 State verification:', { received: state, stored: storedState })
      
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }
      
      // Limpiar state del localStorage
      localStorage.removeItem('oauth_state')
      
      if (!accessToken) {
        throw new Error('No access token received from OAuth response')
      }
      
      console.log('✅ OAuth2 access token obtained')
      
      // Obtener información del usuario usando el access token
      const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`)
      
      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user information')
      }
      
      const userInfo = await userInfoResponse.json()
      
      // Limpiar URL eliminando el fragment
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      
      return {
        token: accessToken, // Usamos el access token como token principal
        email: userInfo.email,
        name: userInfo.name,
        imageUrl: userInfo.picture,
        uid: userInfo.id,
        accessToken: accessToken,
        tokenType: tokenType,
        expiresIn: parseInt(expiresIn),
        scope: scope,
        userInfo: userInfo
      }
      
    } catch (error) {
      console.error('❌ Error processing OAuth2 redirect response:', error)
      // Limpiar URL en caso de error
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      throw error
    }
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