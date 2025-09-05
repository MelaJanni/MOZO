<template>
  <!-- Mostrar setup de negocio si es requerido -->
  <BusinessSetup 
    v-if="requiresBusinessSetup" 
    @business-created="onBusinessCreated"
  />
  
  <!-- Dashboard usando estructura exacta de dashboard-mozo.html -->
  <div v-else class="min-h-screen bg-[var(--color-light)]">
    <AppHeader @toggle-menu="ui.toggleOffCanvas()">
      <template #right>
        <button class="p-2 rounded-lg hover:bg-white/20 relative" type="button" @click="ui.toggleNotifSidebar()" aria-label="Notificaciones">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
          </svg>
          <span v-if="staffNotificationCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">{{ staffNotificationCount > 99 ? '99+' : staffNotificationCount }}</span>
        </button>
      </template>
    </AppHeader>
    <div class="max-w-md mx-auto bg-white shadow-lg">
      <div class="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white">
        
        <div class="px-4 pb-4 space-y-3">
          <div class="bg-white/10 rounded-lg p-3 role-dropdown">
            <button type="button" class="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 w-full bg-transparent border-white/30 text-white">
              <div class="flex items-center gap-2">
                <span class="text-sm font-[var(--font-secondary)]">Rol Admin</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </div>
            </button>
          </div>
          
          <div v-if="availableBusinesses.length > 1" class="bg-white/10 rounded-lg p-3 business-dropdown relative">
            <button 
              @click="toggleBusinessDropdown"
              :disabled="true" 
              class="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 w-full bg-transparent border-white/30 text-white"
              type="button"
            >
            <!-- isLoadingBusinessSwitch -->
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                </svg>
                <span class="text-sm font-[var(--font-secondary)]">{{ isLoadingBusinessSwitch ? 'Cambiando...' : currentBusinessName }}</span>
                <svg v-if="isLoadingBusinessSwitch" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
              </div>
            </button>
            <!-- Dropdown listado de negocios -->
            <div v-if="showBusinessDropdown" class="absolute left-0 right-0 mt-2 bg-white text-gray-900 rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
              <ul class="max-h-60 overflow-auto">
                <li v-for="b in availableBusinesses" :key="b.id">
                  <button
                    class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                    :class="{ 'bg-blue-50 text-blue-700': b.id === adminStore.activeBusinessId }"
                    @click="switchBusiness(b)"
                    type="button"
                  >
                    <span class="truncate">{{ b.name }}</span>
                    <svg v-if="b.id === adminStore.activeBusinessId" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 space-y-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-primary)]">{{ currentBusinessName || 'Café Central' }}</h2>
              <p class="text-sm text-[var(--subtext-primary)] font-[var(--font-secondary)]">Negocio activo: #{{ adminStore.activeBusinessId }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between text-center">
            <div class="flex-1">
              <div class="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">{{ adminStore.tablesCount }}</div>
              <div class="text-sm text-[var(--subtext-primary)] font-[var(--font-secondary)]">Mesas</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">{{ adminStore.menusCount }}</div>
              <div class="text-sm text-[var(--subtext-primary)] font-[var(--font-secondary)]">Menús</div>
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">{{ adminStore.qrCodesCount }}</div>
              <div class="text-sm text-[var(--subtext-primary)] font-[var(--font-secondary)]">QRs</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="mb-3">
            <h3 class="text-sm font-medium text-[var(--text-primary)] font-[var(--font-primary)] mb-1">Código de invitación:</h3>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-[var(--color-primary)] font-[var(--font-primary)]">{{ businessCode }}</span>
              <!-- <a v-if="adminStore.invitationUrl" :href="adminStore.invitationUrl" target="_blank" class="text-blue-600 hover:text-blue-800 underline text-sm font-[var(--font-secondary)]">Enlace</a> -->
            </div>
          </div>
          <div class="flex gap-2">
            <button class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-white hover:bg-gray-50 h-8 rounded-md gap-1.5 px-3 flex-1 text-blue-600 border-blue-200 font-[var(--font-secondary)]" type="button" @click="regenerateInvitation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
              Regenerar
            </button>
            <button class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-white hover:bg-gray-50 h-8 rounded-md gap-1.5 px-3 flex-1 text-gray-700 border-gray-200 font-[var(--font-secondary)]" @click="copyBusinessCode" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              Copiar
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <router-link to="/admin/qr" class="bg-gray-100 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] hover:bg-gray-200 transition-colors duration-200 group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">
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
            <span class="text-sm font-medium text-gray-700 text-center leading-tight font-[var(--font-primary)]">QR</span>
          </router-link>
          
          <router-link to="/admin/stats" class="bg-gray-100 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] hover:bg-gray-200 transition-colors duration-200 group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">
              <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700 text-center leading-tight font-[var(--font-primary)]">ESTADÍSTICAS</span>
          </router-link>
          
          <router-link to="/admin/staff" class="bg-gray-100 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] hover:bg-gray-200 transition-colors duration-200 group relative">
            <div v-if="staffNotificationCount > 0" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold font-[var(--font-primary)]">
              {{ staffNotificationCount > 99 ? '99+' : staffNotificationCount }}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700 text-center leading-tight font-[var(--font-primary)]">PERSONAL</span>
          </router-link>
          
          <router-link to="/admin/settings" class="bg-gray-100 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] hover:bg-gray-200 transition-colors duration-200 group relative">
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold font-[var(--font-primary)]">2</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span class="text-sm font-medium text-gray-700 text-center leading-tight font-[var(--font-primary)]">CONFIGURACIÓN</span>
          </router-link>
        </div>
        
        <div class="text-center pt-6">
          <div class="bg-gray-800 text-white px-4 py-2 rounded-lg inline-block">
            <div class="flex items-center gap-2">
              <span class="text-blue-400 font-semibold font-[var(--font-primary)]">MozoApp</span>
              <span class="text-gray-300 font-[var(--font-secondary)]">{{ 'v' + appVersion }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  <!-- Offcanvas global montado en App.vue -->
  
  <NotificationsSidebar v-model="ui.isNotifSidebarOpen" />
    
    <!-- Toast de notificaciones -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11" v-if="showToast">
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
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
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import authService from '@/services/auth'
import { useAdminStore } from '@/stores/admin'
import { useNotificationsStore } from '@/stores/notifications'
import BusinessSetup from '@/components/Admin/BusinessSetup.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import AppHeader from '@/components/layout/AppHeader.vue'
import NotificationsSidebar from '@/components/layout/NotificationsSidebar.vue'
// Importar versión del paquete para mostrar en el footer
export default {
  name: 'AdminDashboardView',
  components: {
  BusinessSetup,
  AppHeader,
  NotificationsSidebar
  },
  setup() {
    const router = useRouter()
    const adminStore = useAdminStore()
    const notificationsStore = useNotificationsStore()
    const authStore = useAuthStore()
  const ui = useUiStore()
    
  const businessCode = ref('')
    const selectedRole = ref('admin')
  const showToast = ref(false)
  const showDebug = ref(false)
    const toastMessage = ref('')
    const isSendingNotification = ref(false)
    const isDataLoaded = ref(false)
    const showBusinessDropdown = ref(false)
    const isLoadingBusinessSwitch = ref(false)
  const showRoleDropdown = ref(false)
  const appVersion = ref(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0')
  let onDocumentClick
    
    const handleLogout = async () => {
      try {
        await authStore.logout()
      } catch (e) {
        // noop; continuamos con navegación aunque falle backend
      } finally {
  ui.closeOffCanvas()
        router.replace({ name: 'login' })
      }
    }
    
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
    const copyBusinessId = () => {
      if (adminStore.businessId) {
        navigator.clipboard.writeText(adminStore.businessId)
          .then(() => {
            showToast.value = true
            toastMessage.value = 'ID de negocio copiado al portapapeles'
            setTimeout(() => (showToast.value = false), 3000)
          })
          .catch(() => {
            showToast.value = true
            toastMessage.value = 'No se pudo copiar el ID de negocio'
            setTimeout(() => (showToast.value = false), 3000)
          })
      }
    }
    const regenerateInvitation = async () => {
      try {
        await adminStore.regenerateInvitation()
        await adminStore.fetchBusinessData()
        businessCode.value = adminStore.invitationCode || ''
        showToast.value = true
        toastMessage.value = 'Código de invitación regenerado'
        setTimeout(() => (showToast.value = false), 3000)
      } catch (e) {
        console.error('No se pudo regenerar el código:', e)
        showToast.value = true
        toastMessage.value = 'Error al regenerar el código'
        setTimeout(() => (showToast.value = false), 3000)
      }
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
  const isActive = (path) => router.currentRoute.value.path.startsWith(path)
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
      onDocumentClick = (event) => {
        const businessDropdown = document.querySelector('.business-dropdown')
        const roleDropdown = document.querySelector('.role-dropdown')
        if (businessDropdown && !businessDropdown.contains(event.target)) {
          showBusinessDropdown.value = false
        }
        if (roleDropdown && !roleDropdown.contains(event.target)) {
          showRoleDropdown.value = false
        }
      }
      document.addEventListener('click', onDocumentClick)
  // Cerrar con Escape
  const onKeydown = (e) => { if (e.key === 'Escape') ui.closeOffCanvas() }
  window.addEventListener('keydown', onKeydown)
  // Guardar para limpiar
  onDocumentClick._offcanvasKey = onKeydown
    })

    onUnmounted(() => {
      // Desconectar listeners al salir del componente
      notificationsStore.disconnectRealTimeNotifications()
      if (onDocumentClick) {
        document.removeEventListener('click', onDocumentClick)
      }
      if (onDocumentClick?._offcanvasKey) {
        window.removeEventListener('keydown', onDocumentClick._offcanvasKey)
      }
  // Asegurar scroll reactivado por si quedó activo
  document.body.style.overflow = ''
    })

    // Refrescar automáticamente cuando cambie el negocio activo
    watch(() => adminStore.activeBusinessId, async (newVal, oldVal) => {
      if (!newVal || newVal === oldVal) return
      try {
        await adminStore.fetchBusinessData(true)
        businessCode.value = adminStore.invitationCode || ''
        await loadBusinessData()
      } catch (e) {
        console.warn('No se pudo refrescar datos tras cambio de negocio:', e)
      }
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
  showDebug,
  appVersion,
  isActive,
  copyBusinessCode,
  copyBusinessId,
  regenerateInvitation,
  ui,
      toggleBusinessDropdown,
      toggleRoleDropdown,
      sendTestNotification,
      sendTestNotificationToSpecificWaiter,
      handleRoleChange,
      switchBusiness,
      onBusinessCreated,
      handleLogout
    }
  }
}
</script>
<style lang="scss">
// Import Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

// Variables CSS específicas para el admin dashboard
:root {
  --color-primary: #3b82f6;
  --color-accent: #8b5cf6; 
  --color-light: #f8fafc;
  --text-primary: #1f2937;
  --subtext-primary: #6b7280;
  --font-primary: 'Poppins', sans-serif;
  --font-secondary: 'Inter', sans-serif;
  --border: #e5e7eb;
}

.admin-dashboard {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.dashboard-container {
  max-width: 28rem;
  margin: 0 auto;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dashboard-header {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-button {
  background: transparent;
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  margin: 0;
  color: white;
}

.notification-button {
  background: transparent;
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.notification-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  height: 1.25rem;
  width: 1.25rem;
  background-color: #ef4444;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 500;
}

.header-content {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-selector {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.role-dropdown {
  position: relative;
}

.role-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.role-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.role-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  margin-top: 0.25rem;
  overflow: hidden;
  display: none;
  
  &.show {
    display: block;
  }
  
  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: #1f2937;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f9fafb;
    }
  }
}

.business-selector {
  .business-dropdown {
    position: relative;
  }
  
  .business-toggle {
    display: inline-flex;
    align-items: center;
    max-width: 200px;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: 0.875rem;
    gap: 0.5rem;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .loading-icon {
      animation: spin 1s linear infinite;
    }
  }
  
  .business-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    min-width: 200px;
    padding: 0.5rem 0;
    margin: 0.25rem 0 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    display: none;
    
    &.show {
      display: block;
    }
    
    .business-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: none;
      color: #1f2937;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover,
      &:focus {
        background: #f9fafb;
        color: #1e2125;
      }
      
      &.active {
        background: #3b82f6;
        color: white;
        
        &:hover {
          background: #2563eb;
        }
      }
      
      .check-icon {
        color: #10b981;
      }
    }
  }
}

.business-id-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  
  .id-label {
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
  }
  
  .id-value {
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
  }
  
  .copy-button {
    margin-left: auto;
    background: transparent;
    border: none;
    color: white;
    padding: 0.25rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.dashboard-content {
  padding: 1rem;
  
  .business-stats {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    .stats-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      
      .business-info {
        h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          font-family: 'Poppins', sans-serif;
          margin: 0 0 0.25rem 0;
        }
        
        p {
          font-size: 0.875rem;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
          margin: 0;
        }
      }
    }
    
    .stats-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      
      .stat-item {
        flex: 1;
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          font-family: 'Poppins', sans-serif;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-family: 'Inter', sans-serif;
        }
      }
    }
  }
  
  .invitation-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    .invitation-header {
      margin-bottom: 0.75rem;
      
      h3 {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1f2937;
        font-family: 'Poppins', sans-serif;
        margin: 0 0 0.25rem 0;
      }
      
      .code-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .code-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #3b82f6;
          font-family: 'Poppins', sans-serif;
        }
        
        .link-button {
          color: #2563eb;
          background: none;
          border: none;
          text-decoration: underline;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          
          &:hover {
            color: #1e40af;
          }
        }
      }
    }
    
    .invitation-actions {
      display: flex;
      gap: 0.5rem;
      
      .action-button {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        cursor: pointer;
        gap: 0.5rem;
        height: 2rem;
        
        &.regenerate {
          color: #2563eb;
          background: transparent;
          border: 1px solid #dbeafe;
          
          &:hover {
            background: #eff6ff;
          }
        }
        
        &.copy {
          color: #1f2937;
          background: transparent;
          border: 1px solid #e5e7eb;
          
          &:hover {
            background: #f9fafb;
          }
        }
      }
    }
  }
  
  .test-notification-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
      gap: 0.5rem;
      
      svg {
        color: #3b82f6;
        width: 1.25rem;
        height: 1.25rem;
      }
      
      h5 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        font-family: 'Poppins', sans-serif;
        margin: 0;
      }
    }
    
    .section-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      
      .test-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 0.5rem;
        
        &:hover:not(:disabled) {
          background: #2563eb;
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        &.secondary {
          background: transparent;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          
          &:hover:not(:disabled) {
            background: #f9fafb;
          }
        }
      }
    }
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
    
    .feature-card {
      position: relative;
      background: #f3f4f6;
      border-radius: 1rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 7.5rem;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
        
        svg {
          color: #374151;
        }
      }
      
      .notification-badge {
        position: absolute;
        top: -0.5rem;
        right: -0.5rem;
        width: 1.5rem;
        height: 1.5rem;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: 'Poppins', sans-serif;
        
        &.pulse-notification {
          animation: pulseNotification 2s infinite;
        }
      }
      
      svg {
        width: 2rem;
        height: 2rem;
        color: #4b5563;
        margin-bottom: 0.5rem;
        transition: color 0.2s ease;
      }
      
      .feature-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        font-family: 'Poppins', sans-serif;
        text-align: center;
        line-height: 1.2;
      }
    }
  }
  
  .app-footer {
    text-align: center;
    padding-top: 2rem;
    
    .version-info {
      background: #1f2937;
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      display: inline-block;
      
      .version-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .app-name {
          color: #60a5fa;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }
        
        .version-number {
          color: #d1d5db;
          font-family: 'Inter', sans-serif;
        }
      }
    }
  }
}

