<template>
  <div class="notifications-list">
    <div class="notifications-header">
      <div class="notifications-stats">
        <div class="stat-item">
          <span class="stat-number">{{ unreadCount }}</span>
          <span class="stat-label">No leídas</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ readCount }}</span>
          <span class="stat-label">Leídas</span>
        </div>
      </div>
      <div class="notifications-actions">
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="action-btn secondary"
          :disabled="loading"
        >
          <i class="fas fa-check-double"></i>
          Marcar todas como leídas
        </button>
        <button 
          v-if="readCount > 0"
          @click="deleteAllRead"
          class="action-btn danger"
          :disabled="loading"
        >
          <i class="fas fa-trash"></i>
          Eliminar leídas
        </button>
      </div>
    </div>
    <div class="notifications-filters">
      <div class="filter-tabs">
        <button 
          @click="activeFilter = 'all'"
          :class="['filter-tab', { active: activeFilter === 'all' }]"
        >
          Todas ({{ totalCount }})
        </button>
        <button 
          @click="activeFilter = 'unread'"
          :class="['filter-tab', { active: activeFilter === 'unread' }]"
        >
          No leídas ({{ unreadCount }})
        </button>
        <button 
          @click="activeFilter = 'read'"
          :class="['filter-tab', { active: activeFilter === 'read' }]"
        >
          Leídas ({{ readCount }})
        </button>
      </div>
      <div class="filter-search">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Buscar notificaciones..."
          class="search-input"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando notificaciones...</p>
    </div>
    <div v-else-if="filteredNotifications.length > 0" class="notifications-container">
      <NotificationCard
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :notification="notification"
        :role="role"
        @action-handled="handleNotificationAction"
      />
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-bell-slash"></i>
      </div>
      <h3>{{ getEmptyStateTitle() }}</h3>
      <p>{{ getEmptyStateMessage() }}</p>
    </div>
    <div v-if="hasPagination" class="notifications-pagination">
      <button 
        @click="loadMore"
        :disabled="loading || !hasMorePages"
        class="load-more-btn"
      >
        <span v-if="loading">Cargando...</span>
        <span v-else-if="hasMorePages">Cargar más</span>
        <span v-else>No hay más notificaciones</span>
      </button>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import NotificationCard from './NotificationCard.vue'
