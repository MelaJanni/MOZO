<template>
  <div class="dashboard">
    <div class="container py-3">
      <div class="role-section">
        <div class="role-dropdown me-2">
          <button class="btn btn-outline-secondary dropdown-toggle" id="roleMenu" data-bs-toggle="dropdown">
            Rol Admin
          </button>
          <ul class="dropdown-menu" aria-labelledby="roleMenu">
            <li><a class="dropdown-item" href="#" @click="selectedRole = 'admin'">Admin</a></li>
            <li><a class="dropdown-item" href="#" @click="handleRoleChange">Mozo</a></li>
          </ul>
        </div>
        <div class="user-id-container d-flex align-items-center">
          <span class="user-id me-2">ID:{{ businessCode }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="copyBusinessCode" title="Copiar al portapapeles">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">
                <i class="bi bi-bell-fill text-primary me-2"></i>
                Prueba de Notificaciones
              </h5>
              <p class="card-text text-muted">
                Envía una notificación de prueba a todos los mozos activos para verificar el sistema.
              </p>
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-primary" 
                  @click="sendTestNotification"
                  :disabled="isSendingNotification"
                >
                  <i class="bi bi-send me-2"></i>
                  {{ isSendingNotification ? 'Enviando...' : 'Enviar Notificación de Prueba' }}
                </button>
                <button 
                  class="btn btn-outline-secondary" 
                  @click="sendTestNotificationToSpecificWaiter"
                  :disabled="isSendingNotification"
                >
                  <i class="bi bi-person-plus me-2"></i>
                  Enviar a Mozo Específico
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row g-3 card-grid">
        <div class="col-6">
          <router-link to="/admin/qr" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-qr-code"></i>
            </div>
            <div class="card-footer">QR</div>
          </router-link>
        </div>
        <div class="col-6">
          <router-link to="/admin/stats" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="card-footer">ESTADÍSTICAS</div>
          </router-link>
        </div>
        <div class="col-6">
          <router-link to="/admin/staff" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="card-footer">PERSONAL</div>
          </router-link>
        </div>
        <div class="col-6">
          <router-link to="/admin/settings" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-gear-fill"></i>
            </div>
            <div class="card-footer">CONFIGURACIÓN</div>
          </router-link>
        </div>
      </div>
    </div>
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div class="toast show" v-if="showToast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <strong class="me-auto">Notificación</strong>
          <button type="button" class="btn-close" @click="showToast = false"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import authService from '@/services/auth'
export default {
  name: 'AdminDashboardView',
  setup() {
    const router = useRouter()
    const businessCode = ref('FGT-464')
    const selectedRole = ref('admin')
    const showToast = ref(false)
    const toastMessage = ref('')
    const isSendingNotification = ref(false)
    const loadBusinessData = async () => {
      try {
        businessCode.value = 'FGT-464'
      } catch (err) {
        console.error('Error al cargar datos del negocio:', err)
      }
    }
    const copyBusinessCode = () => {
      navigator.clipboard.writeText(businessCode.value)
        .then(() => {
          showToast.value = true
          toastMessage.value = 'Código copiado al portapapeles'
          setTimeout(() => {
            showToast.value = false
          }, 3000)
        })
        .catch(err => {
          console.error('Error al copiar al portapapeles:', err)
        })
    }
    const sendTestNotification = async () => {
      isSendingNotification.value = true
      try {
        const response = await api.post('/admin/notifications/test', {
          waiter_id: 'all' // Enviar a todos los mozos
        })
        showToast.value = true
        toastMessage.value = 'Notificación de prueba enviada exitosamente'
        if (window.debugPanel) {
          window.debugPanel.addLog('info', 'Notificación de prueba enviada a todos los mozos', 'Admin Dashboard')
        }
      } catch (error) {
        console.error('Error al enviar notificación de prueba:', error)
        showToast.value = true
        toastMessage.value = 'Error al enviar notificación de prueba'
        if (window.debugPanel) {
          window.debugPanel.addLog('error', `Error al enviar notificación: ${error.message}`, 'Admin Dashboard', error)
        }
      } finally {
        isSendingNotification.value = false
        setTimeout(() => {
          showToast.value = false
        }, 3000)
      }
    }
    const sendTestNotificationToSpecificWaiter = async () => {
      const waiterId = prompt('Ingresa el ID del mozo para enviar la notificación de prueba:')
      if (!waiterId) return
      isSendingNotification.value = true
      try {
        const response = await api.post('/admin/notifications/test', {
          waiter_id: waiterId
        })
        showToast.value = true
        toastMessage.value = `Notificación de prueba enviada al mozo ${waiterId}`
        if (window.debugPanel) {
          window.debugPanel.addLog('info', `Notificación de prueba enviada al mozo ${waiterId}`, 'Admin Dashboard')
        }
      } catch (error) {
        console.error('Error al enviar notificación de prueba:', error)
        showToast.value = true
        toastMessage.value = 'Error al enviar notificación de prueba'
        if (window.debugPanel) {
          window.debugPanel.addLog('error', `Error al enviar notificación: ${error.message}`, 'Admin Dashboard', error)
        }
      } finally {
        isSendingNotification.value = false
        setTimeout(() => {
          showToast.value = false
        }, 3000)
      }
    }
    const handleRoleChange = () => {
      if (selectedRole.value === 'admin') {
        selectedRole.value = 'waiter'
      } else {
        selectedRole.value = 'admin'
      }
      if (selectedRole.value === 'waiter') {
        router.push('/waiter')
      }
    }
    onMounted(() => {
      loadBusinessData()
    })
    return {
      businessCode,
      selectedRole,
      showToast,
      toastMessage,
      isSendingNotification,
      copyBusinessCode,
      sendTestNotification,
      sendTestNotificationToSpecificWaiter,
      handleRoleChange
    }
  }
}
</script>
<style scoped>
</style>