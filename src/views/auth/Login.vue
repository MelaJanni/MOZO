<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="text-center mb-4">
        <h1 class="h3">Iniciar Sesión</h1>
        <p class="text-muted">Accede a tu cuenta de MOZO</p>
      </div>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Correo electrónico</label>
          <input 
            type="email" 
            class="form-control" 
            id="email" 
            v-model="email" 
            required
            :disabled="loading"
            placeholder="correo@ejemplo.com"
          >
        </div>
        
        <div class="mb-3">
          <label for="password" class="form-label">Contraseña</label>
          <input 
            type="password" 
            class="form-control" 
            id="password" 
            v-model="password" 
            required
            :disabled="loading"
            placeholder="Tu contraseña"
          >
        </div>
        
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="remember" v-model="remember">
            <label class="form-check-label" for="remember">
              Recordarme
            </label>
          </div>
          <router-link to="/forgot-password" class="link-primary">¿Olvidaste tu contraseña?</router-link>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mb-3" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Iniciar sesión
        </button>
        
        <div class="text-center my-3">
          <span class="text-muted">O continúa con</span>
        </div>
        
        <!-- Botón de Google para todas las plataformas -->
        <button 
          type="button" 
          class="btn btn-outline-secondary w-100 mb-3"
          @click="handleGoogleLogin"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-google me-2"></i> 
          {{ loading ? 'Iniciando...' : 'Continuar con Google' }}
        </button>
        
        <div class="text-center mt-4">
          <span class="text-muted">¿No tienes una cuenta?</span> 
          <router-link to="/register" class="link-primary ms-1">Registrarse</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNativeGoogleAuth } from '@/composables/useNativeGoogleAuth'
