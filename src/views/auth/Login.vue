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
        
        <!-- Contenedor para el botón GIS (solo web) -->
        <div 
          v-if="!isNativePlatform"
          id="google-signin-button" 
          class="d-flex justify-content-center mb-3"
          style="min-height: 44px;"
        ></div>
        
        <!-- Botón fallback si Google no carga -->
        <button 
          v-if="isNativePlatform || !isGoogleLoaded"
          type="button" 
          class="btn btn-outline-secondary w-100 mb-3"
          @click="handleGoogleLogin"
          :disabled="loading || isInitializing"
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
import { useGoogleAuth } from '@/composables/useGoogleAuth'
import { useNativeGoogleAuth } from '@/composables/useNativeGoogleAuth'
import apiService from '@/services/api'
import Swal from 'sweetalert2'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
  const { signInWithGoogleAndCheckUser, isInitializing, isGoogleLoaded, initializeGoogle } = useGoogleAuth()
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
        
        let googleToken, userEmail
        
        if (isNativePlatform) {
          // Usar autenticación nativa para móviles
          const result = await signInNative()
          googleToken = result.token
          userEmail = result.email
        } else {
          // Usar autenticación web
          const result = await signInWithGoogleAndCheckUser()
          googleToken = result.token
          userEmail = result.email
        }
        
        console.log('✅ Token de Google obtenido para:', userEmail)
        
        // Verificar si el usuario ya existe
        let userExists = true
        try {
          await apiService.checkUserExists(userEmail)
          console.log('👤 Usuario existe, procediendo con login...')
        } catch (err) {
          if (err.response?.status === 404) {
            userExists = false
            console.log('👤 Usuario no existe, se requerirá registro...')
          } else {
            throw err // Re-lanzar otros errores
          }
        }
        
        // Si el usuario no existe, mostrar confirmación de registro
        if (!userExists) {
          const result = await Swal.fire({
            title: '¡Bienvenido a MOZO!',
            html: `No tienes una cuenta registrada con <strong>${userEmail}</strong>.<br><br>¿Deseas crear una cuenta nueva y continuar?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '✅ Sí, crear cuenta',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
          })

          if (!result.isConfirmed) {
            error.value = 'Registro cancelado'
            return
          }
          
          console.log('👤 Usuario confirmó registro automático')
        }
        
        const loginData = {
          google_token: googleToken,
          fcm_token: localStorage.getItem('fcm_token') || undefined,
          platform: isNativePlatform ? 'android' : 'web'
        }

        // Verificar si hay código de invitación en la URL
        const urlParams = new URLSearchParams(window.location.search)
        const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
        if (invitationCode) {
          loginData.business_invitation_code = invitationCode
          console.log('🏢 Código de invitación detectado:', invitationCode)
        }

        const actionText = userExists ? 'login' : 'registro y login'
        console.log(`🚀 Enviando datos de ${actionText} al servidor...`)
        
        const response = await authStore.loginWithGoogle(loginData)
        
        // Mostrar mensaje apropiado
        if (!userExists) {
          await Swal.fire({
            title: '¡Cuenta creada!',
            html: `Tu cuenta ha sido creada exitosamente con <strong>${userEmail}</strong>`,
            icon: 'success',
            confirmButtonText: 'Continuar',
            timer: 3000,
            timerProgressBar: true
          })
        }
        
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
    
    // Función para renderizar el botón nativo de Google
    const renderGoogleButton = async () => {
      try {
        await initializeGoogle()
        
        if (typeof window.google !== 'undefined') {
          const buttonContainer = document.getElementById('google-signin-button')
          if (buttonContainer) {
            // Limpiar contenedor
            buttonContainer.innerHTML = ''
            
            // Renderizar botón nativo
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              width: 300,
              locale: 'es'
            })
            
            // Configurar callback directo
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              callback: async (response) => {
                if (response.credential) {
                  // Simular click en handleGoogleLogin pero con el token ya disponible
                  await handleGoogleLoginWithToken(response.credential)
                }
              }
            })
          }
        }
      } catch (error) {
        console.error('Error rendering Google button:', error)
      }
    }
    
    // Función auxiliar para manejar login con token directo
    const handleGoogleLoginWithToken = async (googleToken) => {
      try {
        loading.value = true
        error.value = ''

        // Extraer email del token
        const payload = JSON.parse(atob(googleToken.split('.')[1]))
        const userEmail = payload.email
        
        console.log('✅ Token de Google obtenido para:', userEmail)
        
        // Verificar si el usuario ya existe
        let userExists = true
        try {
          await apiService.checkUserExists(userEmail)
          console.log('👤 Usuario existe, procediendo con login...')
        } catch (err) {
          if (err.response?.status === 404) {
            userExists = false
            console.log('👤 Usuario no existe, se requerirá registro...')
          } else {
            throw err
          }
        }
        
        // Si el usuario no existe, mostrar confirmación de registro
        if (!userExists) {
          const result = await Swal.fire({
            title: '¡Bienvenido a MOZO!',
            html: `No tienes una cuenta registrada con <strong>${userEmail}</strong>.<br><br>¿Deseas crear una cuenta nueva y continuar?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '✅ Sí, crear cuenta',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
          })

          if (!result.isConfirmed) {
            error.value = 'Registro cancelado'
            return
          }
        }
        
        const loginData = {
          google_token: googleToken,
          fcm_token: localStorage.getItem('fcm_token') || undefined,
          platform: 'web'
        }

        // Verificar si hay código de invitación en la URL
        const urlParams = new URLSearchParams(window.location.search)
        const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
        if (invitationCode) {
          loginData.business_invitation_code = invitationCode
        }

        const response = await authStore.loginWithGoogle(loginData)
        
        // Mostrar mensaje apropiado
        if (!userExists) {
          await Swal.fire({
            title: '¡Cuenta creada!',
            html: `Tu cuenta ha sido creada exitosamente con <strong>${userEmail}</strong>`,
            icon: 'success',
            confirmButtonText: 'Continuar',
            timer: 3000,
            timerProgressBar: true
          })
        }
        
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

      } catch (err) {
        console.error('❌ Error en autenticación con Google:', err)
        
        if (err.response?.status === 401) {
          error.value = 'Token de Google inválido. Por favor, inténtalo de nuevo.'
        } else {
          error.value = err.response?.data?.message || err.message || 'Error al autenticarse con Google'
        }
      } finally {
        loading.value = false
      }
    }
    
    // Renderizar botón cuando el componente se monta
    onMounted(async () => {
      // Check for pending redirect result first (for mobile)
      if (isNativePlatform) {
        try {
          const { getAuth } = await import('@/services/firebase')
          const { getRedirectResult, GoogleAuthProvider } = await import('firebase/auth')
          const auth = await getAuth()
          
          if (auth) {
            const result = await getRedirectResult(auth)
            if (result) {
              console.log('🔄 Processing redirect result from Google Sign-In...')
              
              // Process the redirect result
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
              
              console.log('✅ Redirect result processed:', googleAuthResult.email)
              
              // Continue with the authentication flow
              await handleGoogleLoginWithToken(googleAuthResult.token)
              return
            }
          }
        } catch (error) {
          console.error('❌ Error processing redirect result:', error)
        }
      }
      
      if (!isNativePlatform) {
        await renderGoogleButton()
      }
    })
    
    return {
      email,
      password,
      remember,
      error,
      loading,
      isInitializing,
      isGoogleLoaded,
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