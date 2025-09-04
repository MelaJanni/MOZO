<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/UI/BaseButton.vue'
import { apiService } from '@/services/api'
import logo from '@/assets/mozo-logo.jpeg'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = route.params.token
const loading = ref(false)
const error = ref('')
const success = ref('')
const staffData = ref(null)

const joinBusiness = async () => {
  if (!authStore.isAuthenticated) {
    error.value = 'Debes iniciar sesión para unirte al negocio'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const user = authStore.getUser()
    const response = await apiService.joinStaffWithToken(token, {
      user_id: user.id
    })

    staffData.value = response.data.data
    success.value = response.data.message
    
    // Write to Firebase Realtime Database to notify admin
    try {
      console.log('🔔 JoinStaff: Writing staff request to Firebase...')
      const { writeStaffRequest } = await import('@/services/staffRealtime')
      
      // Get business ID from response or staffData
      const businessId = response.data.data?.business?.id || response.data.data?.business_id
      
      if (businessId) {
        await writeStaffRequest(businessId, {
          id: response.data.data?.id || Date.now(),
          name: user.name || user.display_name || 'Usuario',
          user_id: user.id,
          status: response.data.data?.status || 'pending',
          created_at: new Date().toISOString(),
          last_request_id: response.data.data?.id || Date.now(),
          last_request_name: user.name || user.display_name || 'Usuario',
          last_request_status: response.data.data?.status || 'pending',
          last_update: Date.now()
        })
        console.log('🔔 JoinStaff: Staff request written to Firebase successfully')
      } else {
        console.warn('🔔 JoinStaff: No business ID found in response')
      }
    } catch (firebaseError) {
      console.error('🔔 JoinStaff: Error writing to Firebase:', firebaseError)
      // Don't fail the whole process if Firebase write fails
    }
    
    // Redirect to waiter dashboard after 3 seconds
    setTimeout(() => {
      router.push('/waiter')
    }, 3000)

  } catch (err) {
    error.value = err.response?.data?.message || 'Error al unirse al negocio'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  // Store the current URL to redirect back after login
  localStorage.setItem('redirectAfterLogin', route.fullPath)
  router.push('/login')
}

const goToRegister = () => {
  // Store the current URL to redirect back after register
  localStorage.setItem('redirectAfterLogin', route.fullPath)
  router.push('/register')
}

onMounted(() => {
  if (!token) {
    error.value = 'Token de invitación inválido'
    return
  }

  if (authStore.isAuthenticated) {
    joinBusiness()
  }
})
</script>

<template>
  <div class="join-staff-container">
    <div class="join-card">
      <div class="join-header">
  <img :src="logo" alt="MOZO" class="logo" />
        <h1>Invitación de Trabajo</h1>
        <p>Has sido invitado a unirte a un negocio como miembro del personal</p>
      </div>

      <div v-if="loading" class="loading-section">
        <div class="loading-spinner"></div>
        <p>Procesando invitación...</p>
      </div>

      <div v-else-if="success" class="success-section">
        <div class="success-icon">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h2>¡Bienvenido al equipo!</h2>
        <p>{{ success }}</p>
        <div v-if="staffData" class="staff-info">
          <p><strong>Negocio:</strong> {{ staffData.business?.name }}</p>
          <p><strong>Cargo:</strong> {{ staffData.position }}</p>
        </div>
        <p class="redirect-message">
          Serás redirigido al panel de mozo en unos segundos...
        </p>
      </div>

      <div v-else-if="error" class="error-section">
        <div class="error-icon">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h2>Error</h2>
        <p>{{ error }}</p>
        
        <div v-if="error.includes('iniciar sesión')" class="auth-options">
          <BaseButton @click="goToLogin" variant="primary" class="auth-button">
            Iniciar Sesión
          </BaseButton>
          <BaseButton @click="goToRegister" variant="secondary" class="auth-button">
            Registrarse
          </BaseButton>
        </div>
      </div>

      <div v-else-if="!authStore.isAuthenticated" class="auth-section">
        <div class="auth-icon">
          <i class="bi bi-person-check"></i>
        </div>
        <h2>Autenticación Requerida</h2>
        <p>Para aceptar esta invitación, necesitas iniciar sesión o crear una cuenta.</p>
        
        <div class="auth-options">
          <BaseButton @click="goToLogin" variant="primary" class="auth-button">
            Iniciar Sesión
          </BaseButton>
          <BaseButton @click="goToRegister" variant="secondary" class="auth-button">
            Registrarse
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-staff-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.join-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.join-header {
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.join-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.join-header p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(106, 63, 234, 0.3);
  border-radius: 50%;
  border-top-color: #6A3FEA;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  font-size: 4rem;
  color: #22c55e;
}

.success-section h2 {
  color: #22c55e;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.staff-info {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: left;
}

.staff-info p {
  margin: 0.25rem 0;
  color: #15803d;
}

.redirect-message {
  font-size: 0.875rem;
  color: #64748b;
  font-style: italic;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
}

.error-section h2 {
  color: #ef4444;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.auth-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.auth-icon {
  font-size: 4rem;
  color: #6A3FEA;
}

.auth-section h2 {
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.auth-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
}

.auth-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

@media (min-width: 768px) {
  .auth-options {
    flex-direction: row;
    gap: 1rem;
  }
  
  .auth-button {
    flex: 1;
  }
}
</style>