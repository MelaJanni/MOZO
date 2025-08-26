<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="text-center mb-4">
        <h1 class="h3">Crear cuenta</h1>
        <p class="text-muted">Regístrate para acceder a MOZO</p>
      </div>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleRegister">
        <div class="mb-3">
          <label for="name" class="form-label">Nombre completo</label>
          <input 
            type="text" 
            class="form-control" 
            id="name" 
            v-model="name" 
            required
            :disabled="loading"
            placeholder="Tu nombre completo"
          >
        </div>
        
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
          <div v-if="!isEmailValid && email" class="form-text text-danger">
            Introduce un correo electrónico válido
          </div>
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
            placeholder="Mínimo 8 caracteres"
          >
          <div v-if="!isPasswordValid && password" class="form-text text-danger">
            La contraseña debe tener al menos 8 caracteres
          </div>
        </div>
        
        <div class="mb-4">
          <label for="passwordConfirmation" class="form-label">Confirmar contraseña</label>
          <input 
            type="password" 
            class="form-control" 
            id="passwordConfirmation" 
            v-model="passwordConfirmation" 
            required
            :disabled="loading"
            placeholder="Repite tu contraseña"
          >
          <div v-if="!doPasswordsMatch && passwordConfirmation" class="form-text text-danger">
            Las contraseñas no coinciden
          </div>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mb-3" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Crear cuenta
        </button>
        
        <div class="text-center my-3">
          <span class="text-muted">O regístrate con</span>
        </div>
        
        <button 
          type="button" 
          class="btn btn-outline-secondary w-100 mb-4"
          @click="handleGoogleRegister"
          :disabled="loading || isInitializing"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-google me-2"></i> 
          {{ loading ? 'Registrando...' : 'Continuar con Google' }}
        </button>
        
        <div class="text-center">
          <span class="text-muted">¿Ya tienes una cuenta?</span> 
          <router-link to="/login" class="link-primary ms-1">Iniciar sesión</router-link>
        </div>
      </form>
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