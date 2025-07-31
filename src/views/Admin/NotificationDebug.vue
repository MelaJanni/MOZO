<template>
  <div class="notification-debug">
    <div class="page-header">
      <h1>Panel de Debug - Notificaciones</h1>
      <p class="subtitle">Prueba y monitorea el sistema de notificaciones</p>
    </div>
    <div class="system-status">
      <h2>Estado del Sistema</h2>
      <div class="status-grid">
        <div class="status-card">
          <div class="status-icon" :class="{ online: systemStatus.websocket }">
            <i class="fas fa-wifi"></i>
          </div>
          <div class="status-info">
            <h3>WebSocket</h3>
            <p>{{ systemStatus.websocket ? 'Conectado' : 'Desconectado' }}</p>
          </div>
        </div>
        <div class="status-card">
          <div class="status-icon" :class="{ online: systemStatus.fcm }">
            <i class="fas fa-fire"></i>
          </div>
          <div class="status-info">
            <h3>FCM</h3>
            <p>{{ systemStatus.fcm ? 'Configurado' : 'No configurado' }}</p>
          </div>
        </div>
        <div class="status-card">
          <div class="status-icon" :class="{ online: systemStatus.api }">
            <i class="fas fa-server"></i>
          </div>
          <div class="status-info">
            <h3>API</h3>
            <p>{{ systemStatus.api ? 'Disponible' : 'Error' }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="test-section">
      <h2>Pruebas de Notificaciones</h2>
      <div class="test-group">
        <h3>Notificaciones de Mesa</h3>
        <div class="test-buttons">
          <button 
            @click="testTableCall"
            :disabled="loading"
            class="test-btn primary"
          >
            <i class="fas fa-bell"></i>
            Llamada de Mesa
          </button>
          <button 
            @click="testMultipleTableCalls"
            :disabled="loading"
            class="test-btn secondary"
          >
            <i class="fas fa-layer-group"></i>
            Múltiples Llamadas
          </button>
        </div>
      </div>
      <div class="test-group">
        <h3>Notificaciones de Mozo</h3>
        <div class="test-buttons">
          <button 
            @click="testWaiterNotification"
            :disabled="loading"
            class="test-btn primary"
          >
            <i class="fas fa-user-tie"></i>
            Notificación de Mozo
          </button>
          <button 
            @click="testWaiterGlobalToggle"
            :disabled="loading"
            class="test-btn secondary"
          >
            <i class="fas fa-toggle-on"></i>
            Toggle Global Mozo
          </button>
        </div>
      </div>
      <div class="test-group">
        <h3>Notificaciones de Sistema</h3>
        <div class="test-buttons">
          <button 
            @click="testSystemNotification"
            :disabled="loading"
            class="test-btn primary"
          >
            <i class="fas fa-info-circle"></i>
            Notificación Sistema
          </button>
          <button 
            @click="testPaymentNotification"
            :disabled="loading"
            class="test-btn secondary"
          >
            <i class="fas fa-credit-card"></i>
            Pago Recibido
          </button>
        </div>
      </div>
      <div class="test-group">
        <h3>Tokens de Dispositivo</h3>
        <div class="test-buttons">
          <button 
            @click="testDeviceToken"
            :disabled="loading"
            class="test-btn primary"
          >
            <i class="fas fa-mobile-alt"></i>
            Probar Token FCM
          </button>
          <button 
            @click="testDeleteToken"
            :disabled="loading"
            class="test-btn danger"
          >
            <i class="fas fa-trash"></i>
            Eliminar Token
          </button>
        </div>
      </div>
      <div class="test-group">
        <h3>Pruebas Masivas</h3>
        <div class="test-buttons">
          <button 
            @click="testBulkNotifications"
            :disabled="loading"
            class="test-btn warning"
          >
            <i class="fas fa-bomb"></i>
            Envío Masivo (10)
          </button>
          <button 
            @click="testStressTest"
            :disabled="loading"
            class="test-btn danger"
          >
            <i class="fas fa-rocket"></i>
            Test de Estrés (50)
          </button>
        </div>
      </div>
    </div>
    <div class="config-section">
      <h2>Configuración de Prueba</h2>
      <div class="config-grid">
        <div class="config-item">
          <label>Mesa de Prueba:</label>
          <input 
            v-model="testConfig.tableId" 
            type="number" 
            placeholder="1"
            class="config-input"
          >
        </div>
        <div class="config-item">
          <label>Mensaje Personalizado:</label>
          <input 
            v-model="testConfig.customMessage" 
            type="text" 
            placeholder="Mensaje de prueba"
            class="config-input"
          >
        </div>
        <div class="config-item">
          <label>Delay (ms):</label>
          <input 
            v-model="testConfig.delay" 
            type="number" 
            placeholder="1000"
            class="config-input"
          >
        </div>
        <div class="config-item">
          <label>Repeticiones:</label>
          <input 
            v-model="testConfig.repetitions" 
            type="number" 
            placeholder="1"
            class="config-input"
          >
        </div>
      </div>
    </div>
    <div class="logs-realtime-section">
      <div class="section-header">
        <h2>Logs y Notificaciones en Tiempo Real</h2>
      </div>
      <div class="logs-realtime-grid">
        <div class="logs-section">
          <div class="logs-header">
            <h3>Logs de Actividad</h3>
            <div class="logs-actions">
              <button @click="clearLogs" class="action-btn">
                <i class="fas fa-trash"></i>
                Limpiar
              </button>
              <button @click="exportLogs" class="action-btn">
                <i class="fas fa-download"></i>
                Exportar
              </button>
              <button @click="toggleAutoScroll" class="action-btn">
                <i class="fas fa-scroll"></i>
                {{ autoScroll ? 'Pausar' : 'Auto-scroll' }}
              </button>
            </div>
          </div>
          <div class="logs-container" ref="logsContainer">
            <div 
              v-for="(log, index) in logs" 
              :key="index"
              class="log-entry"
              :class="log.type"
            >
              <div class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</div>
              <div class="log-icon">
                <i :class="getLogIcon(log.type)"></i>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.details" class="log-details">
                <pre>{{ JSON.stringify(log.details, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="realtime-section">
          <div class="diagnostic-panel">
            <h3>Diagnóstico del Panel</h3>
            <div class="diagnostic-content">
              <p><strong>Estado del Store:</strong> {{ notificationsStore ? 'Cargado' : 'No cargado' }}</p>
              <p><strong>isConnected:</strong> {{ notificationsStore?.isConnected ? 'Sí' : 'No' }}</p>
              <p><strong>FCM Token:</strong> {{ fcmTokenStatus }}</p>
              <p><strong>Usuario Autenticado:</strong> {{ authStore?.isAuthenticated ? 'Sí' : 'No' }}</p>
              <p><strong>Variables de Entorno:</strong></p>
              <ul>
                <li>VITE_PUSHER_APP_KEY: {{ envVars.pusherKey ? 'Definida' : 'No definida' }}</li>
                <li>VITE_PUSHER_APP_CLUSTER: {{ envVars.pusherCluster ? 'Definida' : 'No definida' }}</li>
              </ul>
              <div style="margin-top: 16px;">
                <button 
                  @click="testWebSocketConnection" 
                  class="test-btn primary"
                  style="width: 100%;"
                >
                  <i class="fas fa-wifi"></i>
                  Probar Conexión WebSocket
                </button>
              </div>
              <div style="margin-top: 8px;">
                <button 
                  @click="checkSystemStatus" 
                  class="test-btn secondary"
                  style="width: 100%;"
                >
                  <i class="fas fa-info-circle"></i>
                  Verificar Estado del Sistema
                </button>
              </div>
              <div style="margin-top: 8px;">
                <button 
                  @click="runFullDiagnostics" 
                  class="test-btn warning"
                  style="width: 100%;"
                >
                  <i class="fas fa-stethoscope"></i>
                  Diagnóstico Completo
                </button>
              </div>
              <div style="margin-top: 16px; padding: 12px; background: #f1f3f4; border-radius: 6px;">
                <p><strong>Debug Info:</strong></p>
                <p>• Token en localStorage: {{ localStorageTokenStatus }}</p>
                <p>• Usuario en localStorage: {{ localStorageUserStatus }}</p>
                <p>• Echo instance: {{ echoInstanceStatus }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="stats-section">
      <h2>Estadísticas de Prueba</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalSent }}</div>
          <div class="stat-label">Total Enviadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.successful }}</div>
          <div class="stat-label">Exitosas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.failed }}</div>
          <div class="stat-label">Fallidas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.avgResponseTime }}ms</div>
          <div class="stat-label">Tiempo Promedio</div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>
