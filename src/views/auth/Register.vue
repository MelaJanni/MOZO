<template>
  <div class="auth-container">
    <!-- Icons -->
    <svg style="position:absolute;width:0;height:0;visibility:hidden">
      <symbol id="i-user" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </symbol>
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
    <div class="register">
      <header class="brand">
        <div class="wordmark"><img src="@/assets/mozo-logo.jpeg" alt="MÖZÖ"></div>
        <p class="subtitle">Crea tu cuenta para comenzar</p>
      </header>

      <form @submit.prevent="handleRegister" class="form">
        <div class="group">
          <label>Nombre completo</label>
          <div class="input has-icon">
            <svg class="i sm left"><use href="#i-user"/></svg>
            <input 
              v-model="name" 
              type="text" 
              placeholder="Tu nombre completo" 
              :disabled="loading"
            />
          </div>
        </div>

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
          <div v-if="!isEmailValid && email" class="validation-error">
            Introduce un correo electrónico válido
          </div>
        </div>

        <div class="group">
          <label>Contraseña</label>
          <div class="input has-icon with-button">
            <svg class="i sm left"><use href="#i-lock"/></svg>
            <input 
              v-model="password" 
              :type="showPassword?'text':'password'" 
              placeholder="Mínimo 8 caracteres" 
              autocomplete="new-password"
              :disabled="loading"
            />
            <button 
              type="button" 
              class="icon-btn" 
              @click="showPassword=!showPassword" 
              :aria-label="showPassword?'Ocultar':'Mostrar'"
            >
              <svg class="i sm"><use :href="showPassword ? '#i-eye-off' : '#i-eye'"/></svg>
            </button>
          </div>
          <div v-if="!isPasswordValid && password" class="validation-error">
            La contraseña debe tener al menos 8 caracteres
          </div>
        </div>

        <div class="group">
          <label>Confirmar contraseña</label>
          <div class="input has-icon with-button">
            <svg class="i sm left"><use href="#i-lock"/></svg>
            <input 
              v-model="passwordConfirmation" 
              :type="showPasswordConfirm?'text':'password'" 
              placeholder="Repite tu contraseña" 
              autocomplete="new-password"
              :disabled="loading"
            />
            <button 
              type="button" 
              class="icon-btn" 
              @click="showPasswordConfirm=!showPasswordConfirm" 
              :aria-label="showPasswordConfirm?'Ocultar':'Mostrar'"
            >
              <svg class="i sm"><use :href="showPasswordConfirm ? '#i-eye-off' : '#i-eye'"/></svg>
            </button>
          </div>
          <div v-if="!doPasswordsMatch && passwordConfirmation" class="validation-error">
            Las contraseñas no coinciden
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn primary" :disabled="loading || !isFormValid" type="submit">
          {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <div class="divider-google">
        <span>o</span>
      </div>

      <!-- Botón de Google -->
      <button 
        type="button" 
        class="btn google" 
        @click="handleGoogleRegister"
        :disabled="loading || isInitializing"
      >
        <div v-if="loading || isInitializing" class="google-loading">
          <div class="spinner"></div>
          <span>Registrando...</span>
        </div>
        <div v-else class="google-content">
          <svg class="google-icon"><use href="#i-google"/></svg>
          <span>Continuar con Google</span>
        </div>
      </button>

      <p class="foot">
        ¿Ya tienes una cuenta? 
        <router-link to="/login" class="link">Iniciar sesión</router-link>
      </p>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGoogleAuth } from '@/composables/useGoogleAuth'
