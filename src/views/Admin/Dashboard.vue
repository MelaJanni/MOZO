<template>
  <div class="dashboard">
    <!-- Debug info -->
    <div style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; z-index: 9999; font-size: 11px; border: 1px solid #ccc; max-width: 300px;">
      <strong>Debug Info:</strong><br>
      Computed requiresBusinessSetup: {{ requiresBusinessSetup }}<br>
      Store requiresBusinessSetup: {{ adminStore.requiresBusinessSetup }}<br>
      isDataLoaded: {{ isDataLoaded }}<br>
      Business data exists: {{ !!adminStore.businessData }}<br>
      Store error: {{ adminStore.error }}
    </div>
    
    <!-- Mostrar setup de negocio si es requerido -->
    <BusinessSetup 
      v-if="requiresBusinessSetup" 
      @business-created="onBusinessCreated"
    />
    
    <!-- Dashboard normal si ya tiene negocio -->
    <div v-else class="container py-3">
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
        
        <!-- Business Selector - Only show if multiple businesses available -->
        <div v-if="availableBusinesses.length > 1" class="business-dropdown me-2">
          <button 
            class="btn btn-outline-primary dropdown-toggle" 
            @click="toggleBusinessDropdown"
            :disabled="isLoadingBusinessSwitch"
          >
            <i class="bi bi-building me-1"></i>
            {{ isLoadingBusinessSwitch ? 'Cambiando...' : currentBusinessName }}
            <i v-if="isLoadingBusinessSwitch" class="bi bi-arrow-clockwise spin ms-1"></i>
          </button>
          <div class="dropdown-menu" :class="{ show: showBusinessDropdown }">
            <div v-for="business in availableBusinesses" :key="business.id" class="dropdown-item-wrapper">
              <a 
                class="dropdown-item" 
                href="#" 
                @click="switchBusiness(business)"
                :class="{ active: business.id === adminStore.activeBusinessId }"
              >
                <i class="bi bi-building me-2"></i>
                {{ business.name }}
                <small v-if="business.id === adminStore.activeBusinessId" class="text-success ms-2">
                  <i class="bi bi-check-circle-fill"></i>
                </small>
              </a>
            </div>
          </div>
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
      
      <!-- Toast de notificaciones -->
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
  </div>
