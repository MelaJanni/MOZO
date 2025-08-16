<template>
  <div class="notification-bell-container">
    <button 
      @click="toggleDropdown" 
      class="notification-bell"
      :class="{ 'has-notifications': hasUnreadNotifications }"
    >
      <i class="bi bi-bell"></i>
      <span v-if="unreadCount > 0" class="notification-badge">{{ displayCount }}</span>
    </button>

    <!-- Dropdown de notificaciones -->
    <div v-if="isOpen" class="notification-dropdown" @click.stop>
      <div class="dropdown-header">
        <h4>Notificaciones</h4>
        <span class="notification-count">{{ unreadCount }} nuevas</span>
      </div>
      
      <div class="notification-list" v-if="allNotifications.length > 0">
        <div 
          v-for="notification in allNotifications.slice(0, 5)" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read_at }"
          @click="markAsRead(notification)"
        >
          <div class="notification-content">
            <div class="notification-title">
              {{ notification.data?.title || notification.title || 'Notificación' }}
            </div>
            <div class="notification-message">
              {{ notification.data?.message || notification.body || 'Nueva notificación recibida' }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.created_at) }}
            </div>
          </div>
          <div v-if="!notification.read_at" class="unread-dot"></div>
        </div>
      </div>
      
      <div v-else class="empty-notifications">
        <i class="bi bi-bell-slash"></i>
        <p>No hay notificaciones</p>
      </div>
      
      <div class="dropdown-footer" v-if="allNotifications.length > 0">
        <button @click="markAllAsRead" class="action-btn">Marcar todas como leídas</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()
const isOpen = ref(false)

// Computed properties
const unreadCount = computed(() => notificationsStore.totalUnreadCount)
const hasUnreadNotifications = computed(() => notificationsStore.hasUnreadNotifications)
const allNotifications = computed(() => notificationsStore.allUnreadNotifications.concat(notificationsStore.allReadNotifications))

const displayCount = computed(() => {
  return unreadCount.value > 99 ? '99+' : unreadCount.value
})

// Methods
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function markAsRead(notification) {
  if (!notification.read_at) {
    notificationsStore.handleNotification(notification.id, 'read')
  }
}

function markAllAsRead() {
  notificationsStore.allUnreadNotifications.forEach(notification => {
    notificationsStore.handleNotification(notification.id, 'read')
  })
  closeDropdown()
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (hours > 24) {
    return date.toLocaleDateString()
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'ahora'
  }
}

// Click outside to close
function handleClickOutside(event) {
  if (!event.target.closest('.notification-bell-container')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-bell-container {
  position: relative;
  display: inline-block;
}

.notification-bell {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
}

.notification-bell:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-bell.has-notifications {
  animation: bellShake 0.5s ease-in-out;
}

@keyframes bellShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ff4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.notification-count {
  font-size: 12px;
  color: #666;
  background: #e7f3ff;
  padding: 4px 8px;
  border-radius: 12px;
}

.notification-list {
  max-height: 280px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f8ff;
  border-left: 3px solid #007bff;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.3;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 11px;
  color: #999;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.empty-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-notifications i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-notifications p {
  margin: 0;
  font-size: 14px;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
}

.action-btn {
  width: 100%;
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #0056b3;
}
</style>