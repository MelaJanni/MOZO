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
        
        <button 
          type="button" 
          class="btn btn-outline-secondary w-100 mb-3"
          @click="handleGoogleLogin"
          :disabled="loading"
        >
          <i class="bi bi-google me-2"></i> Google
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/auth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    
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
        await authService.login(email.value, password.value)
        router.push({ name: 'role-selection' })
      } catch (err) {
        console.error('Error de inicio de sesión:', err)
        error.value = err.response?.data?.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
      } finally {
        loading.value = false
      }
    }
    
    const handleGoogleLogin = async () => {
      alert('La función de inicio de sesión con Google será implementada próximamente')
    }
    
    return {
      email,
      password,
      remember,
      error,
      loading,
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