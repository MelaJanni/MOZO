<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="text-center mb-4">
        <h1 class="h3">Recuperar contraseña</h1>
        <p class="text-muted">Ingresa tu correo electrónico para recibir un enlace de recuperación</p>
      </div>
      
      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleForgotPassword" v-if="!success">
        <div class="mb-4">
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
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mb-4" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Enviar enlace de recuperación
        </button>
        
        <div class="text-center">
          <router-link to="/login" class="link-primary">
            <i class="bi bi-arrow-left me-1"></i> Volver a inicio de sesión
          </router-link>
        </div>
      </form>
      
      <div class="text-center mt-3" v-if="success">
        <router-link to="/login" class="btn btn-outline-primary">
          Volver a inicio de sesión
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import authService from '@/services/auth'

export default {
  name: 'ForgotPasswordView',
  setup() {
    const email = ref('')
    const error = ref('')
    const success = ref('')
    const loading = ref(false)
    
    const isFormValid = computed(() => {
      return email.value.trim() !== '' && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    })
    
    const handleForgotPassword = async () => {
      if (!isFormValid.value) return
      
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        await authService.forgotPassword(email.value)
        success.value = 'Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.'
        email.value = ''
      } catch (err) {
        console.error('Error al solicitar recuperación de contraseña:', err)
        error.value = err.response?.data?.message || 'No se pudo enviar el enlace de recuperación. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    return {
      email,
      error,
      success,
      loading,
      isFormValid,
      handleForgotPassword
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