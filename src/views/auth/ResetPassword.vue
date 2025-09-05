<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="text-center mb-4">
        <h1 class="h3">Restablecer contraseña</h1>
        <p class="text-muted">Crea una nueva contraseña segura</p>
      </div>
      
      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleResetPassword" v-if="!success">
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
          <label for="password" class="form-label">Nueva contraseña</label>
          <input 
            type="password" 
            class="form-control" 
            id="password" 
            v-model="password" 
            required
            :disabled="loading"
            placeholder="Min. 8 caracteres, mayúscula y número"
          >
          <div v-if="!isPasswordValid && password" class="form-text text-danger">
            La contraseña debe tener al menos 8 caracteres, una mayúscula y un número
          </div>
        </div>
        
        <div class="mb-4">
          <label for="passwordConfirmation" class="form-label">Confirmar nueva contraseña</label>
          <input 
            type="password" 
            class="form-control" 
            id="passwordConfirmation" 
            v-model="passwordConfirmation" 
            required
            :disabled="loading"
            placeholder="Repite tu nueva contraseña"
          >
          <div v-if="!doPasswordsMatch && passwordConfirmation" class="form-text text-danger">
            Las contraseñas no coinciden
          </div>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mb-4" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Cambiar contraseña
        </button>
        
        <div class="text-center">
          <router-link to="/login" class="link-primary">
            <i class="bi bi-arrow-left me-1"></i> Volver a inicio de sesión
          </router-link>
        </div>
      </form>
      
      <div class="text-center mt-3" v-if="success">
        <router-link to="/login" class="btn btn-primary">
          Ir a inicio de sesión
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from '@/services/auth'

export default {
  name: 'ResetPasswordView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const token = ref('')
    const email = ref('')
    const password = ref('')
    const passwordConfirmation = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)
    
    const isPasswordValid = computed(() => {
      const hasMinLength = password.value.length >= 8
      const hasUppercase = /[A-Z]/.test(password.value)
      const hasNumber = /\d/.test(password.value)
      return hasMinLength && hasUppercase && hasNumber
    })
    
    const doPasswordsMatch = computed(() => {
      return password.value === passwordConfirmation.value
    })
    
    const isFormValid = computed(() => {
      return token.value !== '' && 
             email.value.trim() !== '' && 
             isPasswordValid.value && 
             doPasswordsMatch.value
    })
    
    onMounted(() => {
      token.value = route.query.token || ''
      email.value = route.query.email || ''
      
      if (!token.value) {
        error.value = 'Token de restablecimiento no válido o expirado. Por favor, solicita un nuevo enlace de recuperación.'
      }
    })
    
    const handleResetPassword = async () => {
      if (!isFormValid.value) return
      
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        await authService.resetPassword(
          token.value,
          email.value,
          password.value,
          passwordConfirmation.value
        )
        success.value = 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.'
        password.value = ''
        passwordConfirmation.value = ''
      } catch (err) {
        console.error('Error al restablecer contraseña:', err)
        error.value = err.response?.data?.message || 'No se pudo restablecer la contraseña. Por favor, inténtalo de nuevo o solicita un nuevo enlace.'
      } finally {
        loading.value = false
      }
    }
    
    return {
      email,
      password,
      passwordConfirmation,
      error,
      success,
      loading,
      isPasswordValid,
      doPasswordsMatch,
      isFormValid,
      handleResetPassword
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