export default {
  name: 'NotificationsList',
  components: {
    NotificationCard
  },
  props: {
    role: {
      type: String,
      default: 'user'
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 30000 // 30 segundos
    }
  },
  emits: ['notification-action'],
  setup(props, { emit }) {
    const notificationsStore = useNotificationsStore()
    const activeFilter = ref('all')
    const searchQuery = ref('')
    const refreshTimer = ref(null)
    const loading = computed(() => {
      switch (props.role) {
        case 'waiter':
          return notificationsStore.loadingWaiter
        case 'admin':
          return notificationsStore.loadingAdmin
        default:
          return notificationsStore.loading
      }
    })
    const notifications = computed(() => {
      switch (props.role) {
        case 'waiter':
          return [
            ...notificationsStore.waiterUnreadNotifications,
            ...notificationsStore.waiterReadNotifications
          ]
        case 'admin':
          return notificationsStore.adminNotifications
        default:
          return [
            ...notificationsStore.unreadNotifications,
            ...notificationsStore.readNotifications
          ]
      }
    })
    const unreadNotifications = computed(() => {
      switch (props.role) {
        case 'waiter':
          return notificationsStore.waiterUnreadNotifications
        default:
          return notificationsStore.unreadNotifications
      }
    })
    const readNotifications = computed(() => {
      switch (props.role) {
        case 'waiter':
          return notificationsStore.waiterReadNotifications
        default:
          return notificationsStore.readNotifications
      }
    })
    const unreadCount = computed(() => {
      switch (props.role) {
        case 'waiter':
          return notificationsStore.waiterUnreadCount
        default:
          return notificationsStore.unreadCount
      }
    })
    const readCount = computed(() => readNotifications.value.length)
    const totalCount = computed(() => notifications.value.length)
    const filteredNotifications = computed(() => {
      let filtered = notifications.value
      if (activeFilter.value === 'unread') {
        filtered = unreadNotifications.value
      } else if (activeFilter.value === 'read') {
        filtered = readNotifications.value
      }
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(notification => 
          notification.message?.toLowerCase().includes(query) ||
          notification.data?.message?.toLowerCase().includes(query) ||
          notification.type?.toLowerCase().includes(query)
        )
      }
      return filtered
    })
    const loadNotifications = async () => {
      try {
        switch (props.role) {
          case 'waiter':
            await notificationsStore.loadWaiterNotifications()
            break
          case 'admin':
            await notificationsStore.loadAdminNotifications()
            break
          default:
            await notificationsStore.loadNotifications()
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      }
    }
    const markAllAsRead = async () => {
      try {
        await notificationsStore.markAllAsRead()
        emit('notification-action', { action: 'mark_all_read' })
      } catch (error) {
        console.error('Error marcando todas como leídas:', error)
      }
    }
    const deleteAllRead = async () => {
      try {
        await notificationsStore.deleteAllRead()
        emit('notification-action', { action: 'delete_all_read' })
      } catch (error) {
        console.error('Error eliminando notificaciones leídas:', error)
      }
    }
    const handleNotificationAction = (data) => {
      emit('notification-action', data)
    }
    const getEmptyStateTitle = () => {
      if (searchQuery.value) {
        return 'No se encontraron notificaciones'
      }
      switch (activeFilter.value) {
        case 'unread':
          return 'No hay notificaciones no leídas'
        case 'read':
          return 'No hay notificaciones leídas'
        default:
          return 'No hay notificaciones'
      }
    }
    const getEmptyStateMessage = () => {
      if (searchQuery.value) {
        return 'Intenta con otros términos de búsqueda'
      }
      switch (activeFilter.value) {
        case 'unread':
          return 'Todas las notificaciones han sido leídas'
        case 'read':
          return 'No hay notificaciones leídas para mostrar'
        default:
          return 'Las notificaciones aparecerán aquí cuando las recibas'
      }
    }
    const startAutoRefresh = () => {
      if (props.autoRefresh && props.refreshInterval > 0) {
        refreshTimer.value = setInterval(loadNotifications, props.refreshInterval)
      }
    }
    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }
    onMounted(() => {
      loadNotifications()
      startAutoRefresh()
    })
    watch(() => props.autoRefresh, (newValue) => {
      if (newValue) {
        startAutoRefresh()
      } else {
        stopAutoRefresh()
      }
    })
    watch(() => props.refreshInterval, () => {
      stopAutoRefresh()
      if (props.autoRefresh) {
        startAutoRefresh()
      }
    })
    const cleanup = () => {
      stopAutoRefresh()
    }
    return {
      activeFilter,
      searchQuery,
      loading,
      notifications,
      unreadNotifications,
      readNotifications,
      unreadCount,
      readCount,
      totalCount,
      filteredNotifications,
      loadNotifications,
      markAllAsRead,
      deleteAllRead,
      handleNotificationAction,
      getEmptyStateTitle,
      getEmptyStateMessage,
      cleanup
    }
  },
  beforeUnmount() {
    this.cleanup()
  }
}
</script>
<style scoped>
.notifications-list {
  max-width: 800px;
  margin: 0 auto;
}
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.notifications-stats {
  display: flex;
  gap: 24px;
}
.stat-item {
  text-align: center;
}
.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #339af0;
}
.stat-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.notifications-actions {
  display: flex;
  gap: 12px;
}
.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.action-btn.secondary {
  background: #e3f2fd;
  color: #1976d2;
}
.action-btn.secondary:hover:not(:disabled) {
  background: #bbdefb;
}
.action-btn.danger {
  background: #ffebee;
  color: #d32f2f;
}
.action-btn.danger:hover:not(:disabled) {
  background: #ffcdd2;
}
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.notifications-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}
.filter-tabs {
  display: flex;
  gap: 8px;
}
.filter-tab {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-tab:hover {
  background: #f8f9fa;
}
.filter-tab.active {
  background: #339af0;
  color: white;
  border-color: #339af0;
}
.filter-search {
  position: relative;
  flex: 1;
  max-width: 300px;
}
.search-input {
  width: 100%;
  padding: 8px 16px 8px 40px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 13px;
  background: white;
}
.search-input:focus {
  outline: none;
  border-color: #339af0;
  box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.1);
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 14px;
}
.loading-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #339af0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.notifications-container {
  margin-bottom: 24px;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state h3 {
  margin-bottom: 8px;
  color: #495057;
}
.empty-state p {
  font-size: 14px;
  line-height: 1.5;
}
.notifications-pagination {
  text-align: center;
  margin-top: 24px;
}
.load-more-btn {
  padding: 12px 24px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.load-more-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #339af0;
}
.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .notifications-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  .notifications-stats {
    justify-content: space-around;
  }
  .notifications-actions {
    justify-content: center;
  }
  .notifications-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-tabs {
    justify-content: center;
  }
  .filter-search {
    max-width: none;
  }
}
</style> 