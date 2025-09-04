<template>
  <button 
    type="button" 
    class="google-sign-in-btn" 
    @click="handleGoogleSignIn"
    :disabled="loading"
  >
    <div v-if="loading" class="google-loading">
      <div class="spinner"></div>
      <span>{{ loadingText }}</span>
    </div>
    <div v-else class="google-content">
      <svg class="google-icon" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>{{ buttonText }}</span>
    </div>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  mode: {
    type: String,
    default: 'login', // 'login' or 'register'
    validator: (value) => ['login', 'register'].includes(value)
  }
})

const emit = defineEmits(['success', 'error'])

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const buttonText = computed(() => {
  return props.mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'
})

const loadingText = computed(() => {
  return props.mode === 'register' ? 'Registrando...' : 'Iniciando...'
})

const handleGoogleSignIn = async () => {
  try {
    loading.value = true
    
    // Usar redirect directo para evitar problemas de COOP
    await signInWithRedirect()
    
  } catch (error) {
    console.error('❌ Error en Google Sign-In:', error)
    emit('error', error.message || 'Error al iniciar sesión con Google')
  } finally {
    loading.value = false
  }
}

const signInWithRedirect = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId || clientId === 'your-google-client-id.googleusercontent.com') {
    throw new Error('Google Client ID no configurado. Configura VITE_GOOGLE_CLIENT_ID en tu archivo .env')
  }

  // Guardar URL de redirección actual si es necesario
  const currentUrl = window.location.href
  if (currentUrl !== window.location.origin + '/login') {
    localStorage.setItem('redirectAfterLogin', currentUrl)
  }

  // Construir URL de autorización de Google OAuth2
  const authUrl = new URL('https://accounts.google.com/oauth/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', window.location.origin + '/auth/callback')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', Math.random().toString(36).substring(2))

  // Verificar código de invitación y agregarlo al state
  const urlParams = new URLSearchParams(window.location.search)
  const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
  if (invitationCode) {
    authUrl.searchParams.set('state', authUrl.searchParams.get('state') + '&invitation_code=' + invitationCode)
  }

  // Redirigir a Google OAuth
  window.location.href = authUrl.toString()
}
</script>

<style scoped>
.google-sign-in-btn {
  width: 100%;
  border: 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  min-height: 44px;
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  color: #1f2937;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(16, 0, 43, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.google-sign-in-btn:hover:not(:disabled) {
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.google-sign-in-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.google-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.google-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.google-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(159, 84, 253, 0.2);
  border-radius: 50%;
  border-top-color: #9f54fd;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>