<template>
  <div class="notification-debug-panel">
    <div class="panel-header">
      <h3>Notificaciones en Tiempo Real</h3>
      <div class="header-actions">
        <button @click="toggleAutoRefresh" class="action-btn">
          <i class="fas fa-sync-alt" :class="{ spinning: autoRefresh }"></i>
          {{ autoRefresh ? 'Pausar' : 'Auto-refresh' }}
        </button>
        <button @click="clearNotifications" class="action-btn">
          <i class="fas fa-trash"></i>
          Limpiar
        </button>
      </div>
    </div>
    <div class="notifications-container" ref="notificationsContainer">
      <div v-if="notifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No hay notificaciones para mostrar</p>
      </div>
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification-item"
        :class="notification.type"
      >
        <div class="notification-header">
          <div class="notification-type">
            <i :class="getTypeIcon(notification.type)"></i>
            {{ getTypeLabel(notification.type) }}
          </div>
          <div class="notification-time">
            {{ formatTime(notification.timestamp) }}
          </div>
        </div>
        <div class="notification-content">
          <div class="notification-message">
            {{ notification.message }}
          </div>
          <div v-if="notification.details" class="notification-details">
            <details>
              <summary>Detalles</summary>
              <pre>{{ JSON.stringify(notification.details, null, 2) }}</pre>
            </details>
          </div>
        </div>
        <div class="notification-status">
          <span 
            class="status-badge"
            :class="notification.status"
          >
            {{ getStatusLabel(notification.status) }}
          </span>
        </div>
      </div>
    </div>
    <div class="panel-footer">
      <div class="stats">
        <span class="stat">
          <i class="fas fa-bell"></i>
          {{ notifications.length }} total
        </span>
        <span class="stat">
          <i class="fas fa-check-circle"></i>
          {{ successfulCount }} exitosas
        </span>
        <span class="stat">
          <i class="fas fa-times-circle"></i>
          {{ failedCount }} fallidas
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
export default {
  name: 'NotificationDebugPanel',
  props: {
    maxNotifications: {
      type: Number,
      default: 50
    }
  },
  setup(props) {
    const notifications = ref([])
    const autoRefresh = ref(true)
    const refreshInterval = ref(null)
    const notificationsContainer = ref(null)
    const successfulCount = computed(() => 
      notifications.value.filter(n => n.status === 'success').length
    )
    const failedCount = computed(() => 
      notifications.value.filter(n => n.status === 'error').length
    )
    const addNotification = (type, message, details = null, status = 'info') => {
      const notification = {
        id: Date.now() + Math.random(),
        type,
        message,
        details,
        status,
        timestamp: new Date()
      }
      notifications.value.unshift(notification)
      if (notifications.value.length > props.maxNotifications) {
        notifications.value = notifications.value.slice(0, props.maxNotifications)
      }
      nextTick(() => {
        if (notificationsContainer.value) {
          notificationsContainer.value.scrollTop = 0
        }
      })
    }
    const clearNotifications = () => {
      notifications.value = []
    }
    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value
      if (autoRefresh.value) {
        startAutoRefresh()
      } else {
        stopAutoRefresh()
      }
    }
    const startAutoRefresh = () => {
      if (refreshInterval.value) return
      refreshInterval.value = setInterval(() => {
        const types = ['table_call', 'system', 'payment', 'waiter']
        const randomType = types[Math.floor(Math.random() * types.length)]
        const randomMessage = `Notificación de prueba ${Date.now()}`
        addNotification(randomType, randomMessage, { test: true }, 'success')
      }, 5000) // Cada 5 segundos
    }
    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }
    const getTypeIcon = (type) => {
      const icons = {
        table_call: 'fas fa-bell',
        system: 'fas fa-info-circle',
        payment: 'fas fa-credit-card',
        waiter: 'fas fa-user-tie',
        error: 'fas fa-exclamation-triangle',
        success: 'fas fa-check-circle'
      }
      return icons[type] || 'fas fa-bell'
    }
    const getTypeLabel = (type) => {
      const labels = {
        table_call: 'Llamada de Mesa',
        system: 'Sistema',
        payment: 'Pago',
        waiter: 'Mozo',
        error: 'Error',
        success: 'Éxito'
      }
      return labels[type] || 'Notificación'
    }
    const getStatusLabel = (status) => {
      const labels = {
        success: 'Exitoso',
        error: 'Error',
        pending: 'Pendiente',
        info: 'Info'
      }
      return labels[status] || 'Info'
    }
    const formatTime = (timestamp) => {
      return timestamp.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    const logNotification = (type, message, details = null, status = 'info') => {
      addNotification(type, message, details, status)
    }
    onMounted(() => {
      if (autoRefresh.value) {
        startAutoRefresh()
      }
    })
    onUnmounted(() => {
      stopAutoRefresh()
    })
    return {
      notifications,
      autoRefresh,
      notificationsContainer,
      successfulCount,
      failedCount,
      addNotification,
      clearNotifications,
      toggleAutoRefresh,
      getTypeIcon,
      getTypeLabel,
      getStatusLabel,
      formatTime,
      logNotification
    }
  }
}
</script>
<style scoped>
.notification-debug-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #495057;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}
.action-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}
.notifications-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}
.empty-state i {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}
.notification-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border-left: 4px solid #6c757d;
  transition: all 0.2s ease;
}
.notification-item:hover {
  background: #e9ecef;
}
.notification-item.table_call {
  border-left-color: #ff6b6b;
  background: #fff5f5;
}
.notification-item.system {
  border-left-color: #17a2b8;
  background: #f0f8ff;
}
.notification-item.payment {
  border-left-color: #28a745;
  background: #f0fff4;
}
.notification-item.waiter {
  border-left-color: #ffc107;
  background: #fffbf0;
}
.notification-item.error {
  border-left-color: #dc3545;
  background: #fff5f5;
}
.notification-item.success {
  border-left-color: #28a745;
  background: #f0fff4;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.notification-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #495057;
}
.notification-time {
  font-size: 11px;
  color: #6c757d;
}
.notification-content {
  margin-bottom: 8px;
}
.notification-message {
  font-size: 13px;
  color: #212529;
  line-height: 1.4;
  margin-bottom: 8px;
}
.notification-details {
  font-size: 11px;
}
.notification-details details {
  background: white;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #e9ecef;
}
.notification-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}
.notification-details pre {
  margin: 0;
  font-size: 10px;
  color: #6c757d;
  white-space: pre-wrap;
  word-break: break-all;
}
.notification-status {
  display: flex;
  justify-content: flex-end;
}
.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-badge.success {
  background: #d4edda;
  color: #155724;
}
.status-badge.error {
  background: #f8d7da;
  color: #721c24;
}
.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}
.status-badge.info {
  background: #d1ecf1;
  color: #0c5460;
}
.panel-footer {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}
.stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}
.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
}
.stat i {
  font-size: 14px;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.notifications-container::-webkit-scrollbar {
  width: 6px;
}
.notifications-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.notifications-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.notifications-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .header-actions {
    justify-content: center;
  }
  .stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 