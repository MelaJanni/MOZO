<template>
  <div class="callback-container">
    <div class="callback-content">
      <div class="spinner"></div>
      <p class="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = ref('Procesando autenticación...')

onMounted(async () => {
  try {
    const { code, error, state } = route.query
    
    if (error) {
      message.value = 'Error en la autenticación'
      
      // Si es un popup, enviar error al padre
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin)
        window.close()
        return
      }
      
      // Si es una ventana normal, redirigir con error
      setTimeout(() => {
        router.push({ 
          name: 'login',
          query: { error: 'google_auth_failed' }
        })
      }, 2000)
      return
    }
    
    if (!code) {
      message.value = 'Código de autorización no encontrado'
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No authorization code received'
        }, window.location.origin)
        window.close()
        return
      }
      
      setTimeout(() => {
        router.push({ name: 'login' })
      }, 2000)
      return
    }
    
    message.value = 'Validando con el servidor...'
    
    // Preparar datos para el servidor
    const loginData = {
      google_auth_code: code,
      fcm_token: localStorage.getItem('fcm_token') || undefined,
      platform: 'web'
    }
    
    // Verificar código de invitación
    const invitationCode = route.query.invitation_code || route.query.business_invitation_code
    if (invitationCode) {
      loginData.business_invitation_code = invitationCode
    }
    
    // Autenticar con el servidor
    const result = await authStore.loginWithGoogle(loginData)
    
    message.value = 'Autenticación exitosa'
    
    // Si es un popup, notificar al padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code: code,
        result: result
      }, window.location.origin)
      window.close()
      return
    }
    
    // Si es una ventana normal, redirigir
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
      router.push(redirectUrl)
    } else {
      router.push({ name: 'role-selection' })
    }
    
  } catch (error) {
    console.error('❌ Error en callback OAuth:', error)
    message.value = 'Error en la autenticación'
    
    if (window.opener) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error.message || 'Authentication failed'
      }, window.location.origin)
      window.close()
      return
    }
    
    setTimeout(() => {
      router.push({ 
        name: 'login',
        query: { error: 'google_auth_failed' }
      })
    }, 2000)
  }
})
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #ffffff;
}

.callback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(159, 84, 253, 0.2);
  border-radius: 50%;
  border-top-color: #9f54fd;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
}
</style>