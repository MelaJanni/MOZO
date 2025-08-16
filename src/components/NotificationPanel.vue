<template>
  <div class="notification-panel" :class="{ 'panel-open': isOpen }">
    <!-- Botón para abrir/cerrar el panel -->
    <button 
      @click="togglePanel" 
      class="notification-toggle"
      :class="{ 
        'has-unread': unreadCount > 0,
        'debug-mode': props.forceVisible
      }"
    >
      <i class="fas fa-bell"></i>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      <span v-if="props.forceVisible && unreadCount === 0" class="debug-badge">DEBUG</span>
    </button>

    <!-- Panel deslizante -->
    <div v-if="isOpen" class="notification-overlay" @click="closePanel"></div>
    <div class="notification-sidebar" :class="{ 'sidebar-open': isOpen }">
      <div class="notification-header">
        <h3>
          <i class="fas fa-bell"></i>
          Notificaciones
        </h3>
        <div class="header-actions">
          <button @click="markAllAsRead" class="action-btn" :disabled="loading">
            <i class="fas fa-check-double"></i>
          </button>
          <button @click="refreshNotifications" class="action-btn" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
          <button @click="closePanel" class="action-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="notification-filters">
        <button 
          @click="setFilter('all')" 
          class="filter-btn" 
          :class="{ active: filter === 'all' }"
        >
          Todas ({{ notifications.length }})
        </button>
        <button 
          @click="setFilter('unread')" 
          class="filter-btn" 
          :class="{ active: filter === 'unread' }"
        >
          Sin leer ({{ unreadCount }})
        </button>
      </div>

      <div class="notification-list" ref="notificationList">
        <div v-if="loading && notifications.length === 0" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>

        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>{{ filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones' }}</p>
        </div>

        <div 
          v-else
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{
            'unread': !notification.read_at,
            'read': notification.read_at,
            'debug-notification': notification.id.startsWith('debug-')
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.data?.title || notification.type }}</div>
            <div class="notification-message">{{ notification.data?.message || notification.data?.body || 'Nueva notificación' }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <div class="notification-actions">
            <button 
              v-if="!notification.read_at"
              @click.stop="markAsRead(notification)"
              class="action-btn small"
              title="Marcar como leída"
            >
              <i class="fas fa-check"></i>
            </button>
            <button 
              @click.stop="deleteNotification(notification)"
              class="action-btn small delete"
              title="Eliminar"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="notification-footer">
        <button @click="clearAllRead" class="footer-btn" :disabled="readCount === 0">
          <i class="fas fa-trash"></i>
          Eliminar leídas ({{ readCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import notificationsService from '@/services/notifications'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'

// Props
const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 segundos
  },
  forceVisible: {
    type: Boolean,
    default: false
  }
})

// Stores
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

// Estado local
const isOpen = ref(false)
const loading = ref(false)
const filter = ref('all')
const refreshTimer = ref(null)

// Computed - Conectar directamente al store de Pinia
const notifications = computed(() => {
  // Combinar todas las notificaciones del store
  const allNotifications = [
    ...notificationsStore.unreadNotifications,
    ...notificationsStore.readNotifications,
    ...notificationsStore.waiterUnreadNotifications,
    ...notificationsStore.waiterReadNotifications
  ]
  
  // Si estamos en modo debug y no hay notificaciones, mostrar debug
  if (props.forceVisible && allNotifications.length === 0) {
    return getDebugNotifications()
  }
  
  return allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const unreadCount = computed(() => 
  notificationsStore.totalUnreadCount || notifications.value.filter(n => !n.read_at).length
)

const readCount = computed(() => 
  notifications.value.filter(n => n.read_at).length
)

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return notifications.value.filter(n => !n.read_at)
  }
  return notifications.value
})

// Métodos
const togglePanel = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    refreshNotifications()
  }
}

const closePanel = () => {
  isOpen.value = false
}

const setFilter = (newFilter) => {
  filter.value = newFilter
}

const refreshNotifications = async () => {
  if (!authStore.isAuthenticated) return
  
  loading.value = true
  try {
    console.log('🔔 RefreshNotifications: Cargando notificaciones del store...')
    
    // Cargar notificaciones en el store según el rol del usuario
    const role = authStore.user?.role || 'user'
    
    if (role === 'waiter') {
      await notificationsStore.loadWaiterNotifications()
    } else if (role === 'admin') {
      await notificationsStore.loadAdminNotifications()
    } else {
      await notificationsStore.loadNotifications()
    }
    
    console.log('✅ RefreshNotifications: Notificaciones cargadas en store')
    console.log('📊 Unread count in store:', notificationsStore.totalUnreadCount)
    console.log('📊 Total notifications:', notifications.value.length)
    
  } catch (error) {
    console.error('❌ Error cargando notificaciones:', error)
    if (props.forceVisible) {
      showErrorToast('Error cargando notificaciones - Mostrando datos de debug')
    } else {
      showErrorToast('Error cargando notificaciones')
    }
  } finally {
    loading.value = false
  }
}

