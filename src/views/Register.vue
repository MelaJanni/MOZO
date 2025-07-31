<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)

const isPasswordValid = computed(() => {
  return password.value.length >= 8
})

const doPasswordsMatch = computed(() => {
  return password.value === confirmPassword.value
})

const register = async () => {
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Por favor, completa todos los campos'
    return
  }
  
  if (!isPasswordValid.value) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  
  if (!doPasswordsMatch.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  
  if (!acceptTerms.value) {
    error.value = 'Debes aceptar los términos y condiciones'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const user = await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value
    })
    
    if (user) {
      router.push({ name: 'role-selection' })
    }
  } catch (err) {
    error.value = err.message || 'Error al registrarse'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push({ name: 'login' })
}

const registerWithGoogle = () => {
  console.log('Registro con Google')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="logo-container">
        <img src="@/assets/mozo-logo.svg" alt="MOZO Logo" class="logo" />
      </div>
      
      <h1 class="register-title">Crear cuenta</h1>
      
      <form @submit.prevent="register" class="register-form">
        <div class="form-group">
          <label for="name">Nombre completo</label>
          <input 
            id="name"
            type="text" 
            v-model="name" 
            placeholder="Tu nombre"
            required
            autocomplete="name"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            type="email" 
            v-model="email" 
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            v-model="password" 
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
          <span class="password-hint" :class="{ valid: isPasswordValid }">
            Mínimo 8 caracteres
          </span>
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirmar contraseña</label>
          <input 
            id="confirm-password"
            type="password" 
            v-model="confirmPassword" 
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
          <span 
            v-if="confirmPassword" 
            class="password-hint" 
            :class="{ valid: doPasswordsMatch }"
          >
            {{ doPasswordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden' }}
          </span>
        </div>
        
        <div class="form-group terms">
          <label class="checkbox-label">
            <input type="checkbox" v-model="acceptTerms" required />
            <span>Acepto los <a href="#" target="_blank">términos y condiciones</a></span>
          </label>
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <BaseButton 
          type="submit" 
          variant="primary" 
          :loading="isLoading" 
          block
        >
          Crear cuenta
        </BaseButton>
        
        <div class="social-register">
          <p class="divider"><span>O continuar con</span></p>
          
          <BaseButton 
            type="button" 
            variant="outline" 
            @click="registerWithGoogle" 
            block
          >
            <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google" class="google-icon" />
            Google
          </BaseButton>
        </div>
        
        <p class="login-link">
          ¿Ya tienes una cuenta?
          <button type="button" @click="goToLogin">
            Inicia sesión
          </button>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  padding: 1rem;
}

.register-card {
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

.register-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
}

.register-form {
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

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
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

.password-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.password-hint.valid {
  color: var(--success-color, #10b981);
}

.terms {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
  cursor: pointer;
}

.checkbox-label a {
  color: var(--primary-color);
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.error-message {
  color: var(--error-color, #ef4444);
  font-size: 0.875rem;
  text-align: center;
}

.social-register {
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

.login-link {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.login-link button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.login-link button:hover {
  text-decoration: underline;
}
</style> 