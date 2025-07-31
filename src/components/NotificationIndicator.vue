<template>
  <div class="notification-indicator">
    <button 
      @click="toggleDropdown"
      class="notification-btn"
      :class="{ 'has-notifications': hasUnreadNotifications }"
      ref="notificationBtn"
    >
      <i class="fas fa-bell"></i>
      <span 
        v-if="totalUnreadCount > 0" 
        class="notification-badge"
      >
        {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
      </span>
    </button>
    <div 
      v-if="showDropdown"
      class="notification-dropdown"
      ref="dropdown"
    >
      <div class="dropdown-header">
        <h3>Notificaciones</h3>
        <div class="header-actions">
          <button 
            v-if="totalUnreadCount > 0"
            @click="markAllAsRead"
            class="header-action-btn"
            title="Marcar todas como leídas"
          >
            <i class="fas fa-check-double"></i>
          </button>
          <button 
            @click="closeDropdown"
            class="header-action-btn"
            title="Cerrar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="notifications-preview">
        <div v-if="loading" class="loading-preview">
          <div class="loading-spinner"></div>
          <span>Cargando...</span>
        </div>
        <div v-else-if="recentNotifications.length > 0" class="notifications-list">
          <div 
            v-for="notification in recentNotifications.slice(0, 5)"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read_at }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <i :class="getNotificationIcon(notification.type)"></i>
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ getNotificationTitle(notification.type) }}
              </div>
              <div class="notification-message">
                {{ notification.message || notification.data?.message }}
              </div>
              <div class="notification-time">
                {{ formatTime(notification.created_at) }}
              </div>
            </div>
            <div v-if="!notification.read_at" class="unread-dot"></div>
          </div>
        </div>
        <div v-else class="empty-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No hay notificaciones</p>
        </div>
      </div>
      <div class="dropdown-footer">
        <router-link 
          :to="getNotificationsRoute()"
          @click="closeDropdown"
          class="view-all-btn"
        >
          Ver todas las notificaciones
        </router-link>
      </div>
    </div>
    <div 
      v-if="showDropdown"
      class="dropdown-overlay"
      @click="closeDropdown"
    ></div>
  </div>
</template>
<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
export default {
  name: 'NotificationIndicator',
  setup() {
    const router = useRouter()
    const notificationsStore = useNotificationsStore()
    const authStore = useAuthStore()
    const showDropdown = ref(false)
    const loading = ref(false)
    const notificationBtn = ref(null)
    const dropdown = ref(null)
    const hasUnreadNotifications = computed(() => {
      return notificationsStore.hasUnreadNotifications
    })
    const totalUnreadCount = computed(() => {
      return notificationsStore.totalUnreadCount
    })
    const recentNotifications = computed(() => {
      return notificationsStore.allUnreadNotifications.slice(0, 5)
    })
    const userRole = computed(() => {
      return authStore.user?.role || 'user'
    })
    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value
      if (showDropdown.value) {
        loadNotifications()
      }
    }
    const closeDropdown = () => {
      showDropdown.value = false
    }
    const loadNotifications = async () => {
      if (loading.value) return
      try {
        loading.value = true
        await notificationsStore.loadNotificationsByRole(userRole.value)
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      } finally {
        loading.value = false
      }
    }
    const markAllAsRead = async () => {
      try {
        await notificationsStore.markAllAsRead()
      } catch (error) {
        console.error('Error marcando todas como leídas:', error)
      }
    }
    const handleNotificationClick = (notification) => {
      if (!notification.read_at) {
        if (userRole.value === 'waiter') {
          notificationsStore.handleWaiterNotification(notification.id, 'mark_as_read')
        } else {
          notificationsStore.handleNotification(notification.id, 'mark_as_read')
        }
      }
      if (notification.type === 'table_call') {
        router.push('/waiter/dashboard')
      } else if (notification.type === 'staff_request') {
        router.push('/admin/staff')
      }
      closeDropdown()
    }
    const getNotificationIcon = (type) => {
      const icons = {
        table_call: 'fas fa-bell',
        order_ready: 'fas fa-utensils',
        payment_received: 'fas fa-credit-card',
        staff_request: 'fas fa-user-plus',
        system: 'fas fa-info-circle',
        default: 'fas fa-bell'
      }
      return icons[type] || icons.default
    }
    const getNotificationTitle = (type) => {
      const titles = {
        table_call: 'Llamada de Mesa',
        order_ready: 'Pedido Listo',
        payment_received: 'Pago Recibido',
        staff_request: 'Solicitud de Personal',
        system: 'Notificación del Sistema',
        default: 'Notificación'
      }
      return titles[type] || titles.default
    }
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      if (diffInMinutes < 1) {
        return 'Ahora mismo'
      } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} min`
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
      } else {
        const days = Math.floor(diffInMinutes / 1440)
        return `Hace ${days} día${days > 1 ? 's' : ''}`
      }
    }
    const getNotificationsRoute = () => {
      switch (userRole.value) {
        case 'waiter':
          return '/waiter/notifications'
        case 'admin':
          return '/admin/notifications'
        default:
          return '/notifications'
      }
    }
    const handleClickOutside = (event) => {
      if (showDropdown.value && 
          notificationBtn.value && 
          dropdown.value &&
          !notificationBtn.value.contains(event.target) &&
          !dropdown.value.contains(event.target)) {
        closeDropdown()
      }
    }
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      loadNotifications()
    })
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    watch(showDropdown, (newValue) => {
      if (newValue) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    })
    return {
      showDropdown,
      loading,
      notificationBtn,
      dropdown,
      hasUnreadNotifications,
      totalUnreadCount,
      recentNotifications,
      userRole,
      toggleDropdown,
      closeDropdown,
      loadNotifications,
      markAllAsRead,
      handleNotificationClick,
      getNotificationIcon,
      getNotificationTitle,
      formatTime,
      getNotificationsRoute
    }
  }
}
</script>
<style scoped>
.notification-indicator {
  position: relative;
}
.notification-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
}
.notification-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #495057;
}
.notification-btn.has-notifications {
  color: #339af0;
}
.notification-btn i {
  font-size: 18px;
}
.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}
.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.header-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
}
.header-action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #495057;
}
.notifications-preview {
  max-height: 300px;
  overflow-y: auto;
}
.loading-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #6c757d;
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #339af0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.notifications-list {
  padding: 8px 0;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.notification-item:hover {
  background: #f8f9fa;
}
.notification-item.unread {
  background: #f0f8ff;
}
.notification-item.unread:hover {
  background: #e3f2fd;
}
.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #6c757d;
}
.notification-content {
  flex: 1;
  min-width: 0;
}
.notification-title {
  font-weight: 600;
  font-size: 13px;
  color: #212529;
  margin-bottom: 2px;
}
.notification-message {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notification-time {
  font-size: 11px;
  color: #868e96;
}
.unread-dot {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #339af0;
  border-radius: 50%;
}
.empty-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}
.empty-notifications i {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}
.empty-notifications p {
  margin: 0;
  font-size: 14px;
}
.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}
.view-all-btn {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: #339af0;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.view-all-btn:hover {
  background: #2980b9;
  color: white;
}
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}
@media (max-width: 768px) {
  .notification-dropdown {
    position: fixed;
    top: 60px;
    left: 16px;
    right: 16px;
    width: auto;
    max-height: calc(100vh - 120px);
  }
  .notifications-preview {
    max-height: 60vh;
  }
}
.notifications-preview::-webkit-scrollbar {
  width: 6px;
}
.notifications-preview::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.notifications-preview::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.notifications-preview::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 