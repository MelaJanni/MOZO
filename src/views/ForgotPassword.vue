<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { emailValidator } from '@/utils/validators'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const error = ref('')
const success = ref(false)
const isLoading = ref(false)

const validateForm = () => {
  const emailValidation = emailValidator(email.value)
  if (emailValidation !== true) {
    error.value = emailValidation
    return false
  }
  
  error.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const result = await authStore.forgotPassword(email.value)
    
    if (result) {
      success.value = true
    } else {
      error.value = 'No se pudo enviar el correo de recuperación. Por favor, inténtalo de nuevo.'
    }
  } catch (err) {
    error.value = err.message || 'Error al enviar el correo de recuperación'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="forgot-password-header">
        <h1>Recuperar contraseña</h1>
        <p v-if="!success">Ingresa tu correo electrónico para recibir un enlace de recuperación</p>
      </div>
      
      <div v-if="success" class="success-message">
        <p>Hemos enviado un correo electrónico a <strong>{{ email }}</strong> con instrucciones para restablecer tu contraseña.</p>
        <p>Por favor, revisa tu bandeja de entrada y sigue las instrucciones.</p>
        <BaseButton 
          @click="goToLogin" 
          variant="primary" 
          block
          class="mt-4"
        >
          Volver a inicio de sesión
        </BaseButton>
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="forgot-password-form">
        <BaseInput
          v-model="email"
          label="Correo electrónico"
          type="email"
          :error="error"
          required
          autocomplete="email"
          name="email"
        />
        
        <BaseButton
          type="submit"
          :loading="isLoading"
          block
        >
          Enviar enlace
        </BaseButton>
        
        <div class="back-link">
          <a href="#" @click.prevent="goToLogin">Volver a inicio de sesión</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: #f9fafb;
}

.forgot-password-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 2rem;
}

.forgot-password-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
}

.success-message {
  text-align: center;
  color: var(--success-color);
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: rgba(16, 185, 129, 0.1);
  margin-bottom: 1.5rem;
}

.success-message p {
  margin-bottom: 0.5rem;
}

.back-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
}

.back-link a {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}

.mt-4 {
  margin-top: 1rem;
}
</style> 