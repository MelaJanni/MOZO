<template>
  <div 
    class="notification-card"
    :class="{
      'unread': !notification.read_at,
      'table-call': notification.type === 'table_call'
    }"
  >
    <div class="notification-content">
      <div class="notification-icon">
        <i 
          :class="getNotificationIcon()"
          :style="{ color: getNotificationColor() }"
        ></i>
      </div>
      <div class="notification-body">
        <div class="notification-title">
          {{ getNotificationTitle() }}
        </div>
        <div class="notification-message">
          {{ notification.message || notification.data?.message }}
        </div>
        <div class="notification-meta">
          <span class="notification-time">
            {{ formatTime(notification.created_at) }}
          </span>
          <span v-if="notification.table_number" class="notification-table">
            Mesa {{ notification.table_number }}
          </span>
        </div>
      </div>
      <div v-if="!notification.read_at" class="unread-indicator"></div>
      <div class="notification-actions" v-if="showActions">
        <button 
          v-if="!notification.read_at"
          @click="handleAction('mark_as_read')"
          class="action-btn mark-read"
          title="Marcar como leída"
        >
          <i class="fas fa-check"></i>
        </button>
        <button 
          @click="handleAction('delete')"
          class="action-btn delete"
          title="Eliminar"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { useNotificationsStore } from '../stores/notifications'
export default {
  name: 'NotificationCard',
  props: {
    notification: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      default: 'user'
    }
  },
  emits: ['action-handled'],
  setup() {
    const notificationsStore = useNotificationsStore()
    return { notificationsStore }
  },
  methods: {
    getNotificationIcon() {
      const icons = {
        table_call: 'fas fa-bell',
        order_ready: 'fas fa-utensils',
        payment_received: 'fas fa-credit-card',
        staff_request: 'fas fa-user-plus',
        system: 'fas fa-info-circle',
        default: 'fas fa-bell'
      }
      return icons[this.notification.type] || icons.default
    },
    getNotificationColor() {
      const colors = {
        table_call: '#ff6b6b',
        order_ready: '#51cf66',
        payment_received: '#339af0',
        staff_request: '#fcc419',
        system: '#868e96',
        default: '#495057'
      }
      return colors[this.notification.type] || colors.default
    },
    getNotificationTitle() {
      const titles = {
        table_call: 'Llamada de Mesa',
        order_ready: 'Pedido Listo',
        payment_received: 'Pago Recibido',
        staff_request: 'Solicitud de Personal',
        system: 'Notificación del Sistema',
        default: 'Notificación'
      }
      return titles[this.notification.type] || titles.default
    },
    formatTime(timestamp) {
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
    },
    async handleAction(action) {
      try {
        if (this.role === 'waiter') {
          await this.notificationsStore.handleWaiterNotification(this.notification.id, action)
        } else {
          await this.notificationsStore.handleNotification(this.notification.id, action)
        }
        this.$emit('action-handled', { notificationId: this.notification.id, action })
      } catch (error) {
        console.error('Error manejando acción de notificación:', error)
      }
    }
  }
}
</script>
<style scoped>
.notification-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
}
.notification-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.notification-card.unread {
  border-left: 4px solid #339af0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}
.notification-card.table-call {
  border-left: 4px solid #ff6b6b;
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
}
.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.notification-body {
  flex: 1;
  min-width: 0;
}
.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #212529;
  margin-bottom: 4px;
}
.notification-message {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
  margin-bottom: 8px;
}
.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: #868e96;
}
.notification-time {
  display: flex;
  align-items: center;
  gap: 4px;
}
.notification-table {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}
.unread-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #339af0;
  border-radius: 50%;
}
.notification-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f8f9fa;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
}
.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}
.action-btn.mark-read:hover {
  background: #d4edda;
  color: #155724;
}
.action-btn.delete:hover {
  background: #f8d7da;
  color: #721c24;
}
@media (max-width: 768px) {
  .notification-card {
    padding: 12px;
  }
  .notification-content {
    gap: 8px;
  }
  .notification-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  .notification-title {
    font-size: 13px;
  }
  .notification-message {
    font-size: 12px;
  }
  .notification-actions {
    gap: 4px;
  }
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
}
</style> 