<template>
  <div class="debug-container">
    <button 
      class="debug-toggle" 
      @click="togglePanel"
      :class="{ active: isOpen }"
      title="Debug Panel"
    >
      <i class="bi bi-bug-fill"></i>
      <span v-if="errorCount > 0" class="error-badge">{{ errorCount }}</span>
    </button>
    <div v-if="isOpen" class="debug-panel">
      <div class="debug-header">
        <h3>Debug Panel</h3>
        <div class="debug-controls">
          <button @click="clearLogs" class="btn-clear">
            <i class="bi bi-trash"></i> Limpiar
          </button>
          <button @click="togglePanel" class="btn-close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      <div class="debug-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-button"
        >
          {{ tab.name }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>
      <div class="debug-content">
        <div v-if="activeTab === 'logs'" class="tab-content">
          <div class="log-filters">
            <label v-for="level in logLevels" :key="level">
              <input 
                type="checkbox" 
                v-model="logFilters[level]" 
                :checked="logFilters[level]"
              >
              {{ level.toUpperCase() }}
            </label>
          </div>
          <div class="logs-container">
            <div 
              v-for="log in filteredLogs" 
              :key="log.id"
              :class="['log-entry', `log-${log.level}`]"
            >
              <div class="log-header">
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-source">{{ log.source }}</span>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.data" class="log-data">
                <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'errors'" class="tab-content">
          <div class="errors-container">
            <div 
              v-for="error in axiosErrors" 
              :key="error.id"
              class="error-entry"
            >
              <div class="error-header">
                <span class="error-time">{{ formatTime(error.timestamp) }}</span>
                <span class="error-status">{{ error.status }}</span>
              </div>
              <div class="error-url">{{ error.url }}</div>
              <div class="error-message">{{ error.message }}</div>
              <div v-if="error.response" class="error-response">
                <strong>Response:</strong>
                <pre>{{ JSON.stringify(error.response, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'stores'" class="tab-content">
          <div class="stores-container">
            <div v-for="store in storeStates" :key="store.name" class="store-section">
              <h4>{{ store.name }}</h4>
              <pre>{{ JSON.stringify(store.state, null, 2) }}</pre>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'network'" class="tab-content">
          <div class="network-stats">
            <div class="stat-item">
              <strong>Requests:</strong> {{ networkStats.requests }}
            </div>
            <div class="stat-item">
              <strong>Errors:</strong> {{ networkStats.errors }}
            </div>
            <div class="stat-item">
              <strong>Success Rate:</strong> {{ successRate }}%
            </div>
          </div>
          <div class="recent-requests">
            <h4>Requests Recientes</h4>
            <div 
              v-for="req in recentRequests" 
              :key="req.id"
              :class="['request-entry', `status-${req.status}`]"
            >
              <div class="request-header">
                <span class="request-method">{{ req.method }}</span>
                <span class="request-status">{{ req.status }}</span>
                <span class="request-time">{{ req.duration }}ms</span>
              </div>
              <div class="request-url">{{ req.url }}</div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'system'" class="tab-content">
          <div class="system-info">
            <div class="info-item">
              <strong>User Agent:</strong> {{ systemInfo.userAgent }}
            </div>
            <div class="info-item">
              <strong>Platform:</strong> {{ systemInfo.platform }}
            </div>
            <div class="info-item">
              <strong>Screen:</strong> {{ systemInfo.screen }}
            </div>
            <div class="info-item">
              <strong>Memory:</strong> {{ systemInfo.memory }}
            </div>
            <div class="info-item">
              <strong>Uptime:</strong> {{ systemInfo.uptime }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWaiterStore } from '@/stores/waiter'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'
import { useUiStore } from '@/stores/ui'
const authStore = useAuthStore()
const waiterStore = useWaiterStore()
const adminStore = useAdminStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const isOpen = ref(false)
const activeTab = ref('logs')
const logs = ref([])
const logLevels = ['info', 'warn', 'error', 'debug']
const logFilters = ref({
  info: true,
  warn: true,
  error: true,
  debug: true
})
const axiosErrors = ref([])
const recentRequests = ref([])
const networkStats = ref({
  requests: 0,
  errors: 0
})
const systemInfo = ref({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  screen: `${window.screen.width}x${window.screen.height}`,
  memory: 'N/A',
  uptime: '0s'
})
const tabs = computed(() => [
  { id: 'logs', name: 'Logs', badge: logs.value.length },
  { id: 'errors', name: 'Errores', badge: axiosErrors.value.length },
  { id: 'stores', name: 'Stores' },
  { id: 'network', name: 'Red', badge: networkStats.value.errors },
  { id: 'system', name: 'Sistema' }
])
const filteredLogs = computed(() => {
  return logs.value.filter(log => logFilters.value[log.level])
})
const errorCount = computed(() => {
  return axiosErrors.value.length + logs.value.filter(log => log.level === 'error').length
})
const successRate = computed(() => {
  if (networkStats.value.requests === 0) return 100
  return Math.round(((networkStats.value.requests - networkStats.value.errors) / networkStats.value.requests) * 100)
})
const storeStates = computed(() => [
  { name: 'Auth', state: authStore.$state },
  { name: 'Waiter', state: waiterStore.$state },
  { name: 'Admin', state: adminStore.$state },
  { name: 'User', state: userStore.$state },
  { name: 'UI', state: uiStore.$state }
])
const togglePanel = () => {
  isOpen.value = !isOpen.value
}
const clearLogs = () => {
  logs.value = []
  axiosErrors.value = []
  recentRequests.value = []
  networkStats.value = { requests: 0, errors: 0 }
}
const addLog = (level, message, source = 'App', data = null) => {
  logs.value.unshift({
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    level,
    message,
    source,
    data
  })
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}
const addAxiosError = (error) => {
  const errorEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    status: error.response?.status || 'NETWORK',
    url: error.config?.url || 'Unknown',
    message: error.message,
    response: error.response?.data
  }
  axiosErrors.value.unshift(errorEntry)
  networkStats.value.errors++
  if (axiosErrors.value.length > 50) {
    axiosErrors.value = axiosErrors.value.slice(0, 50)
  }
}
const addRequest = (config, response, duration) => {
  const requestEntry = {
    id: Date.now() + Math.random(),
    method: config.method?.toUpperCase() || 'GET',
    url: config.url,
    status: response?.status || 'ERROR',
    duration
  }
  recentRequests.value.unshift(requestEntry)
  networkStats.value.requests++
  if (recentRequests.value.length > 20) {
    recentRequests.value = recentRequests.value.slice(0, 20)
  }
}
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString()
}
const updateSystemInfo = () => {
  if (navigator.memory) {
    const used = Math.round(navigator.memory.usedJSHeapSize / 1024 / 1024)
    const total = Math.round(navigator.memory.totalJSHeapSize / 1024 / 1024)
    systemInfo.value.memory = `${used}MB / ${total}MB`
  }
  const uptime = Math.floor((Date.now() - window.performance.timing.navigationStart) / 1000)
  const minutes = Math.floor(uptime / 60)
  const seconds = uptime % 60
  systemInfo.value.uptime = `${minutes}m ${seconds}s`
}
const setupAxiosInterceptors = () => {
  import('@/services/api').then(({ default: api }) => {
    api.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() }
        return config
      },
      (error) => {
        addAxiosError(error)
        return Promise.reject(error)
      }
    )
    api.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime
        addRequest(response.config, response, duration)
        return response
      },
      (error) => {
        const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0
        addRequest(error.config, error.response, duration)
        addAxiosError(error)
        return Promise.reject(error)
      }
    )
  }).catch(() => {
    if (window.axios) {
      window.axios.interceptors.request.use(
        (config) => {
          config.metadata = { startTime: Date.now() }
          return config
        },
        (error) => {
          addAxiosError(error)
          return Promise.reject(error)
        }
      )
      window.axios.interceptors.response.use(
        (response) => {
          const duration = Date.now() - response.config.metadata.startTime
          addRequest(response.config, response, duration)
          return response
        },
        (error) => {
          const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0
          addRequest(error.config, error.response, duration)
          addAxiosError(error)
          return Promise.reject(error)
        }
      )
    }
  })
}
const setupConsoleInterceptors = () => {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const originalDebug = console.debug
  console.log = (...args) => {
    originalLog.apply(console, args)
    addLog('info', args.join(' '), 'Console')
  }
  console.warn = (...args) => {
    originalWarn.apply(console, args)
    addLog('warn', args.join(' '), 'Console')
  }
  console.error = (...args) => {
    originalError.apply(console, args)
    addLog('error', args.join(' '), 'Console')
  }
  console.debug = (...args) => {
    originalDebug.apply(console, args)
    addLog('debug', args.join(' '), 'Console')
  }
}
const setupErrorHandlers = () => {
  window.addEventListener('error', (event) => {
    addLog('error', `${event.message} at ${event.filename}:${event.lineno}`, 'Global Error')
  })
  window.addEventListener('unhandledrejection', (event) => {
    addLog('error', `Unhandled Promise Rejection: ${event.reason}`, 'Global Error')
  })
}
onMounted(() => {
  setupAxiosInterceptors()
  setupConsoleInterceptors()
  setupErrorHandlers()
  const systemInterval = setInterval(updateSystemInfo, 5000)
  addLog('info', 'Debug Panel iniciado', 'Debug Panel')
  onUnmounted(() => {
    clearInterval(systemInterval)
  })
})
window.debugPanel = {
  addLog,
  addAxiosError,
  addRequest,
  togglePanel: () => isOpen.value = !isOpen.value
}
</script>
<style scoped>
.debug-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
.debug-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2c3e50;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  position: relative;
  transition: all 0.3s ease;
}
.debug-toggle:hover {
  background: #34495e;
  transform: scale(1.1);
}
.debug-toggle.active {
  background: #e74c3c;
}
.error-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}
.debug-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 600px;
  height: 500px;
  background: #1a1a1a;
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.debug-header {
  background: #2c3e50;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #34495e;
}
.debug-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
}
.debug-controls {
  display: flex;
  gap: 8px;
}
.btn-clear, .btn-close {
  background: #34495e;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}
.btn-clear:hover, .btn-close:hover {
  background: #4a5f7a;
}
.debug-tabs {
  display: flex;
  background: #2c3e50;
  border-bottom: 1px solid #34495e;
}
.tab-button {
  background: none;
  color: #bdc3c7;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 11px;
  position: relative;
  flex: 1;
}
.tab-button:hover {
  background: #34495e;
}
.tab-button.active {
  background: #1a1a1a;
  color: #fff;
}
.tab-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}
.debug-content {
  flex: 1;
  overflow: hidden;
}
.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}
.log-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #34495e;
}
.log-filters label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  cursor: pointer;
}
.logs-container {
  max-height: 300px;
  overflow-y: auto;
}
.log-entry {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid;
}
.log-info {
  background: #2c3e50;
  border-left-color: #3498db;
}
.log-warn {
  background: #2c3e50;
  border-left-color: #f39c12;
}
.log-error {
  background: #2c3e50;
  border-left-color: #e74c3c;
}
.log-debug {
  background: #2c3e50;
  border-left-color: #95a5a6;
}
.log-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 10px;
}
.log-time {
  color: #95a5a6;
}
.log-level {
  font-weight: bold;
}
.log-source {
  color: #3498db;
}
.log-message {
  font-size: 11px;
  margin-bottom: 4px;
}
.log-data {
  background: #34495e;
  padding: 4px;
  border-radius: 2px;
  font-size: 10px;
  max-height: 100px;
  overflow-y: auto;
}
.errors-container {
  max-height: 400px;
  overflow-y: auto;
}
.error-entry {
  background: #2c3e50;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
}
.error-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.error-time {
  color: #95a5a6;
  font-size: 10px;
}
.error-status {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}
.error-url {
  color: #3498db;
  font-size: 11px;
  margin-bottom: 4px;
  word-break: break-all;
}
.error-message {
  font-size: 11px;
  margin-bottom: 8px;
}
.error-response {
  background: #34495e;
  padding: 8px;
  border-radius: 2px;
  font-size: 10px;
  max-height: 100px;
  overflow-y: auto;
}
.stores-container {
  max-height: 400px;
  overflow-y: auto;
}
.store-section {
  margin-bottom: 16px;
}
.store-section h4 {
  margin: 0 0 8px 0;
  color: #3498db;
  font-size: 12px;
}
.store-section pre {
  background: #34495e;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 150px;
  overflow-y: auto;
  margin: 0;
}
.network-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #34495e;
}
.stat-item {
  font-size: 11px;
}
.recent-requests {
  max-height: 300px;
  overflow-y: auto;
}
.recent-requests h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #3498db;
}
.request-entry {
  background: #2c3e50;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid;
}
.status-200, .status-201, .status-204 {
  border-left-color: #27ae60;
}
.status-400, .status-401, .status-403, .status-404, .status-500 {
  border-left-color: #e74c3c;
}
.request-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.request-method {
  background: #34495e;
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}
.request-status {
  font-size: 10px;
  font-weight: bold;
}
.request-time {
  color: #95a5a6;
  font-size: 10px;
}
.request-url {
  font-size: 11px;
  color: #3498db;
  word-break: break-all;
}
.system-info {
  max-height: 400px;
  overflow-y: auto;
}
.info-item {
  margin-bottom: 8px;
  font-size: 11px;
}
.info-item strong {
  color: #3498db;
}
.tab-content::-webkit-scrollbar,
.logs-container::-webkit-scrollbar,
.errors-container::-webkit-scrollbar,
.stores-container::-webkit-scrollbar,
.recent-requests::-webkit-scrollbar,
.system-info::-webkit-scrollbar {
  width: 6px;
}
.tab-content::-webkit-scrollbar-track,
.logs-container::-webkit-scrollbar-track,
.errors-container::-webkit-scrollbar-track,
.stores-container::-webkit-scrollbar-track,
.recent-requests::-webkit-scrollbar-track,
.system-info::-webkit-scrollbar-track {
  background: #2c3e50;
}
.tab-content::-webkit-scrollbar-thumb,
.logs-container::-webkit-scrollbar-thumb,
.errors-container::-webkit-scrollbar-thumb,
.stores-container::-webkit-scrollbar-thumb,
.recent-requests::-webkit-scrollbar-thumb,
.system-info::-webkit-scrollbar-thumb {
  background: #34495e;
  border-radius: 3px;
}
.tab-content::-webkit-scrollbar-thumb:hover,
.logs-container::-webkit-scrollbar-thumb:hover,
.errors-container::-webkit-scrollbar-thumb:hover,
.stores-container::-webkit-scrollbar-thumb:hover,
.recent-requests::-webkit-scrollbar-thumb:hover,
.system-info::-webkit-scrollbar-thumb:hover {
  background: #4a5f7a;
}
</style> 