const getDebugNotifications = () => {
  return [
    {
      id: 'debug-1',
      type: 'TestNotification',
      data: {
        title: '🧪 Notificación de Debug',
        message: 'Esta es una notificación de ejemplo para el modo debug',
        type: 'TestNotification'
      },
      created_at: new Date().toISOString(),
      read_at: null
    },
    {
      id: 'debug-2', 
      type: 'UserSpecificNotification',
      data: {
        title: '👤 Notificación de Usuario',
        message: 'Ejemplo de notificación específica para usuario',
        type: 'UserSpecificNotification'
      },
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutos atrás
      read_at: new Date(Date.now() - 120000).toISOString() // Leída hace 2 minutos
    },
    {
      id: 'debug-3',
      type: 'OrderNotification',
      data: {
        title: '🍽️ Nueva Orden',
        message: 'Orden #123 lista para entregar',
        type: 'OrderNotification'
      },
      created_at: new Date(Date.now() - 600000).toISOString(), // 10 minutos atrás
      read_at: null
    },
    {
      id: 'debug-4',
      type: 'TableCallNotification',
      data: {
        title: '🙋 Llamada de Mesa',
        message: 'Mesa #5 solicita atención',
        type: 'TableCallNotification'
      },
      created_at: new Date(Date.now() - 900000).toISOString(), // 15 minutos atrás
      read_at: null
    }
  ]
}

const handleNotificationClick = async (notification) => {
  // Marcar como leída si no lo está
  if (!notification.read_at) {
    // No hacer llamadas reales para notificaciones de debug
    if (notification.id.startsWith('debug-')) {
      notification.read_at = new Date().toISOString()
      console.log('🔍 DEBUG: Notificación de debug marcada como leída:', notification.data?.title)
    } else {
      await markAsRead(notification)
    }
  }

  // Manejar navegación o acción específica
  if (notification.data?.route) {
    // Implementar navegación aquí si es necesario
    console.log('Navegando a:', notification.data.route)
  }
}

const markAsRead = async (notification) => {
  try {
    await notificationsService.handleNotification(notification.id, 'mark_as_read')
    notification.read_at = new Date().toISOString()
    showSuccessToast('Notificación marcada como leída')
  } catch (error) {
    console.error('Error marcando notificación:', error)
    showErrorToast('Error marcando notificación')
  }
}

const markAllAsRead = async () => {
  const unreadNotifications = notifications.value.filter(n => !n.read_at)
  if (unreadNotifications.length === 0) return

  loading.value = true
  try {
    await notificationsService.markAllAsRead(unreadNotifications)
    unreadNotifications.forEach(n => {
      n.read_at = new Date().toISOString()
    })
    showSuccessToast(`${unreadNotifications.length} notificaciones marcadas como leídas`)
  } catch (error) {
    console.error('Error marcando todas como leídas:', error)
    showErrorToast('Error marcando notificaciones')
  } finally {
    loading.value = false
  }
}

const deleteNotification = async (notification) => {
  try {
    // No hacer llamadas reales para notificaciones de debug
    if (notification.id.startsWith('debug-')) {
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
      console.log('🔍 DEBUG: Notificación de debug eliminada:', notification.data?.title)
      showSuccessToast('Notificación de debug eliminada')
    } else {
      await notificationsService.handleNotification(notification.id, 'delete')
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
      showSuccessToast('Notificación eliminada')
    }
  } catch (error) {
    console.error('Error eliminando notificación:', error)
    showErrorToast('Error eliminando notificación')
  }
}

const clearAllRead = async () => {
  const readNotifications = notifications.value.filter(n => n.read_at)
  if (readNotifications.length === 0) return

  loading.value = true
  try {
    await notificationsService.deleteAllRead(readNotifications)
    notifications.value = notifications.value.filter(n => !n.read_at)
    showSuccessToast(`${readNotifications.length} notificaciones eliminadas`)
  } catch (error) {
    console.error('Error eliminando notificaciones leídas:', error)
    showErrorToast('Error eliminando notificaciones')
  } finally {
    loading.value = false
  }
}