import { useNativeGoogleAuth } from '@/composables/useNativeGoogleAuth'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
  const authStore = useAuthStore()
  const { signInWithGoogleAndCheckUser, isInitializing } = useGoogleAuth()
  const { signInWithGoogle: signInNative, isNativePlatform } = useNativeGoogleAuth()
    
    const name = ref('')
    const email = ref('')
    const password = ref('')
    const passwordConfirmation = ref('')
    const error = ref('')
    const loading = ref(false)
    const showPassword = ref(false)
    const showPasswordConfirm = ref(false)
    
    const isEmailValid = computed(() => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    })
    
    const isPasswordValid = computed(() => {
      return password.value.length >= 8
    })
    
    const doPasswordsMatch = computed(() => {
      return password.value === passwordConfirmation.value
    })
    
    const isFormValid = computed(() => {
      return name.value.trim() !== '' && 
             isEmailValid.value && 
             isPasswordValid.value && 
             doPasswordsMatch.value
    })
    
    const handleRegister = async () => {
      if (!isFormValid.value) return
      
      loading.value = true
      error.value = ''
      
      try {
        await authStore.register({
          name: name.value,
          email: email.value,
          password: password.value,
          password_confirmation: passwordConfirmation.value
        })

        // Ya está autenticado: ir directo a selección de rol
        router.push({ name: 'role-selection' })
      } catch (err) {
        console.error('Error de registro:', err)
        error.value = err.response?.data?.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    const handleGoogleRegister = async () => {
      try {
        loading.value = true
        error.value = ''

        console.log('🔵 Iniciando registro con Google...', isNativePlatform ? 'NATIVO' : 'WEB')
        
        let googleToken, userEmail
        
        if (isNativePlatform) {
          // Usar autenticación nativa para móviles
          const result = await signInNative()
          googleToken = result.token
          userEmail = result.email
        } else {
          // Usar autenticación web
          const result = await signInWithGoogleAndCheckUser(true)
          googleToken = result.token
          userEmail = result.email
        }
        
        console.log('✅ Token de Google obtenido para:', userEmail)
        
        const registerData = {
          google_token: googleToken, // Este es el id_token real de Google
          fcm_token: localStorage.getItem('fcm_token') || undefined,
          platform: isNativePlatform ? 'android' : 'web'
        }

        // Verificar si hay código de invitación en la URL
        const urlParams = new URLSearchParams(window.location.search)
        const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
        if (invitationCode) {
          registerData.business_invitation_code = invitationCode
          console.log('🏢 Código de invitación detectado:', invitationCode)
        }

        console.log('🚀 Enviando datos de registro al servidor...')
        
        // Para registro con Google, usamos el mismo endpoint que login
        // porque Google OAuth maneja tanto registro como login automáticamente
  const response = await authStore.loginWithGoogle(registerData)
        
        if (response.staff_request_created) {
          console.log(`✅ Solicitud de staff creada para: ${response.business_name}`)
          // Mostrar mensaje de éxito si se unió a un negocio
          if (response.message) {
            console.log('📢 Mensaje del servidor:', response.message)
          }
        }

        // Redirigir a selección de rol después del registro exitoso
        router.push({ name: 'role-selection' })

      } catch (err) {
        console.error('❌ Error en registro con Google:', err)
        
        // Manejar diferentes tipos de errores
        if (err.message === 'Redirecting to Google Sign-In...') {
          // El redirect está en proceso, no mostrar error
          error.value = 'Redirigiendo a Google Sign-In...'
          return // No cambiar loading.value para mantener el indicador
        } else if (err.message === 'Google sign-in cancelled by user') {
          error.value = 'Registro cancelado'
        } else if (err.response?.status === 401) {
          error.value = 'Token de Google inválido. Por favor, inténtalo de nuevo.'
        } else {
          error.value = err.response?.data?.message || err.message || 'Error al registrarse con Google'
        }
      } finally {
        // Solo cambiar loading si no es un redirect
        if (!error.value?.includes('Redirigiendo')) {
          loading.value = false
        }
      }
    }
    
    return {
      name,
      email,
      password,
      passwordConfirmation,
      error,
      loading,
      showPassword,
      showPasswordConfirm,
      isInitializing,
      isEmailValid,
      isPasswordValid,
      doPasswordsMatch,
      isFormValid,
      handleRegister,
      handleGoogleRegister
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/styles/screens/auth.scss';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
</style> 