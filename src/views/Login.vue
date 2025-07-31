<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const email = ref('')
const password = ref('')
const rememberMe = ref(false)

const login = async () => {
  if (!email.value || !password.value) {
    error.value = 'Por favor, completa todos los campos'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const user = await authStore.login({
      email: email.value,
      password: password.value
    })
    
    if (user) {
      router.push({ name: 'role-selection' })
    }
  } catch (err) {
    error.value = err.message || 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}

const goToRegister = () => {
  router.push({ name: 'register' })
}

const goToForgotPassword = () => {
  router.push({ name: 'forgot-password' })
}

const loginWithGoogle = () => {
  console.log('Login con Google')
}
</script>

<template>
  <div class="container">
    <div class="row justify-content-center align-items-center min-vh-100 py-5">
      <div class="col-12 col-md-8 col-lg-6 col-xl-5">
        <div class="card shadow-sm rounded-4">
          <div class="card-body p-4 p-lg-5">
            <div class="text-center mb-4">
              <img src="@/assets/mozo-logo.svg" alt="MOZO Logo" class="mb-3" width="80" height="80" />
              <h2 class="fw-bold">Iniciar sesión</h2>
            </div>
            
            <form @submit.prevent="login">
              <div class="mb-3">
                <label for="email" class="form-label fw-medium">Email</label>
                <input 
                  id="email"
                  type="email" 
                  v-model="email" 
                  class="form-control"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
              </div>
              
              <div class="mb-3">
                <label for="password" class="form-label fw-medium">Contraseña</label>
                <input 
                  id="password"
                  type="password" 
                  v-model="password" 
                  class="form-control"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="form-check">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    v-model="rememberMe"
                    class="form-check-input" 
                  />
                  <label class="form-check-label" for="rememberMe">Recordarme</label>
                </div>
                
                <button 
                  type="button" 
                  class="btn btn-link p-0 text-decoration-none" 
                  @click="goToForgotPassword"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              
              <div v-if="error" class="alert alert-danger py-2 mb-3" role="alert">
                {{ error }}
              </div>
              
              <BaseButton 
                type="submit" 
                variant="primary" 
                :loading="isLoading" 
                block
                class="mb-3"
              >
                Iniciar sesión
              </BaseButton>
              
              <div class="text-center my-3">
                <p class="text-secondary mb-2">O continuar con</p>
                
                <button 
                  type="button" 
                  class="btn btn-outline-secondary w-100"
                  @click="loginWithGoogle"
                >
                  <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" 
                       alt="Google" width="20" height="20" class="me-2" />
                  Google
                </button>
              </div>
              
              <div class="text-center mt-4">
                <p class="mb-0">
                  ¿No tienes una cuenta?
                  <button 
                    type="button" 
                    class="btn btn-link p-0 text-decoration-none ms-1"
                    @click="goToRegister"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 28rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.logo {
  width: 5rem;
  height: 5rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.form-group input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.forgot-password {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
}

.forgot-password:hover {
  text-decoration: underline;
}

.error-message {
  color: var(--error-color, #ef4444);
  font-size: 0.875rem;
  text-align: center;
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 0.5rem;
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}

.register-link {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.register-link button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.register-link button:hover {
  text-decoration: underline;
}
</style> 