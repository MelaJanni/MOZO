<template>
  <div class="auth-container">
    <!-- Icons -->
    <svg style="position:absolute;width:0;height:0;visibility:hidden">
      <symbol id="i-mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="i-lock" viewBox="0 0 24 24">
        <rect x="4" y="10" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </symbol>
      <symbol id="i-eye" viewBox="0 0 24 24">
        <path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </symbol>
      <symbol id="i-eye-off" viewBox="0 0 24 24">
        <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M2.5 12S6.5 5.5 12 5.5c1.6 0 3 .4 4.3 1" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M21.5 12S17.5 18.5 12 18.5c-1.5 0-2.9-.3-4.1-.9" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </symbol>
      <symbol id="i-google" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </symbol>
    </svg>

    <div class="wrap">
    <div class="login">
      <header class="brand">
        <div class="wordmark"><img src="@/assets/mozo-logo.jpeg" alt="MÖZÖ"></div>
        <p class="subtitle">Ingresa para disfrutar de la experiencia MÖZÖ</p>
      </header>

      <form @submit.prevent="handleLogin" class="form">
        <div class="group">
          <label>Correo</label>
          <div class="input has-icon">
            <svg class="i sm left"><use href="#i-mail"/></svg>
            <input 
              v-model="email" 
              type="email" 
              placeholder="tucorreo@ejemplo.com" 
              autocomplete="email"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="group">
          <label>Contraseña</label>
          <div class="input has-icon with-button">
            <svg class="i sm left"><use href="#i-lock"/></svg>
            <input 
              v-model="password" 
              :type="showPwd?'text':'password'" 
              placeholder="••••••••" 
              autocomplete="current-password"
              :disabled="loading"
            />
            <button 
              type="button" 
              class="icon-btn" 
              @click="showPwd=!showPwd" 
              :aria-label="showPwd?'Ocultar':'Mostrar'"
            >
              <svg class="i sm"><use :href="showPwd ? '#i-eye-off' : '#i-eye'"/></svg>
            </button>
          </div>
          <div class="row justify-content-center align-items-center my-3">
            <div class="col-12 d-flex justify-content-between align-items-center">
              <label class="remember">
                <input type="checkbox" v-model="remember" />
                <span>Recordarme</span>
              </label>
              <router-link to="/forgot-password" class="link small">Olvidé mi contraseña</router-link>
            </div>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn primary" :disabled="loading || !isFormValid" type="submit">
          {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="divider-google">
        <span>o</span>
      </div>

      <!-- Botón de Google -->
      <GoogleSignInBtn 
        mode="login" 
        @success="handleGoogleSuccess"
        @error="handleGoogleError"
      />

      <p class="foot">
        ¿No tienes una cuenta? 
        <router-link to="/register" class="link">Registrarse</router-link>
      </p>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNativeGoogleAuth } from '@/composables/useNativeGoogleAuth'
import GoogleSignInBtn from '@/components/GoogleSignInBtn.vue'
import apiService from '@/services/api'
import Swal from 'sweetalert2'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'LoginView',
  components: {
    GoogleSignInBtn
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
  const { signInWithGoogle: signInNative, isNativePlatform, extractEmailFromToken } = useNativeGoogleAuth()
    
    const email = ref('')
    const password = ref('')
    const remember = ref(false)
    const error = ref('')
    const loading = ref(false)
    const showPwd = ref(false)

    // Cargar datos guardados al inicializar
    const loadSavedCredentials = () => {
      const savedEmail = localStorage.getItem('mozo_remember_email')
      const savedRemember = localStorage.getItem('mozo_remember_checked')
      
      if (savedEmail && savedRemember === 'true') {
        email.value = savedEmail
        remember.value = true
      }
    }

    // Guardar o limpiar datos según el checkbox
    const handleRememberChange = () => {
      if (remember.value) {
        // Solo guardamos el email cuando se marca el checkbox
        if (email.value) {
          localStorage.setItem('mozo_remember_email', email.value)
          localStorage.setItem('mozo_remember_checked', 'true')
        }
      } else {
        // Limpiamos los datos guardados
        localStorage.removeItem('mozo_remember_email')
        localStorage.removeItem('mozo_remember_checked')
      }
    }
    
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
        
        // Guardar credenciales si el usuario lo desea
        if (remember.value) {
          localStorage.setItem('mozo_remember_email', email.value)
          localStorage.setItem('mozo_remember_checked', 'true')
        }
        
        router.push({ name: 'role-selection' })
      } catch (err) {
        console.error('Error de inicio de sesión:', err)
        error.value = err.response?.data?.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    const handleGoogleSuccess = (result) => {
      console.log('✅ Google Sign-In exitoso:', result)
      // El componente ya maneja la redirección
    }

    const handleGoogleError = (errorMessage) => {
      console.error('❌ Error en Google Sign-In:', errorMessage)
      error.value = errorMessage
      setTimeout(() => {
        error.value = ''
      }, 5000)
    }
    
    // Watchers para manejar el guardado automático
    watch(remember, handleRememberChange)
    
    watch(email, () => {
      // Si el usuario está escribiendo y tiene marcado recordar, guardamos automáticamente
      if (remember.value && email.value) {
        localStorage.setItem('mozo_remember_email', email.value)
      }
    })
    
    // Verificar resultado de redirect cuando el componente se monta
    onMounted(async () => {
      // Cargar credenciales guardadas
      loadSavedCredentials()
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
      showPwd,
      isNativePlatform,
      isFormValid,
      handleLogin,
      handleGoogleSuccess,
      handleGoogleError,
      handleRememberChange
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/styles/screens/auth.scss';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
</style> 