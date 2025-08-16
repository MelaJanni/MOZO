<template>
  <div class="notification-debug">
    <div class="page-header">
      <h1>Panel de Debug - Notificaciones</h1>
      <p class="subtitle">Prueba y monitorea el sistema de notificaciones FCM</p>
    </div>
    
    <!-- Componente de debug principal -->
    <NotificationDebugPanel />
    
    <!-- Pruebas de notificaciones en background -->
    <div class="background-tests">
      <h2>📴 Pruebas App Cerrada</h2>
      <p class="test-description">
        Estas pruebas envían notificaciones que deben llegar cuando la aplicación está completamente cerrada.
      </p>
      
      <div class="test-buttons">
        <button @click="testBackgroundNotification" class="test-btn primary">
          🧪 Probar App Cerrada
        </button>
        
        <button @click="scheduleDelayedNotification" class="test-btn secondary">
          ⏰ Notificación en 15s
        </button>
        
        <button @click="showTestInstructions" class="test-btn info">
          📋 Ver Instrucciones
        </button>
      </div>
    </div>
    
    <!-- Lista de notificaciones actuales -->
    <div class="current-notifications" v-if="notifications.length > 0">
      <h2>📬 Notificaciones Actuales ({{ notifications.length }})</h2>
      <div class="notifications-list">
        <div 
          v-for="notification in notifications.slice(0, 10)" 
          :key="notification.id"
          class="notification-preview"
          :class="{ unread: !notification.read_at }"
        >
          <div class="notification-header">
            <strong>{{ notification.data?.title || notification.title || 'Sin título' }}</strong>
            <span class="notification-time">{{ formatTime(notification.created_at || notification.timestamp) }}</span>
          </div>
          <p class="notification-body">{{ notification.data?.message || notification.body || 'Sin mensaje' }}</p>
          <div class="notification-meta">
            <span class="notification-type">{{ notification.type || 'notification' }}</span>
            <span class="notification-status">{{ notification.read_at ? 'Leída' : 'No leída' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Instrucciones -->
    <div class="instructions">
      <h2>📋 Instrucciones de Uso</h2>
      <div class="instruction-steps">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <strong>Inicializar Sistema:</strong>
            <p>Haz clic en "Inicializar Sistema" para configurar FCM y obtener permisos.</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <strong>Probar Notificaciones:</strong>
            <p>Usa "Test Local" para notificaciones inmediatas o "Servidor" para probar el backend.</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <strong>Verificar en el Bell:</strong>
            <p>Las notificaciones aparecerán en el icono de campana en la barra superior.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NotificationDebugPanel from '@/components/NotificationDebugPanel.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { sendTestBackgroundNotification, scheduleTestNotification, getTestInstructions } from '@/utils/testBackgroundNotifications'

// Store
const notificationsStore = useNotificationsStore()

// Computed
const notifications = computed(() => [
  ...notificationsStore.unreadNotifications,
  ...notificationsStore.readNotifications
])

// Métodos
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Métodos para probar notificaciones en background
async function testBackgroundNotification() {
  try {
    await sendTestBackgroundNotification()
    alert('✅ Notificación de prueba enviada. Cierra la app y verifica que llegue la notificación.')
  } catch (error) {
    alert('❌ Error enviando notificación: ' + error.message)
  }
}

async function scheduleDelayedNotification() {
  try {
    await scheduleTestNotification(15) // 15 segundos de delay
    alert('✅ Notificación programada para 15 segundos. Cierra la app y espera.')
  } catch (error) {
    alert('❌ Error programando notificación: ' + error.message)
  }
}

function showTestInstructions() {
  const instructions = getTestInstructions()
  const message = `
Instrucciones para probar notificaciones:

${instructions.steps.join('\n')}

Nota: ${instructions.note}
  `
  alert(message)
}
</script>

<style scoped>
.notification-debug {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #6A3FEA 0%, #8B5FFF 100%);
  color: white;
  border-radius: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.current-notifications {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.current-notifications h2 {
  margin: 0 0 20px 0;
  color: #495057;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-preview {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s;
}

.notification-preview.unread {
  border-left: 4px solid #007bff;
  background: #f0f8ff;
}

.notification-preview:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-header strong {
  color: #333;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #6c757d;
}

.notification-body {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.notification-type {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notification-status {
  color: #6c757d;
}

.instructions {
  margin-top: 30px;
  padding: 20px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
}

.instructions h2 {
  margin: 0 0 20px 0;
  color: #856404;
}

.instruction-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Estilos para pruebas de background */
.background-tests {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #FF6B6B;
}

.background-tests h2 {
  margin: 0 0 12px 0;
  color: #FF6B6B;
  font-size: 20px;
  font-weight: 600;
}

.test-description {
  color: #6c757d;
  margin-bottom: 20px;
  line-height: 1.5;
}

.test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.test-btn.primary {
  background: #FF6B6B;
  color: white;
}

.test-btn.primary:hover {
  background: #FF5252;
  transform: translateY(-1px);
}

.test-btn.secondary {
  background: #4ECDC4;
  color: white;
}

.test-btn.secondary:hover {
  background: #45B7AF;
  transform: translateY(-1px);
}

.test-btn.info {
  background: #6C5CE7;
  color: white;
}

.test-btn.info:hover {
  background: #5A4FCF;
  transform: translateY(-1px);
}

.step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-number {
  background: #6A3FEA;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  color: #495057;
  display: block;
  margin-bottom: 4px;
}

.step-content p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .notification-debug {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
  
  .instruction-steps {
    gap: 12px;
  }
  
  .step {
    flex-direction: column;
    gap: 8px;
  }
}
</style>