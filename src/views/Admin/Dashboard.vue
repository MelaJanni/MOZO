<template>
  <div class="admin-dashboard">
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
    <div v-else class="dashboard-container">
      <!-- Header con gradiente -->
      <div class="dashboard-header">
        <div class="header-top">
          <div class="header-left">
            <button class="menu-button" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>
            <h1 class="app-title">MOZÓ</h1>
          </div>
          <div class="notifications-container">
            <button class="notification-button" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
              </svg>
              <span v-if="staffNotificationCount > 0" class="notification-badge">{{ staffNotificationCount > 99 ? '99+' : staffNotificationCount }}</span>
            </button>
          </div>
        </div>
        
        <div class="header-content">
          <!-- Role selector -->
          <div class="role-selector">
            <div class="role-dropdown">
              <button class="role-button" type="button" @click="toggleRoleDropdown">
                <div class="role-text">
                  <span>Rol Admin</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              <div class="role-dropdown-menu" :class="{ show: showRoleDropdown }">
                <button class="dropdown-item" @click="selectedRole = 'admin'; showRoleDropdown = false">Admin</button>
                <button class="dropdown-item" @click="handleRoleChange">Mozo</button>
              </div>
            </div>
          </div>
          
          <!-- Business Selector - Only show if multiple businesses available -->
          <div v-if="availableBusinesses.length > 1" class="business-selector">
            <div class="business-dropdown">
              <button 
                class="business-toggle" 
                @click="toggleBusinessDropdown"
                :disabled="isLoadingBusinessSwitch"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                </svg>
                {{ isLoadingBusinessSwitch ? 'Cambiando...' : currentBusinessName }}
                <svg v-if="isLoadingBusinessSwitch" class="loading-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
              </button>
              <div class="business-menu" :class="{ show: showBusinessDropdown }">
                <button 
                  v-for="business in availableBusinesses" 
                  :key="business.id"
                  class="business-item"
                  :class="{ active: business.id === adminStore.activeBusinessId }"
                  @click="switchBusiness(business)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                  </svg>
                  {{ business.name }}
                  <svg v-if="business.id === adminStore.activeBusinessId" class="check-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Business ID -->
          <div class="business-id-section">
            <span class="id-label">ID:</span>
            <span class="id-value">{{ businessCode }}</span>
            <button class="copy-button" @click="copyBusinessCode" title="Copiar al portapapeles" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Contenido del dashboard -->
      <div class="dashboard-content">
        <!-- Estadísticas del negocio -->
        <div class="business-stats">
          <div class="stats-header">
            <div class="business-info">
              <h2>{{ currentBusinessName || 'Café Central' }}</h2>
              <p>Negocio activo: 1</p>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">1</div>
              <div class="stat-label">Mesas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">0</div>
              <div class="stat-label">Menús</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">1</div>
              <div class="stat-label">QRs</div>
            </div>
          </div>
        </div>
        
        <!-- Código de invitación -->
        <div class="invitation-section">
          <div class="invitation-header">
            <h3>Código de invitación:</h3>
            <div class="code-display">
              <span class="code-value">{{ businessCode }}</span>
              <button class="link-button" type="button">Enlace</button>
            </div>
          </div>
          <div class="invitation-actions">
            <button class="action-button regenerate" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
              Regenerar
            </button>
            <button class="action-button copy" @click="copyBusinessCode" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              Copiar ID
            </button>
          </div>
        </div>
        
        <!-- Sección de prueba de notificaciones -->
        <div class="test-notification-section">
          <div class="section-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
            </svg>
            <h5>Prueba de Notificaciones</h5>
          </div>
          <p class="section-description">
            Envía una notificación de prueba a todos los mozos activos para verificar el sistema.
          </p>
          <div class="action-buttons">
            <button 
              class="test-button" 
              @click="sendTestNotification"
              :disabled="isSendingNotification"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
              {{ isSendingNotification ? 'Enviando...' : 'Enviar Notificación de Prueba' }}
            </button>
            <button 
              class="test-button secondary" 
              @click="sendTestNotificationToSpecificWaiter"
              :disabled="isSendingNotification"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" x2="19" y1="8" y2="14"/>
                <line x1="22" x2="16" y1="11" y2="11"/>
              </svg>
              Enviar a Mozo Específico
            </button>
          </div>
        </div>
        
        <!-- Grid de funciones principales -->
        <div class="features-grid">
          <router-link to="/admin/qr" class="feature-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1"></rect>
              <rect width="5" height="5" x="16" y="3" rx="1"></rect>
              <rect width="5" height="5" x="3" y="16" rx="1"></rect>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
              <path d="M21 21v.01"></path>
              <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
              <path d="M3 12h.01"></path>
              <path d="M12 3h.01"></path>
              <path d="M12 16v.01"></path>
              <path d="M16 12h1"></path>
              <path d="M21 12v.01"></path>
              <path d="M12 21v-1"></path>
            </svg>
            <span class="feature-label">QR</span>
          </router-link>
          
          <router-link to="/admin/stats" class="feature-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
            <span class="feature-label">ESTADÍSTICAS</span>
          </router-link>
          
          <router-link to="/admin/staff" class="feature-card">
            <div v-if="staffNotificationCount > 0" class="notification-badge pulse-notification">
              {{ staffNotificationCount > 99 ? '99+' : staffNotificationCount }}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span class="feature-label">PERSONAL</span>
          </router-link>
          
          <router-link to="/admin/settings" class="feature-card">
            <div class="notification-badge">2</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span class="feature-label">CONFIGURACIÓN</span>
          </router-link>
        </div>
        
        <!-- Footer con versión -->
        <div class="app-footer">
          <div class="version-info">
            <div class="version-content">
              <span class="app-name">MozoApp</span>
              <span class="version-number">v0.0.137</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast de notificaciones -->
    <div class="toast-notification" v-if="showToast">
      <div class="toast-content">
        <div class="toast-header">
          <strong class="toast-title">Notificación</strong>
          <button type="button" class="toast-close" @click="showToast = false">&times;</button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
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
    const showRoleDropdown = ref(false)
    
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
    
    // Staff notifications count (only staff request type)
    const staffNotificationCount = computed(() => {
      return notificationsStore.unreadNotifications.filter(n => 
        n.type === 'staff_request'
      ).length
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
    
    const toggleRoleDropdown = () => {
      showRoleDropdown.value = !showRoleDropdown.value
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
        console.log('🚨🚨🚨 ADMIN DASHBOARD: About to call initializeRealTimeNotifications - NEW CODE! 🚨🚨🚨')
        await notificationsStore.initializeRealTimeNotifications()
        console.log('✅ Notificaciones en tiempo real iniciadas en Admin Dashboard')
        
        // Debug admin business data for real-time notifications
        const businessId = adminStore.businessData?.id
        console.log('🔍 Admin Dashboard: Business data:', adminStore.businessData)
        console.log('🔍 Admin Dashboard: Business ID:', businessId)
        console.log('🔍 Admin Dashboard: Notifications store connected:', notificationsStore.isConnected)
        
        // The real-time notifications are already initialized above via notificationsStore.initializeRealTimeNotifications()
        // This handles admin notifications through the existing staff realtime system
        
        // TESTING: Add a global function to test Firebase writes
        window.testFirebaseWrite = async () => {
          try {
            const { initializeFirebaseApp } = await import('@/services/firebase')
            const { getDatabase, ref, set } = await import('firebase/database')
            
            const firebaseInstance = await initializeFirebaseApp()
            if (firebaseInstance) {
              const db = getDatabase(firebaseInstance.app)
              const testPath = `businesses_staff/${businessId}/test_${Date.now()}`
              
              console.log('🧪 TESTING: Writing to path:', testPath)
              await set(ref(db, testPath), {
                status: 'pending',
                name: 'Test User',
                created_at: new Date().toISOString(),
                test: true
              })
              console.log('🧪 TESTING: Test data written to Firebase!')
            }
          } catch (error) {
            console.error('🧪 TESTING: Error writing test data:', error)
          }
        }
        
        console.log('🧪 TESTING: Use window.testFirebaseWrite() to test the Firebase listener')
      } catch (error) {
        console.error('❌ Error iniciando notificaciones en tiempo real:', error)
      }
      
      // Cerrar dropdowns al hacer clic fuera
      document.addEventListener('click', (event) => {
        const businessDropdown = document.querySelector('.business-dropdown')
        const roleDropdown = document.querySelector('.role-dropdown')
        
        if (businessDropdown && !businessDropdown.contains(event.target)) {
          showBusinessDropdown.value = false
        }
        
        if (roleDropdown && !roleDropdown.contains(event.target)) {
          showRoleDropdown.value = false
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
      staffNotificationCount,
      showBusinessDropdown,
      isLoadingBusinessSwitch,
      showRoleDropdown,
      copyBusinessCode,
      toggleBusinessDropdown,
      toggleRoleDropdown,
      sendTestNotification,
      sendTestNotificationToSpecificWaiter,
      handleRoleChange,
      switchBusiness,
      onBusinessCreated
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@/assets/styles/components/admin-dashboard.scss';
</style>