<script>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import notificationsService from '@/services/notifications'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import NotificationDebugPanel from '@/components/NotificationDebugPanel.vue'
import { useAuthStore } from '@/stores/auth'
export default {
  name: 'NotificationDebug',
  components: {
    NotificationDebugPanel
  },
  setup() {
    console.log('🔍 NotificationDebug.vue - Setup iniciado')
    const loading = ref(false)
    const loadingMessage = ref('')
    const autoScroll = ref(true)
    const logsContainer = ref(null)
    const notificationsStore = useNotificationsStore()
    const authStore = useAuthStore()
    console.log('🔍 Stores cargados:', {
      notificationsStore: !!notificationsStore,
      authStore: !!authStore,
      isAuthenticated: authStore?.isAuthenticated,
      isConnected: notificationsStore?.isConnected
    })
    const systemStatus = reactive({
      websocket: computed(() => notificationsStore.isConnected),
      fcm: computed(() => !!localStorage.getItem('fcm_token')),
      api: true // Asumimos que la API está ok si la página carga
    })
    const envVars = reactive({
      pusherKey: import.meta.env.VITE_PUSHER_APP_KEY,
      pusherCluster: import.meta.env.VITE_PUSHER_APP_CLUSTER
    })
    console.log('🔍 Variables de entorno:', {
      pusherKey: envVars.pusherKey ? 'Definida' : 'No definida',
      pusherCluster: envVars.pusherCluster ? 'Definida' : 'No definida'
    })
    const fcmTokenStatus = computed(() => {
      try {
        return localStorage.getItem('fcm_token') ? 'Presente' : 'Ausente'
      } catch (error) {
        return 'Error al verificar'
      }
    })
    console.log('🔍 FCM Token Status:', fcmTokenStatus.value)
    const localStorageTokenStatus = computed(() => {
      try {
        return localStorage.getItem('token') ? 'Presente' : 'Ausente'
      } catch (error) {
        return 'Error al verificar'
      }
    })
    const localStorageUserStatus = computed(() => {
      try {
        return localStorage.getItem('user') ? 'Presente' : 'Ausente'
      } catch (error) {
        return 'Error al verificar'
      }
    })
    const echoInstanceStatus = computed(() => {
      return notificationsStore?.echo ? 'Creada' : 'No creada'
    })
    const testConfig = reactive({
      tableId: 1,
      customMessage: 'Mensaje de prueba desde panel de debug',
      delay: 1000,
      repetitions: 1
    })
    const stats = reactive({
      totalSent: 0,
      successful: 0,
      failed: 0,
      responseTimes: []
    })
    const logs = ref([])
    const addLog = (type, message, details = null) => {
      const log = {
        timestamp: new Date(),
        type,
        message,
        details
      }
      logs.value.unshift(log)
      if (logs.value.length > 100) {
        logs.value = logs.value.slice(0, 100)
      }
      if (autoScroll.value) {
        nextTick(() => {
          if (logsContainer.value) {
            logsContainer.value.scrollTop = 0
          }
        })
      }
    }
    const formatTimestamp = (timestamp) => {
      return timestamp.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      })
    }
    const getLogIcon = (type) => {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        test: 'fas fa-flask'
      }
      return icons[type] || icons.info
    }
    const clearLogs = () => {
      logs.value = []
    }
    const exportLogs = () => {
      const dataStr = JSON.stringify(logs.value, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `notification-logs-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
    const toggleAutoScroll = () => {
      autoScroll.value = !autoScroll.value
    }
    const updateStats = (success, responseTime) => {
      stats.totalSent++
      if (success) {
        stats.successful++
      } else {
        stats.failed++
      }
      stats.responseTimes.push(responseTime)
      if (stats.responseTimes.length > 0) {
        stats.avgResponseTime = Math.round(
          stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
        )
      }
    }
    const testTableCall = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando llamada de mesa...'
      try {
        const startTime = Date.now()
        const response = await notificationsService.callWaiter(testConfig.tableId)
        const responseTime = Date.now() - startTime
        addLog('success', `Llamada de mesa enviada exitosamente a mesa ${testConfig.tableId}`, response)
        updateStats(true, responseTime)
        showSuccessToast('Llamada de mesa enviada')
      } catch (error) {
        addLog('error', `Error enviando llamada de mesa: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error enviando llamada de mesa')
      } finally {
        loading.value = false
      }
    }
    const testMultipleTableCalls = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando múltiples llamadas...'
      for (let i = 0; i < testConfig.repetitions; i++) {
        try {
          const tableId = testConfig.tableId + i
          const startTime = Date.now()
          await notificationsService.callWaiter(tableId)
          const responseTime = Date.now() - startTime
          addLog('success', `Llamada enviada a mesa ${tableId}`, { tableId, iteration: i + 1 })
          updateStats(true, responseTime)
          if (testConfig.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, testConfig.delay))
          }
        } catch (error) {
          addLog('error', `Error en llamada ${i + 1}: ${error.message}`, error)
          updateStats(false, 0)
        }
      }
      loading.value = false
      showSuccessToast(`${testConfig.repetitions} llamadas enviadas`)
    }
    const testWaiterNotification = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando notificación de mozo...'
      try {
        const startTime = Date.now()
        const response = await fetch('/api/waiter/notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            message: testConfig.customMessage,
            type: 'test_notification'
          })
        })
        const responseTime = Date.now() - startTime
        if (response.ok) {
          const data = await response.json()
          addLog('success', 'Notificación de mozo enviada', data)
          updateStats(true, responseTime)
          showSuccessToast('Notificación de mozo enviada')
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        addLog('error', `Error enviando notificación de mozo: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error enviando notificación de mozo')
      } finally {
        loading.value = false
      }
    }
    const testWaiterGlobalToggle = async () => {
      loading.value = true
      loadingMessage.value = 'Alternando notificaciones globales...'
      try {
        const startTime = Date.now()
        const response = await notificationsService.waiterGlobalNotifications(true)
        const responseTime = Date.now() - startTime
        addLog('success', 'Notificaciones globales de mozo alternadas', response)
        updateStats(true, responseTime)
        showSuccessToast('Notificaciones globales alternadas')
      } catch (error) {
        addLog('error', `Error alternando notificaciones: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error alternando notificaciones')
      } finally {
        loading.value = false
      }
    }
    const testSystemNotification = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando notificación de sistema...'
      try {
        const startTime = Date.now()
        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            message: testConfig.customMessage,
            type: 'system_notification'
          })
        })
        const responseTime = Date.now() - startTime
        if (response.ok) {
          const data = await response.json()
          addLog('success', 'Notificación de sistema enviada', data)
          updateStats(true, responseTime)
          showSuccessToast('Notificación de sistema enviada')
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        addLog('error', `Error enviando notificación de sistema: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error enviando notificación de sistema')
      } finally {
        loading.value = false
      }
    }
    const testPaymentNotification = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando notificación de pago...'
      try {
        const startTime = Date.now()
        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            message: 'Pago recibido exitosamente',
            type: 'payment_received',
            amount: 25.50
          })
        })
        const responseTime = Date.now() - startTime
        if (response.ok) {
          const data = await response.json()
          addLog('success', 'Notificación de pago enviada', data)
          updateStats(true, responseTime)
          showSuccessToast('Notificación de pago enviada')
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        addLog('error', `Error enviando notificación de pago: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error enviando notificación de pago')
      } finally {
        loading.value = false
      }
    }
    const testDeviceToken = async () => {
      loading.value = true
      loadingMessage.value = 'Probando token de dispositivo...'
      try {
        const testToken = 'test-fcm-token-' + Date.now()
        const startTime = Date.now()
        const response = await notificationsService.storeDeviceToken(testToken, 'web')
        const responseTime = Date.now() - startTime
        addLog('success', 'Token de dispositivo guardado', response)
        updateStats(true, responseTime)
        showSuccessToast('Token de dispositivo guardado')
      } catch (error) {
        addLog('error', `Error guardando token: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error guardando token')
      } finally {
        loading.value = false
      }
    }
    const testDeleteToken = async () => {
      loading.value = true
      loadingMessage.value = 'Eliminando token de dispositivo...'
      try {
        const testToken = 'test-fcm-token-' + Date.now()
        const startTime = Date.now()
        const response = await notificationsService.deleteDeviceToken(testToken)
        const responseTime = Date.now() - startTime
        addLog('success', 'Token de dispositivo eliminado', response)
        updateStats(true, responseTime)
        showSuccessToast('Token eliminado')
      } catch (error) {
        addLog('error', `Error eliminando token: ${error.message}`, error)
        updateStats(false, 0)
        showErrorToast('Error eliminando token')
      } finally {
        loading.value = false
      }
    }
    const testBulkNotifications = async () => {
      loading.value = true
      loadingMessage.value = 'Enviando notificaciones masivas...'
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          notificationsService.callWaiter(testConfig.tableId + i)
            .then(() => ({ success: true, index: i }))
            .catch(error => ({ success: false, index: i, error }))
        )
      }
      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success).length
      const failed = results.length - successful
      addLog('info', `Envío masivo completado: ${successful} exitosas, ${failed} fallidas`, results)
      stats.totalSent += results.length
      stats.successful += successful
      stats.failed += failed
      loading.value = false
      showSuccessToast(`Envío masivo completado: ${successful}/${results.length} exitosas`)
    }
    const testStressTest = async () => {
      loading.value = true
      loadingMessage.value = 'Ejecutando test de estrés...'
      const promises = []
      for (let i = 0; i < 50; i++) {
        promises.push(
          notificationsService.callWaiter(testConfig.tableId + i)
            .then(() => ({ success: true, index: i }))
            .catch(error => ({ success: false, index: i, error }))
        )
      }
      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success).length
      const failed = results.length - successful
      addLog('warning', `Test de estrés completado: ${successful} exitosas, ${failed} fallidas`, results)
      stats.totalSent += results.length
      stats.successful += successful
      stats.failed += failed
      loading.value = false
      showSuccessToast(`Test de estrés completado: ${successful}/${results.length} exitosas`)
    }
    const testWebSocketConnection = async () => {
      loading.value = true
      loadingMessage.value = 'Probando conexión WebSocket...'
      try {
        await notificationsService.testWebSocketConnection()
        addLog('success', 'Conexión WebSocket exitosa')
        showSuccessToast('Conexión WebSocket exitosa')
      } catch (error) {
        addLog('error', `Error en la conexión WebSocket: ${error.message}`, error)
        showErrorToast('Error en la conexión WebSocket')
      } finally {
        loading.value = false
      }
    }
    const checkSystemStatus = () => {
      addLog('info', 'Verificando estado del sistema...')
      console.log('🔍 Estado actual del sistema:', {
        websocket: systemStatus.websocket,
        fcm: systemStatus.fcm,
        api: systemStatus.api,
        notificationsStore: !!notificationsStore,
        isConnected: notificationsStore?.isConnected,
        echo: !!notificationsStore?.echo,
        user: authStore?.user,
        isAuthenticated: authStore?.isAuthenticated
      })
      console.log('🔍 Variables de entorno:', {
        VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY ? 'Definida' : 'No definida',
        VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER ? 'Definida' : 'No definida',
        NODE_ENV: import.meta.env.NODE_ENV,
        DEV: import.meta.env.DEV
      })
      console.log('🔍 localStorage:', {
        token: localStorage.getItem('token') ? 'Presente' : 'Ausente',
        user: localStorage.getItem('user') ? 'Presente' : 'Ausente',
        fcm_token: localStorage.getItem('fcm_token') ? 'Presente' : 'Ausente'
      })
      showSuccessToast('Estado del sistema verificado en la consola.')
    }
    const runFullDiagnostics = () => {
      addLog('info', 'Ejecutando diagnóstico completo...')
      checkSystemStatus()
      import('@/utils/diagnostics').then(({ runSystemDiagnostics, checkFirebaseConfig, generateDiagnosticReport }) => {
        runSystemDiagnostics()
        checkFirebaseConfig()
        generateDiagnosticReport()
      }).catch(error => {
        console.error('Error ejecutando diagnóstico:', error)
        addLog('error', `Error ejecutando diagnóstico: ${error.message}`)
      })
      showSuccessToast('Diagnóstico completo ejecutado y logs actualizados.')
    }
    onMounted(() => {
      console.log('🔍 NotificationDebug.vue - Componente montado')
      addLog('info', 'Panel de debug de notificaciones iniciado')
      console.log('🔍 Estado inicial del store:', {
        notificationsStore: !!notificationsStore,
        isConnected: notificationsStore?.isConnected,
        echo: !!notificationsStore?.echo,
        user: authStore?.user,
        isAuthenticated: authStore?.isAuthenticated
      })
      console.log('🔍 Variables de entorno disponibles:', {
        VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY ? 'Definida' : 'No definida',
        VITE_PUSHER_APP_CLUSTER: import.meta.env.VITE_PUSHER_APP_CLUSTER ? 'Definida' : 'No definida',
        NODE_ENV: import.meta.env.NODE_ENV,
        DEV: import.meta.env.DEV
      })
      console.log('🔍 localStorage:', {
        token: localStorage.getItem('token') ? 'Presente' : 'Ausente',
        user: localStorage.getItem('user') ? 'Presente' : 'Ausente',
        fcm_token: localStorage.getItem('fcm_token') ? 'Presente' : 'Ausente'
      })
      systemStatus.api = true
      console.log('🔍 Estado final del sistema:', {
        websocket: systemStatus.websocket,
        fcm: systemStatus.fcm,
        api: systemStatus.api
      })
      if (!notificationsStore.isConnected && authStore.isAuthenticated) {
        console.log('🔍 Intentando inicializar WebSocket...')
        try {
          notificationsStore.initializeRealTimeNotifications()
          addLog('info', 'WebSocket inicializado')
        } catch (error) {
          console.error('🔍 Error inicializando WebSocket:', error)
          addLog('error', `Error inicializando WebSocket: ${error.message}`)
        }
      }
    })
    return {
      loading,
      loadingMessage,
      autoScroll,
      logsContainer,
      logs,
      systemStatus,
      testConfig,
      stats,
      envVars,
      fcmTokenStatus,
      localStorageTokenStatus,
      localStorageUserStatus,
      echoInstanceStatus,
      addLog,
      formatTimestamp,
      getLogIcon,
      clearLogs,
      exportLogs,
      toggleAutoScroll,
      testTableCall,
      testMultipleTableCalls,
      testWaiterNotification,
      testWaiterGlobalToggle,
      testSystemNotification,
      testPaymentNotification,
      testDeviceToken,
      testDeleteToken,
      testBulkNotifications,
      testStressTest,
      testWebSocketConnection,
      checkSystemStatus,
      runFullDiagnostics
    }
  }
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
}
.page-header h1 {
  color: #2c3e50;
  margin-bottom: 8px;
}
.subtitle {
  color: #7f8c8d;
  font-size: 16px;
}
.system-status {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.system-status h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}
.status-icon.online {
  background: #28a745;
}
.status-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #495057;
}
.status-info p {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
}
.test-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.test-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}
.test-group {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}
.test-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.test-group h3 {
  margin-bottom: 12px;
  color: #495057;
  font-size: 16px;
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
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  min-width: 160px;
  justify-content: center;
}
.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.test-btn.primary {
  background: #007bff;
  color: white;
}
.test-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}
.test-btn.secondary {
  background: #6c757d;
  color: white;
}
.test-btn.secondary:hover:not(:disabled) {
  background: #545b62;
}
.test-btn.warning {
  background: #ffc107;
  color: #212529;
}
.test-btn.warning:hover:not(:disabled) {
  background: #e0a800;
}
.test-btn.danger {
  background: #dc3545;
  color: white;
}
.test-btn.danger:hover:not(:disabled) {
  background: #c82333;
}
.config-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.config-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.config-item label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}
.config-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
}
.config-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}
.logs-realtime-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.section-header {
  margin-bottom: 20px;
}
.section-header h2 {
  margin: 0;
  color: #2c3e50;
}
.logs-realtime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 500px;
}
.logs-section {
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.realtime-section {
  height: 100%;
}
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.logs-header h2 {
  margin: 0;
  color: #2c3e50;
}
.logs-actions {
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
.logs-container {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 16px;
}
.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}
.log-entry:last-child {
  border-bottom: none;
}
.log-entry.success {
  border-left: 3px solid #28a745;
  padding-left: 8px;
}
.log-entry.error {
  border-left: 3px solid #dc3545;
  padding-left: 8px;
}
.log-entry.warning {
  border-left: 3px solid #ffc107;
  padding-left: 8px;
}
.log-entry.info {
  border-left: 3px solid #17a2b8;
  padding-left: 8px;
}
.log-timestamp {
  color: #6c757d;
  min-width: 80px;
}
.log-icon {
  width: 16px;
  text-align: center;
}
.log-entry.success .log-icon {
  color: #28a745;
}
.log-entry.error .log-icon {
  color: #dc3545;
}
.log-entry.warning .log-icon {
  color: #ffc107;
}
.log-entry.info .log-icon {
  color: #17a2b8;
}
.log-message {
  flex: 1;
  color: #495057;
}
.log-details {
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}
.log-details pre {
  margin: 0;
  font-size: 11px;
  color: #6c757d;
  white-space: pre-wrap;
  word-break: break-all;
}
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.stats-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}
.stat-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (max-width: 768px) {
  .notification-debug {
    padding: 16px;
  }
  .test-buttons {
    flex-direction: column;
  }
  .test-btn {
    min-width: auto;
  }
  .config-grid {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .logs-realtime-grid {
    grid-template-columns: 1fr;
    height: auto;
    gap: 16px;
  }
  .logs-section {
    height: 300px;
  }
  .realtime-section {
    height: 300px;
  }
  .logs-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .logs-actions {
    justify-content: center;
  }
}
.diagnostic-panel {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
.diagnostic-panel h3 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 16px;
}
.diagnostic-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #6c757d;
}
.diagnostic-content strong {
  color: #495057;
}
.diagnostic-content ul {
  margin: 8px 0;
  padding-left: 20px;
}
.diagnostic-content li {
  margin: 4px 0;
  font-size: 14px;
  color: #6c757d;
}
</style> 