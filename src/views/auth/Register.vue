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
          class="btn btn-primary w-100 mb-4" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Crear cuenta
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
import authService from '@/services/auth'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    
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
        await authService.register(
          name.value,
          email.value,
          password.value,
          passwordConfirmation.value
        )
        
        router.push({
          path: '/login',
          query: { registered: 'success' }
        })
      } catch (err) {
        console.error('Error de registro:', err)
        error.value = err.response?.data?.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    return {
      name,
      email,
      password,
      passwordConfirmation,
      error,
      loading,
      isEmailValid,
      isPasswordValid,
      doPasswordsMatch,
      isFormValid,
      handleRegister
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