</template>
<script>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import authService from '@/services/auth'
import { useAdminStore } from '@/stores/admin'
import { useNotificationsStore } from '@/stores/notifications'
import BusinessSetup from '@/components/Admin/BusinessSetup.vue'
export default {
  name: 'AdminDashboardView',
  components: {
    BusinessSetup
  },
  setup() {
    const router = useRouter()
    const adminStore = useAdminStore()
    const notificationsStore = useNotificationsStore()
    
    const businessCode = ref('')
    const selectedRole = ref('admin')
    const showToast = ref(false)
    const toastMessage = ref('')
    const isSendingNotification = ref(false)
    const isDataLoaded = ref(false)
    const showBusinessDropdown = ref(false)
    const isLoadingBusinessSwitch = ref(false)
    
    // Computed properties for business management
    const availableBusinesses = computed(() => adminStore.availableBusinesses || [])
    const currentBusinessName = computed(() => {
      const current = availableBusinesses.value.find(b => b.id === adminStore.activeBusinessId)
      return current?.name || adminStore.businessData?.name || 'Negocio'
    })
    
    // Computed para reactividad completa
    const requiresBusinessSetup = computed(() => {
      console.log('🔄 Computed requiresBusinessSetup evaluado:', adminStore.requiresBusinessSetup)
      return adminStore.requiresBusinessSetup && isDataLoaded.value
    })
    
    // Watch para debug
    watch(() => adminStore.requiresBusinessSetup, (newVal, oldVal) => {
      console.log('👀 Watch: requiresBusinessSetup cambió de', oldVal, 'a', newVal)
    })
    
    const loadBusinessData = async () => {
      try {
        console.log('🔍 Cargando datos del negocio...')
        await adminStore.fetchBusinessData()
        
        // Si no requiere setup de negocio, cargar la lista de todos los negocios disponibles
        if (!adminStore.requiresBusinessSetup) {
          try {
            await adminStore.fetchAllBusinesses()
            console.log('📋 Negocios disponibles:', adminStore.availableBusinesses)
          } catch (err) {
            console.warn('Error al cargar lista de negocios:', err)
          }
        }
        
        isDataLoaded.value = true
        
        console.log('📊 Estado después de cargar:', {
          requiresBusinessSetup: adminStore.requiresBusinessSetup,
          computedRequiresBusinessSetup: requiresBusinessSetup.value,
          businessData: adminStore.businessData,
          invitationCode: adminStore.invitationCode,
          availableBusinesses: adminStore.availableBusinesses,
          isDataLoaded: isDataLoaded.value
        })
        
        if (adminStore.businessData && adminStore.invitationCode) {
          businessCode.value = adminStore.invitationCode
        }
      } catch (err) {
        console.error('Error al cargar datos del negocio:', err)
        isDataLoaded.value = true // Marcar como cargado incluso con error
      }
    }
    
    const onBusinessCreated = async (result) => {
      showToast.value = true
      toastMessage.value = 'Negocio creado exitosamente'
      
      console.log('✅ Negocio creado, result:', result)
      
      // Actualizar código de negocio
      if (result.business?.invitation_code) {
        businessCode.value = result.business.invitation_code
      }
      
      setTimeout(() => {
        showToast.value = false
      }, 5000)
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
    
    const toggleBusinessDropdown = () => {
      showBusinessDropdown.value = !showBusinessDropdown.value
    }
    
    const switchBusiness = async (business) => {
      if (business.id === adminStore.activeBusinessId) {
        showBusinessDropdown.value = false
        return // Ya está seleccionado
      }
      
      try {
        isLoadingBusinessSwitch.value = true
        showBusinessDropdown.value = false
        
        showToast.value = true
        toastMessage.value = `Cambiando a ${business.name}...`
        
        await adminStore.selectActiveBusiness(business.id)
        
        // Actualizar código de negocio
        businessCode.value = adminStore.invitationCode || ''
        
        showToast.value = true
        toastMessage.value = `Negocio cambiado a: ${business.name}`
        
        setTimeout(() => {
          showToast.value = false
        }, 3000)
      } catch (error) {
        console.error('Error al cambiar negocio:', error)
        showToast.value = true
        toastMessage.value = 'Error al cambiar de negocio'
        setTimeout(() => {
          showToast.value = false
        }, 3000)
      } finally {
        isLoadingBusinessSwitch.value = false
      }
    }
    onMounted(async () => {
      await loadBusinessData()
      // Inicializar notificaciones en tiempo real después de cargar datos del negocio
      try {
        await notificationsStore.initializeRealTimeNotifications()
        console.log('✅ Notificaciones en tiempo real iniciadas en Admin Dashboard')
      } catch (error) {
        console.error('❌ Error iniciando notificaciones en tiempo real:', error)
      }
      
      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', (event) => {
        const businessDropdown = document.querySelector('.business-dropdown')
        if (businessDropdown && !businessDropdown.contains(event.target)) {
          showBusinessDropdown.value = false
        }
      })
    })

    onUnmounted(() => {
      // Desconectar listeners al salir del componente
      notificationsStore.disconnectRealTimeNotifications()
    })
    return {
      adminStore,
      businessCode,
      selectedRole,
      showToast,
      toastMessage,
      isSendingNotification,
      requiresBusinessSetup,
      isDataLoaded,
      availableBusinesses,
      currentBusinessName,
      showBusinessDropdown,
      isLoadingBusinessSwitch,
      copyBusinessCode,
      toggleBusinessDropdown,
      sendTestNotification,
      sendTestNotificationToSpecificWaiter,
      handleRoleChange,
      switchBusiness,
      onBusinessCreated
    }
  }
}
</script>
<style scoped>
.role-section {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.business-dropdown {
  position: relative;
}

.business-dropdown .dropdown-toggle {
  display: flex;
  align-items: center;
  max-width: 200px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  border: 1px solid #007bff;
  background: white;
  transition: all 0.2s ease;
}

.business-dropdown .dropdown-toggle:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
}

.business-dropdown .dropdown-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.business-dropdown .dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  min-width: 200px;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  color: #212529;
  text-align: left;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.business-dropdown .dropdown-menu.show {
  display: block;
}

.business-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 1rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.business-dropdown .dropdown-item:hover,
.business-dropdown .dropdown-item:focus {
  background-color: #f8f9fa;
  color: #1e2125;
  text-decoration: none;
}

.business-dropdown .dropdown-item.active {
  background-color: #007bff;
  color: white;
}

.business-dropdown .dropdown-item.active:hover {
  background-color: #0056b3;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-id-container {
  margin-left: auto;
}

.user-id {
  font-family: monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
</style>