const getNotificationIcon = (notification) => {
  const type = notification.data?.type || notification.type
  const icons = {
    'TestNotification': 'fas fa-flask',
    'UserSpecificNotification': 'fas fa-user',
    'OrderNotification': 'fas fa-utensils',
    'TableCallNotification': 'fas fa-hand-paper',
    'MessageNotification': 'fas fa-envelope',
    'default': 'fas fa-bell'
  }
  return icons[type] || icons.default
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Menos de 1 minuto
  if (diff < 60000) {
    return 'Ahora'
  }
  
  // Menos de 1 hora
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m`
  }
  
  // Menos de 24 horas
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h`
  }
  
  // Más de 24 horas
  const days = Math.floor(diff / 86400000)
  return `${days}d`
}

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer.value = setInterval(refreshNotifications, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Watchers
watch(
  () => notificationsStore.totalUnreadCount,
  (newCount, oldCount) => {
    console.log('🔔 Unread count changed in store:', { newCount, oldCount })
    
    // Actualizar el badge del botón
    if (newCount > oldCount && newCount > 0) {
      console.log('🔔 New notification detected! Count:', newCount)
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  console.log('🔔 NotificationPanel mounted')
  refreshNotifications()
  startAutoRefresh()
  
  // Log current store state
  console.log('🔔 Initial store state:', {
    unreadCount: notificationsStore.totalUnreadCount,
    isConnected: notificationsStore.isConnected,
    unreadNotifications: notificationsStore.unreadNotifications.length,
    waiterUnreadNotifications: notificationsStore.waiterUnreadNotifications.length
  })
  
  // Escuchar eventos de debug para actualizar automáticamente
  const handleDebugNotificationChange = (event) => {
    console.log('🔔 Debug notification change detected:', event.detail)
    if (props.forceVisible) {
      // Solo refrescar si estamos en modo debug
      refreshNotifications()
    }
  }
  
  const handleDebugNotificationSent = (event) => {
    console.log('🔔 Debug notification sent:', event.detail)
    if (props.forceVisible) {
      // Refrescar inmediatamente cuando se envía una notificación
      setTimeout(() => refreshNotifications(), 1000) // Pequeño delay para que llegue al backend
    }
  }
  
  window.addEventListener('debug-notification-change', handleDebugNotificationChange)
  window.addEventListener('debug-notification-sent', handleDebugNotificationSent)
  
  // Cleanup en unmount
  const cleanup = () => {
    window.removeEventListener('debug-notification-change', handleDebugNotificationChange)
    window.removeEventListener('debug-notification-sent', handleDebugNotificationSent)
  }
  
  // Guardar cleanup para usar en onUnmounted
  window._notificationPanelCleanup = cleanup
})

onUnmounted(() => {
  stopAutoRefresh()
  
  // Limpiar event listeners
  if (window._notificationPanelCleanup) {
    window._notificationPanelCleanup()
    delete window._notificationPanelCleanup
  }
})

// Exponer métodos para uso externo
defineExpose({
  togglePanel,
  refreshNotifications,
  markAllAsRead
})
</script>

<style scoped>
.notification-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification-toggle {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.notification-toggle:hover {
  background: #0056b3;
  transform: scale(1.05);
}

.notification-toggle.has-unread {
  animation: pulse 2s infinite;
}

.notification-toggle.debug-mode {
  background: #28a745;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.notification-toggle.debug-mode:hover {
  background: #1e7e34;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.debug-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ffc107;
  color: #212529;
  border-radius: 12px;
  min-width: 45px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.notification-sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.notification-sidebar.sidebar-open {
  right: 0;
}

.notification-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.small {
  width: 24px;
  height: 24px;
  font-size: 12px;
}

.action-btn.delete:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.notification-filters {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #f8f9fa;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.empty-state i {
  font-size: 48px;
  color: #dee2e6;
  margin-bottom: 16px;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  gap: 12px;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f8ff;
  border-left: 4px solid #007bff;
}

.notification-item.debug-notification {
  background: #f8f9fa;
  border-left: 4px solid #28a745;
  opacity: 0.9;
}

.notification-item.debug-notification.unread {
  background: #e8f5e8;
  border-left: 4px solid #28a745;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-item.unread .notification-icon {
  background: #007bff;
  color: white;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-message {
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 11px;
  color: #adb5bd;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: flex-start;
}

.notification-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.footer-btn {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.footer-btn:hover:not(:disabled) {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes pulse {
  0% { box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(0, 123, 255, 0.6); }
  100% { box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .notification-sidebar {
    width: 100vw;
    right: -100vw;
  }
  
  .notification-panel {
    top: 10px;
    right: 10px;
  }
  
  .notification-toggle {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
}
</style>