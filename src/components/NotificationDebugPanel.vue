<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h3>🧪 Debug de Notificaciones FCM</h3>
      <p class="debug-subtitle">Panel para probar y debuggear notificaciones push</p>
    </div>

    <!-- Estado del sistema -->
    <div class="debug-section">
      <h4>📊 Estado del Sistema</h4>
      <div class="status-grid">
        <div class="status-item" :class="{ active: authenticated }">
          <span class="status-icon">{{ authenticated ? '✅' : '❌' }}</span>
          <span>Usuario Autenticado</span>
        </div>
        <div class="status-item" :class="{ active: permissions }">
          <span class="status-icon">{{ permissions ? '✅' : '❌' }}</span>
          <span>Permisos Push</span>
        </div>
        <div class="status-item" :class="{ active: fcmTokenPresent }">
          <span class="status-icon">{{ fcmTokenPresent ? '✅' : '❌' }}</span>
          <span>Token FCM</span>
        </div>
        <div class="status-item">
          <span class="status-icon">🔔</span>
          <span>{{ notificationsStore.totalUnreadCount }} no leídas</span>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="debug-section">
      <h4>⚡ Acciones Rápidas</h4>
      <div class="button-grid">
        <button @click="requestPushPermissions" :disabled="loading" class="debug-btn primary">
          {{ loading ? 'Procesando...' : '🔔 Pedir Permisos' }}
        </button>
        <button @click="initializeFCM" :disabled="loading" class="debug-btn secondary">
          🚀 Inicializar FCM
        </button>
        <button @click="sendTokenToServer" :disabled="loading" class="debug-btn secondary">
          📤 Enviar Token al Servidor
        </button>
        <button @click="loadNotifications" :disabled="loading" class="debug-btn info">
          📥 Cargar Notificaciones
        </button>
      </div>
    </div>

    <!-- Envío de notificaciones de prueba -->
    <div class="debug-section">
      <h4>📤 Enviar Notificaciones de Prueba</h4>
      
      <div class="test-form">
        <div class="form-row">
          <label>Título:</label>
          <input v-model="testNotification.title" placeholder="Título de la notificación" />
        </div>
        <div class="form-row">
          <label>Mensaje:</label>
          <textarea v-model="testNotification.body" placeholder="Cuerpo del mensaje" rows="2"></textarea>
        </div>
        <div class="form-row">
          <label>Tipo:</label>
          <select v-model="testNotification.type">
            <option value="all">🌐 Enviar a Todos</option>
            <option value="user">👤 Enviar Solo a Mí</option>
            <option value="device">📱 Enviar a Mi Device</option>
          </select>
        </div>
        <button @click="sendTestNotification" :disabled="loading" class="debug-btn primary full-width">
          {{ loading ? 'Enviando...' : '📨 Enviar Notificación' }}
        </button>
      </div>
    </div>

    <!-- Gestión de Device Tokens -->
    <div class="debug-section">
      <h4>🔑 Gestión de Device Tokens</h4>
      <div class="token-actions">
        <button @click="showCurrentToken" class="debug-btn secondary">
          👀 Ver Token Actual
        </button>
        <button @click="copyTokenToClipboard" class="debug-btn secondary">
          📋 Copiar Token
        </button>
        <button @click="deleteCurrentToken" :disabled="loading" class="debug-btn danger">
          🗑️ Eliminar Token
        </button>
      </div>
    </div>

    <!-- Log de eventos -->
    <div class="debug-section" v-if="debugLogs.length > 0">
      <h4>📝 Log de Eventos</h4>
      <div class="debug-logs">
        <div v-for="log in debugLogs.slice(-10)" :key="log.id" class="log-item" :class="log.type">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <div class="log-actions">
        <button @click="clearLogs" class="debug-btn small">Limpiar Log</button>
        <button @click="downloadLogs" class="debug-btn small">💾 Descargar Log</button>
      </div>
    </div>

    <!-- Información técnica -->
    <div class="debug-section">
      <h4>🔧 Información Técnica</h4>
      <div class="tech-info">
        <div class="info-item">
          <strong>Navegador:</strong> {{ techInfo.browser }}
        </div>
        <div class="info-item">
          <strong>Soporte Push:</strong> {{ techInfo.pushSupport ? 'Sí' : 'No' }}
        </div>
        <div class="info-item">
          <strong>Service Worker:</strong> {{ techInfo.serviceWorkerSupport ? 'Sí' : 'No' }}
        </div>
        <div class="info-item">
          <strong>Firebase Project:</strong> {{ techInfo.firebaseProject }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import notificationsService from '@/services/notifications'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import { initializeFirebase, getFCMToken } from '@/services/firebase'

// Stores
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

// Estado local
const loading = ref(false)
const debugLogs = ref([])
const currentFCMToken = ref(null)

const testNotification = ref({
  title: '🧪 Notificación de Prueba',
  body: 'Esta es una notificación de prueba desde el panel de debug',
  type: 'all'
})

// Estado del sistema (separado para evitar wrappers reactivos que no se desempaquetan)
const authenticated = computed(() => authStore.isAuthenticated)
const permissions = ref(false)
const fcmTokenPresent = computed(() => !!currentFCMToken.value)

// Información técnica
const techInfo = reactive({
  browser: '',
  pushSupport: false,
  serviceWorkerSupport: false,
  firebaseProject: ''
})

// Métodos para logging
function addLog(message, type = 'info') {
  debugLogs.value.push({
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    message,
    type
  })
  console.log(`[NotificationDebug] ${message}`)
}

function clearLogs() {
  debugLogs.value = []
  addLog('🧹 Log limpiado', 'info')
}

function downloadLogs() {
  const logContent = debugLogs.value
    .map(log => `[${log.timestamp.toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`)
    .join('\n')
  
  const blob = new Blob([logContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `notification-debug-${new Date().toISOString().slice(0, 10)}.log`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  addLog('💾 Log descargado', 'success')
}

function formatTime(date) {
  return date.toLocaleTimeString()
}

// Funciones principales de FCM
async function requestPushPermissions() {
  if (loading.value) return
  
  loading.value = true
  addLog('🔔 Solicitando permisos de notificación...', 'info')
  
  try {
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones push')
    }
    
    const permission = await Notification.requestPermission()
    addLog(`📋 Resultado de permisos: ${permission}`, 'info')
    
    if (permission === 'granted') {
      systemStatus.permissions = true
      addLog('✅ Permisos concedidos', 'success')
      showSuccessToast('Permisos de notificación concedidos')
      
      // Inicializar FCM después de obtener permisos
      await initializeFCM()
    } else {
      systemStatus.permissions = false
      addLog('❌ Permisos denegados', 'error')
      showErrorToast('Permisos de notificación denegados')
    }
  } catch (error) {
    addLog(`❌ Error pidiendo permisos: ${error.message}`, 'error')
    showErrorToast(`Error: ${error.message}`)
  } finally {
    loading.value = false
  }
}

async function initializeFCM() {
  if (loading.value) return
  
  loading.value = true
  addLog('🚀 Inicializando Firebase Cloud Messaging...', 'info')
  
  try {
    // Verificar que el usuario esté autenticado
    if (!authStore.isAuthenticated) {
      throw new Error('Usuario no autenticado')
    }
    
    // Inicializar Firebase y obtener token FCM
    await initializeFirebase()
    const token = await getFCMToken()
    
    if (token) {
      currentFCMToken.value = token
      addLog(`🔑 Token FCM obtenido: ${token.substring(0, 20)}...`, 'success')
      addLog('🔥 Listener de mensajes en primer plano configurado', 'success')
      
      // Enviar automáticamente al servidor
      await sendTokenToServer()
    } else {
      throw new Error('No se pudo obtener el token FCM')
    }
    
  } catch (error) {
    addLog(`❌ Error inicializando FCM: ${error.message}`, 'error')
    showErrorToast(`Error inicializando FCM: ${error.message}`)
  } finally {
    loading.value = false
  }
}

async function sendTokenToServer() {
  if (loading.value) return
  
  const token = currentFCMToken.value || localStorage.getItem('fcm_token')
  if (!token) {
    addLog('❌ No hay token FCM para enviar', 'error')
    return
  }
  
  loading.value = true
  addLog('📤 Enviando token al servidor...', 'info')
  
  try {
    const result = await notificationsService.storeDeviceToken(token, 'web', authStore.user.id)
    addLog('✅ Token enviado al servidor exitosamente', 'success')
    showSuccessToast('Token FCM registrado en el servidor')
  } catch (error) {
    addLog(`❌ Error enviando token: ${error.message}`, 'error')
    showErrorToast(`Error enviando token: ${error.message}`)
  } finally {
    loading.value = false
  }
}

async function loadNotifications() {
  if (loading.value) return
  
  loading.value = true
  addLog('📥 Cargando notificaciones...', 'info')
  
  try {
    await notificationsStore.loadNotifications()
    addLog(`📬 ${notificationsStore.totalUnreadCount} notificaciones no leídas cargadas`, 'success')
    showSuccessToast('Notificaciones cargadas')
  } catch (error) {
    addLog(`❌ Error cargando notificaciones: ${error.message}`, 'error')
    showErrorToast(`Error cargando notificaciones: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Funciones de prueba de notificaciones
async function sendTestNotification() {
  if (loading.value) return
  
  if (!testNotification.value.title.trim() || !testNotification.value.body.trim()) {
    showErrorToast('Título y mensaje son requeridos')
    return
  }
  
  loading.value = true
  const { title, body, type } = testNotification.value
  
  addLog(`📨 Enviando notificación tipo: ${type}`, 'info')
  
  try {
    let result
    
    switch (type) {
      case 'all':
        result = await notificationsService.sendNotificationToAll(title, body)
        addLog('✅ Notificación enviada a todos los usuarios', 'success')
        break
        
      case 'user':
        result = await notificationsService.sendNotificationToUser(authStore.user.id, title, body)
        addLog('✅ Notificación enviada solo para ti', 'success')
        break
        
      case 'device':
        const token = currentFCMToken.value || localStorage.getItem('fcm_token')
        if (!token) {
          throw new Error('No hay token FCM disponible')
        }
        result = await notificationsService.sendNotificationToDevice(token, title, body)
        addLog('✅ Notificación enviada a tu dispositivo', 'success')
        break
        
      default:
        throw new Error('Tipo de notificación no válido')
    }
    
    showSuccessToast('Notificación enviada exitosamente')
    addLog(`📝 Respuesta: ${JSON.stringify(result)}`, 'info')
    
  } catch (error) {
    addLog(`❌ Error enviando notificación: ${error.message}`, 'error')
    showErrorToast(`Error enviando notificación: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Gestión de tokens
function showCurrentToken() {
  const token = currentFCMToken.value || localStorage.getItem('fcm_token')
  if (token) {
    addLog('🔑 Token FCM actual:', 'info')
    addLog(token, 'info')
    showSuccessToast('Token mostrado en el log')
  } else {
    addLog('❌ No hay token FCM disponible', 'error')
    showErrorToast('No hay token FCM disponible')
  }
}

async function copyTokenToClipboard() {
  const token = currentFCMToken.value || localStorage.getItem('fcm_token')
  if (token) {
    try {
      await navigator.clipboard.writeText(token)
      addLog('📋 Token copiado al portapapeles', 'success')
      showSuccessToast('Token copiado al portapapeles')
    } catch (error) {
      addLog('❌ Error copiando token', 'error')
      showErrorToast('Error copiando token')
    }
  } else {
    showErrorToast('No hay token para copiar')
  }
}

async function deleteCurrentToken() {
  if (loading.value) return
  
  const token = currentFCMToken.value || localStorage.getItem('fcm_token')
  if (!token) {
    showErrorToast('No hay token para eliminar')
    return
  }
  
  loading.value = true
  addLog('🗑️ Eliminando token...', 'info')
  
  try {
    // Aquí iría la llamada para eliminar del servidor
    // await notificationsService.deleteDeviceToken(tokenId)
    
    currentFCMToken.value = null
    localStorage.removeItem('fcm_token')
    
    addLog('✅ Token eliminado', 'success')
    showSuccessToast('Token eliminado')
  } catch (error) {
    addLog(`❌ Error eliminando token: ${error.message}`, 'error')
    showErrorToast(`Error eliminando token: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Inicialización
onMounted(() => {
  addLog('🔧 Panel de debug cargado', 'info')
  
  // Obtener información técnica
  techInfo.browser = navigator.userAgent.split('(')[0].trim()
  techInfo.pushSupport = 'Notification' in window
  techInfo.serviceWorkerSupport = 'serviceWorker' in navigator
  techInfo.firebaseProject = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'No configurado'
  
  // Verificar permisos actuales
  if ('Notification' in window) {
    permissions.value = Notification.permission === 'granted'
    addLog(`📋 Permisos actuales: ${Notification.permission}`, 'info')
  }
  
  // Verificar token existente
  const existingToken = localStorage.getItem('fcm_token')
  if (existingToken) {
    currentFCMToken.value = existingToken
    addLog(`🔑 Token FCM encontrado: ${existingToken.substring(0, 20)}...`, 'info')
  }

  addLog(`👤 Usuario autenticado: ${authStore.isAuthenticated ? 'Sí' : 'No'}`, 'info')
  if (authStore.user) {
    addLog(`👤 ID: ${authStore.user.id} | Email: ${authStore.user.email}`, 'info')
  }
})
</script>

<style scoped>
.debug-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.debug-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #6A3FEA 0%, #8B5FFF 100%);
  color: white;
  border-radius: 12px;
}

.debug-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.debug-subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.debug-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-item.active {
  border-color: #28a745;
  background: #f8fff9;
}

.status-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.debug-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.debug-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-btn.primary {
  background: #007bff;
  color: white;
}

.debug-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.debug-btn.secondary {
  background: #6c757d;
  color: white;
}

.debug-btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.debug-btn.info {
  background: #17a2b8;
  color: white;
}

.debug-btn.info:hover:not(:disabled) {
  background: #138496;
}

.debug-btn.danger {
  background: #dc3545;
  color: white;
}

.debug-btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.debug-btn.small {
  padding: 8px 12px;
  font-size: 12px;
}

.debug-btn.full-width {
  grid-column: 1 / -1;
}

.test-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row label {
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

.form-row input,
.form-row textarea,
.form-row select {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-row input:focus,
.form-row textarea:focus,
.form-row select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.token-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.debug-logs {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 10px 15px;
  border-bottom: 1px solid #f8f9fa;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.success {
  background: #f8fff9;
  color: #155724;
}

.log-item.error {
  background: #fff5f5;
  color: #721c24;
}

.log-item.info {
  background: #f8f9fa;
  color: #495057;
}

.log-time {
  font-weight: 600;
  min-width: 80px;
  color: #6c757d;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-actions {
  display: flex;
  gap: 10px;
}

.tech-info {
  display: grid;
  gap: 10px;
}

.info-item {
  padding: 8px 12px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
}

.info-item strong {
  color: #495057;
}

@media (max-width: 768px) {
  .debug-panel {
    padding: 15px;
  }
  
  .status-grid,
  .button-grid {
    grid-template-columns: 1fr;
  }
  
  .token-actions {
    flex-direction: column;
  }
}
</style>