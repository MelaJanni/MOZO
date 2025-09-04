<template>
  <div class="auth-container">
    <!-- Icons -->
    <svg style="position:absolute;width:0;height:0;visibility:hidden">
      <symbol id="i-mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="i-arrow-left" viewBox="0 0 24 24">
        <path d="M19 12H5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
    </svg>

    <div class="wrap">
    <div class="forgot-password">
      <header class="brand">
        <div class="wordmark"><img src="@/assets/mozo-logo.jpeg" alt="MÖZÖ"></div>
        <p class="subtitle">Recupera el acceso a tu cuenta</p>
      </header>

      <div v-if="success" class="card">
        <p>{{ success }}</p>
        <router-link to="/login" class="link back-link">
          <svg class="i sm"><use href="#i-arrow-left"/></svg>
          Volver al inicio de sesión
        </router-link>
      </div>

      <form @submit.prevent="handleForgotPassword" class="form" v-if="!success">
        <div class="group">
          <label>Correo electrónico</label>
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
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn primary" :disabled="loading || !isFormValid" type="submit">
          {{ loading ? 'Enviando…' : 'Enviar enlace de recuperación' }}
        </button>
      </form>
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

<style lang="scss">
@import '@/assets/styles/screens/auth.scss';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
</style> 