import apiService from '@/services/api'
import Swal from 'sweetalert2'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
  const { signInWithGoogle: signInNative, isNativePlatform, extractEmailFromToken } = useNativeGoogleAuth()
    
    const email = ref('')
    const password = ref('')
    const remember = ref(false)
    const error = ref('')
    const loading = ref(false)
    
    const isFormValid = computed(() => {
      return email.value.trim() !== '' && 
             password.value.trim() !== '' &&
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    })
    
  const handleLogin = async () => {
      if (!isFormValid.value) return
      
      loading.value = true
      error.value = ''
      
      try {
        await authStore.login({ email: email.value, password: password.value })
        router.push({ name: 'role-selection' })
      } catch (err) {
        console.error('Error de inicio de sesión:', err)
        error.value = err.response?.data?.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    const handleGoogleLogin = async () => {
      try {
        loading.value = true
        error.value = ''

        console.log('🔵 Iniciando autenticación con Google...', isNativePlatform ? 'NATIVO' : 'WEB')
        
        const result = await signInNative()
        
        // Si result es null, significa que se está procesando un redirect
        if (result === null) {
          error.value = 'Redirigiendo a Google Sign-In...'
          return // No cambiar loading.value para mantener el indicador
        }
        
        console.log('✅ Token de Google obtenido para:', result.email)
        
        const loginData = {
          google_token: result.token,
          fcm_token: localStorage.getItem('fcm_token') || undefined,
          platform: isNativePlatform ? 'android' : 'web',
          email: result.email,
          name: result.name,
          avatar: result.imageUrl
        }

        // Verificar si hay código de invitación en la URL
        const urlParams = new URLSearchParams(window.location.search)
        const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
        if (invitationCode) {
          loginData.business_invitation_code = invitationCode
          console.log('🏢 Código de invitación detectado:', invitationCode)
        }

        console.log('🚀 Enviando datos de login/registro con Google al servidor...')
        
        const response = await authStore.loginWithGoogle(loginData)
        
        if (response.staff_request_created) {
          console.log(`✅ Solicitud de staff creada para: ${response.business_name}`)
          if (response.message) {
            console.log('📢 Mensaje del servidor:', response.message)
          }
        }

        // Manejar redirección después del login
        const redirectUrl = localStorage.getItem('redirectAfterLogin')
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin')
          router.push(redirectUrl)
        } else {
          router.push({ name: 'role-selection' })
        }

      } catch (err) {
        console.error('❌ Error en autenticación con Google:', err)
        
        if (err.message === 'Redirecting to Google Sign-In...') {
          // El redirect está en proceso, no mostrar error
          error.value = 'Redirigiendo a Google Sign-In...'
          return // No cambiar loading.value para mantener el indicador
        } else if (err.message === 'Google sign-in cancelled by user') {
          error.value = 'Autenticación cancelada'
        } else if (err.response?.status === 401) {
          error.value = 'Token de Google inválido. Por favor, inténtalo de nuevo.'
        } else {
          error.value = err.response?.data?.message || err.message || 'Error al autenticarse con Google'
        }
      } finally {
        // Solo cambiar loading si no es un redirect
        if (!error.value?.includes('Redirigiendo')) {
          loading.value = false
        }
      }
    }
    
    // Verificar resultado de redirect cuando el componente se monta
    onMounted(async () => {
      console.log('🔍 Login component mounted')
      console.log('🔍 Is native platform:', isNativePlatform)
      console.log('🔍 Current URL:', window.location.href)
      console.log('🔍 Hash:', window.location.hash)
      
      // Verificar si hay un resultado de OAuth2 redirect pendiente
      try {
        // Para web: verificar stored token O hash con access_token (OAuth2 implicit flow)
        if (!isNativePlatform) {
          // Verificar si hay token almacenado o hash con tokens
          const hasStoredToken = sessionStorage.getItem('oauth_token_data')
          const hasHashToken = window.location.hash.includes('access_token=') || window.location.hash.includes('id_token=')
          
          console.log('🔍 Checking OAuth tokens:', { hasStoredToken: !!hasStoredToken, hasHashToken })
          
          if (hasStoredToken || hasHashToken) {
            console.log('✅ OAuth2 data detectado - procesando...', 
                       hasStoredToken ? '(stored)' : '(hash)')
            loading.value = true
            
            try {
              const result = await signInNative() // Esto procesará el OAuth redirect
            
              if (result) {
                console.log('✅ Respuesta OAuth2 procesada:', result.email)
                
                const loginData = {
                  google_token: result.token,
                  fcm_token: localStorage.getItem('fcm_token') || undefined,
                  platform: 'web',
                  email: result.email,
                  name: result.name,
                  avatar: result.imageUrl
                }

                // Verificar código de invitación
                const urlParams = new URLSearchParams(window.location.search)
                const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
                if (invitationCode) {
                  loginData.business_invitation_code = invitationCode
                }

                const response = await authStore.loginWithGoogle(loginData)
                
                if (response.staff_request_created) {
                  console.log(`✅ Solicitud de staff creada para: ${response.business_name}`)
                }

                // Redirección
                const redirectUrl = localStorage.getItem('redirectAfterLogin')
                if (redirectUrl) {
                  localStorage.removeItem('redirectAfterLogin')
                  router.push(redirectUrl)
                } else {
                  router.push({ name: 'role-selection' })
                }
              }
            } catch (err) {
              console.error('❌ Error procesando OAuth2 redirect:', err)
              error.value = err.response?.data?.message || err.message || 'Error procesando autenticación de Google'
            } finally {
              loading.value = false
            }
          }
        }
        
        // Para móvil: verificar resultado de Firebase redirect (solo como fallback)
        if (isNativePlatform) {
          const { getAuth } = await import('@/services/firebase')
          const { getRedirectResult, GoogleAuthProvider } = await import('firebase/auth')
          const auth = await getAuth()
          
          if (auth) {
            const result = await getRedirectResult(auth)
            if (result) {
              console.log('🔄 Procesando resultado de Firebase redirect móvil...')
              
              const user = result.user
              const credential = GoogleAuthProvider.credentialFromResult(result)
              
              const googleAuthResult = {
                token: await user.getIdToken(),
                email: user.email,
                name: user.displayName,
                imageUrl: user.photoURL,
                uid: user.uid,
                accessToken: credential?.accessToken
              }
              
              console.log('✅ Resultado de Firebase redirect procesado:', googleAuthResult.email)
              
              loading.value = true
              
              const loginData = {
                google_token: googleAuthResult.token,
                fcm_token: localStorage.getItem('fcm_token') || undefined,
                platform: 'android',
                email: googleAuthResult.email,
                name: googleAuthResult.name,
                avatar: googleAuthResult.imageUrl
              }

              const urlParams = new URLSearchParams(window.location.search)
              const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
              if (invitationCode) {
                loginData.business_invitation_code = invitationCode
              }

              try {
                const response = await authStore.loginWithGoogle(loginData)
                
                if (response.staff_request_created) {
                  console.log(`✅ Solicitud de staff creada para: ${response.business_name}`)
                }

                const redirectUrl = localStorage.getItem('redirectAfterLogin')
                if (redirectUrl) {
                  localStorage.removeItem('redirectAfterLogin')
                  router.push(redirectUrl)
                } else {
                  router.push({ name: 'role-selection' })
                }
              } catch (err) {
                console.error('❌ Error procesando login móvil con Google:', err)
                error.value = err.response?.data?.message || err.message || 'Error al autenticarse con Google'
              } finally {
                loading.value = false
              }
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error verificando resultado de redirect:', error)
      }
    })
    
    return {
      email,
      password,
      remember,
      error,
      loading,
      isNativePlatform,
      isFormValid,
      handleLogin,
      handleGoogleLogin
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bs-light);
  padding: 1rem;
}

.auth-card {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
}

@media (max-width: 576px) {
  .auth-card {
    padding: 1.5rem;
  }
}
</style> 