<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { passwordValidator, passwordMatchValidator } from '@/utils/validators'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const resetToken = ref('')
const passwordData = reactive({
  password: '',
  confirmPassword: ''
})
const errors = reactive({
  password: '',
  confirmPassword: '',
  form: ''
})
const success = ref(false)
const isLoading = ref(false)
onMounted(() => {
  const token = route.query.token
  if (!token) {
    errors.form = 'Enlace de recuperación inválido. Por favor, solicita uno nuevo.'
    return
  }
  resetToken.value = token
})
const validateForm = () => {
  let isValid = true
  const passwordValidation = passwordValidator(passwordData.password)
  if (passwordValidation !== true) {
    errors.password = passwordValidation
    isValid = false
  } else {
    errors.password = ''
  }
  const confirmPasswordValidation = passwordMatchValidator(passwordData.password, passwordData.confirmPassword)
  if (confirmPasswordValidation !== true) {
    errors.confirmPassword = confirmPasswordValidation
    isValid = false
  } else {
    errors.confirmPassword = ''
  }
  return isValid
}
const handleSubmit = async () => {
  if (!validateForm()) return
  isLoading.value = true
  errors.form = ''
  try {
    const result = await authStore.resetPassword(resetToken.value, passwordData.password)
    if (result) {
      success.value = true
    } else {
      errors.form = 'No se pudo restablecer la contraseña. Por favor, inténtalo de nuevo.'
    }
  } catch (err) {
    errors.form = err.message || 'Error al restablecer la contraseña'
  } finally {
    isLoading.value = false
  }
}
const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>
<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <div class="reset-password-header">
        <h1>Restablecer contraseña</h1>
        <p v-if="!success">Ingresa tu nueva contraseña</p>
      </div>
      <div v-if="success" class="success-message">
        <p>¡Tu contraseña ha sido restablecida con éxito!</p>
        <p>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
        <BaseButton 
          @click="goToLogin" 
          variant="primary" 
          block
          class="mt-4"
        >
          Ir a inicio de sesión
        </BaseButton>
      </div>
      <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
        <p v-if="errors.form" class="form-error">{{ errors.form }}</p>
        <BaseInput
          v-model="passwordData.password"
          label="Nueva contraseña"
          type="password"
          :error="errors.password"
          required
          autocomplete="new-password"
          name="password"
        />
        <BaseInput
          v-model="passwordData.confirmPassword"
          label="Confirmar nueva contraseña"
          type="password"
          :error="errors.confirmPassword"
          required
          autocomplete="new-password"
          name="confirmPassword"
        />
        <BaseButton
          type="submit"
          :loading="isLoading"
          block
        >
          Restablecer contraseña
        </BaseButton>
        <div class="back-link">
          <a href="#" @click.prevent="goToLogin">Volver a inicio de sesión</a>
        </div>
      </form>
    </div>
  </div>
</template>
<style scoped>
.reset-password-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: #f9fafb;
}
.reset-password-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
}
.reset-password-header {
  text-align: center;
  margin-bottom: 2rem;
}
.reset-password-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.reset-password-form {
  display: flex;
  flex-direction: column;
}
.form-error {
  color: var(--error-color);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background-color: rgba(239, 68, 68, 0.1);
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