.toast-notification {
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 1rem;
  z-index: 1100;
  
  .toast-content {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 250px;
    
    .toast-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #e5e7eb;
      
      .toast-title {
        font-weight: 600;
        margin: 0;
      }
      
      .toast-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        color: #4b5563;
        
        &:hover {
          color: #1f2937;
        }
      }
    }
    
    .toast-body {
      padding: 0.75rem;
    }
  }
}

// Animaciones
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulseNotification {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Fallbacks para utilidades usadas en data-[state] del offcanvas */
[data-slot='sheet-content'][data-state='open'].slide-in-from-left,
[data-slot='sheet-content'][data-state='open'].data-\[state\=open\]\:slide-in-from-left { transform: translateX(0); }
[data-slot='sheet-content'][data-state='closed'].slide-out-to-left,
[data-slot='sheet-content'][data-state='closed'].data-\[state\=closed\]\:slide-out-to-left { transform: translateX(-100%); }
[data-slot='sheet-content'] { will-change: transform; }
[data-slot='sheet-overlay'][data-state='open'].fade-in-0,
[data-slot='sheet-overlay'][data-state='open'].data-\[state\=open\]\:fade-in-0 { opacity: 1; }
[data-slot='sheet-overlay'][data-state='closed'].fade-out-0,
[data-slot='sheet-overlay'][data-state='closed'].data-\[state\=closed\]\:fade-out-0 { opacity: 0; }

/* Transiciones Vue para overlay y panel */
.sheet-fade-enter-active, .sheet-fade-leave-active { transition: opacity 200ms ease; }
.sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; }

.sheet-slide-enter-active, .sheet-slide-leave-active { transition: transform 320ms cubic-bezier(.22,.61,.36,1); }
.sheet-slide-enter-from, .sheet-slide-leave-to { transform: translateX(-100%); }
</style>