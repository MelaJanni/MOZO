<template>
  <div class="waiter-dashboard">
    <!-- Header con información del mozo -->
    <div class="dashboard-header">
      <div class="waiter-info">
        <div class="waiter-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="waiter-details">
          <h2>{{ authStore.user?.name || 'Mozo' }}</h2>
          <div class="business-selector-container">
            <BusinessSelector 
              @business-changed="onBusinessChanged"
              @businesses-loaded="onBusinessesLoaded"
              ref="businessSelector"
            />
          </div>
        </div>
      </div>

      <div class="dashboard-stats">
        <div class="stat-item">
          <div class="stat-number">{{ assignedTables.length }}</div>
          <div class="stat-label">Mesas asignadas</div>
        </div>
        <div class="stat-item urgent">
          <div class="stat-number">{{ pendingCalls.length }}</div>
          <div class="stat-label">Llamadas pendientes</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ silencedTables.length }}</div>
          <div class="stat-label">Mesas silenciadas</div>
        </div>
      </div>
    </div>

    <!-- Sección principal con dos columnas -->
    <div class="dashboard-content">
      <!-- Columna izquierda: Gestión de mesas -->
      <div class="left-column">
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="fas fa-table"></i>
              Todas
            </h3>
            <div class="section-actions">
              <button 
                v-if="!needsBusiness" 
                @click="showProfilesManager = true" 
                class="action-btn info"
              >
                <i class="fas fa-bookmark"></i>
                Perfiles
              </button>
              <button 
                v-if="!needsBusiness" 
                @click="showTablesManager = true" 
                class="action-btn secondary"
              >
                <i class="fas fa-cog"></i>
                Gestionar Mesas
              </button>
              <button 
                v-if="!needsBusiness" 
                @click="showTableSelector = true" 
                class="action-btn primary"
              >
                <i class="fas fa-plus"></i>
                Activar Mesas
              </button>
              <button @click="refreshTables" class="action-btn" :disabled="loading">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              </button>
              <button @click="createTestCall" class="action-btn warning">
                <i class="fas fa-flask"></i>
                Test Call
              </button>
            </div>
          </div>

          <div class="tables-list">
            <div 
              v-for="table in assignedTables" 
              :key="table.id"
              class="table-item"
              :class="{
                'has-calls': table.pending_calls_count > 0,
                'silenced': table.is_silenced
              }"
            >
              <div class="table-info">
                <div class="table-name">
                  Mesa {{ table.number }}
                  <span v-if="table.pending_calls_count > 0" class="urgency-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                  </span>
                  <span v-else-if="table.is_silenced" class="silence-icon">
                    <i class="fas fa-volume-mute"></i>
                  </span>
                  <span v-else class="ok-icon">
                    <i class="fas fa-check"></i>
                  </span>
                </div>
                <div v-if="table.name && table.name !== `Mesa ${table.number}`" class="table-subtitle">
                  {{ table.name }}
                </div>
              </div>

              <div class="table-actions">
                <button 
                  @click="activateTable(table.id)"
                  class="table-action-btn activate"
                  title="Activar llamadas"
                  v-if="!table.notifications_enabled"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  @click="silenceTable(table.id)"
                  class="table-action-btn silence"
                  title="Silenciar"
                  v-if="!table.is_silenced && table.notifications_enabled"
                >
                  <i class="fas fa-volume-mute"></i>
                </button>
                <button 
                  @click="unsilenceTable(table.id)"
                  class="table-action-btn unsilence"
                  title="Activar"
                  v-if="table.is_silenced"
                >
                  <i class="fas fa-volume-up"></i>
                </button>
                <button 
                  @click="deactivateTable(table.id)"
                  class="table-action-btn deactivate"
                  title="Desactivar"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Mensaje si no hay mesas asignadas -->
            <div v-if="assignedTables.length === 0" class="empty-state">
              <i class="fas fa-table"></i>
              <p v-if="!needsBusiness">No tienes mesas asignadas</p>
              <p v-else>Selecciona un negocio para ver las mesas disponibles</p>
              <button 
                v-if="!needsBusiness" 
                @click="showTableSelector = true" 
                class="btn btn-primary"
              >
                Activar Mesas
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Notificaciones -->
      <div class="right-column">
        <div class="section-card">
          <div class="section-header">
            <h3>Notificaciones:</h3>
          </div>

          <div class="notifications-list" id="calls-container">
            <div 
              v-for="call in pendingCalls" 
              :key="call.id"
              class="notification-item"
              :class="{
                'urgent': call.urgency === 'high',
                'old': call.minutes_ago > 5
              }"
            >
              <div class="notification-info">
                <div class="notification-title">
                  Mesa {{ call.table_number || call.table?.number }}:
                </div>
                <div class="notification-message">
                  {{ call.message || 'Solicita mozo' }}
                </div>
                <div class="notification-time">
                  Hace {{ call.minutes_ago }}m
                  <span v-if="call.urgency === 'high'" class="urgent-badge">URGENTE</span>
                </div>
              </div>

              <div class="notification-actions">
                <button 
                  @click="acknowledgeCall(call.id)"
                  class="notification-action-btn ok"
                  :disabled="processingCall === call.id"
                  title="OK - Confirmar llamada"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  @click="completeCall(call.id)"
                  class="notification-action-btn complete"
                  :disabled="processingCall === call.id"
                  title="Completar atención"
                >
                  <i class="fas fa-check-double"></i>
                </button>
                <button 
                  @click="silenceTableFromCall(call.table.id)"
                  class="notification-action-btn silence"
                  title="Silenciar mesa"
                >
                  <i class="fas fa-volume-mute"></i>
                </button>
              </div>
            </div>

            <!-- Mensaje si no hay notificaciones -->
            <div v-if="pendingCalls.length === 0" class="empty-notifications">
              <i class="fas fa-bell-slash"></i>
              <p v-if="!needsBusiness">No hay llamadas pendientes</p>
              <p v-else>Selecciona un negocio para ver las llamadas</p>
            </div>
          </div>
        </div>

        <!-- Historial de llamadas acknowledged/completed -->
        <div class="section-card">
          <div class="section-header">
            <h3>Historial</h3>
          </div>

          <div class="acknowledged-list">
            <div
              v-for="call in callHistory"
              :key="`hist-${call.id}`"
              class="notification-item acknowledged"
            >
              <div class="notification-info">
                <div class="notification-title">Mesa {{ call.table_number || call.table?.number }}:</div>
                <div class="notification-message">{{ call.message || 'Solicita mozo' }}</div>
                <div class="notification-time">{{ call.acknowledged_at ? 'Atendida' : '' }}</div>
              </div>
              <div class="notification-actions">
                <button
                  @click="completeFromHistory(call.id)"
                  class="notification-action-btn complete"
                  :disabled="processingCall === call.id"
                  title="Completar desde historial"
                >
                  <i class="fas fa-check-double"></i>
                </button>
              </div>
            </div>

            <div v-if="callHistory.length === 0" class="empty-notifications">
              <i class="fas fa-history"></i>
              <p>No hay historial disponible</p>
            </div>
          </div>
        </div>

        <!-- Botón para salir -->
        <div class="section-card">
          <button @click="endShift" class="end-shift-btn">
            <i class="fas fa-sign-out-alt"></i>
            Salir y desactivar notificaciones
          </button>
        </div>
      </div>
    </div>

    <!-- Modal selector de mesas -->
    <TableSelector 
      v-if="showTableSelector && !needsBusiness"
      :available-tables="availableTables"
      :assigned-tables="assignedTables"
      @close="showTableSelector = false"
      @tables-selected="onTablesSelected"
    />

    <!-- Modal gestor de mesas del negocio -->
    <div v-if="showTablesManager && currentBusiness" class="modal-overlay" @click.self="showTablesManager = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-building"></i>
            {{ currentBusiness.name }} - Gestión de Mesas
          </h3>
          <button @click="showTablesManager = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <BusinessTablesManager 
            :business-id="currentBusiness.id"
            :business-name="currentBusiness.name"
            @tables-updated="onTablesUpdated"
          />
        </div>
      </div>
    </div>

    <!-- Modal gestor de perfiles de mesa -->
    <div v-if="showProfilesManager && currentBusiness" class="modal-overlay" @click.self="showProfilesManager = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-bookmark"></i>
            Perfiles de Mesa
          </h3>
          <button @click="showProfilesManager = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <TableProfilesManager 
            :business-id="currentBusiness.id"
            :available-tables="availableTables"
            :assigned-tables="assignedTables"
            @profiles-updated="onProfilesUpdated"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import waiterCallsService from '@/services/waiterCallsService'
import { initializeUnifiedWaiterNotifications } from '@/services/firebaseUnifiedAdapter'
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/notifications'
import TableSelector from '@/components/Waiter/TableSelector.vue'
import BusinessSelector from '@/components/Waiter/BusinessSelector.vue'
import BusinessTablesManager from '@/components/Waiter/BusinessTablesManager.vue'
import TableProfilesManager from '@/components/Waiter/TableProfilesManager.vue'
import DebugApiTester from '@/components/Waiter/DebugApiTester.vue'

// Stores
const router = useRouter()
const authStore = useAuthStore()

// Estado reactivo
const state = reactive({
  assignedTables: [],
  availableTables: [],
  pendingCalls: [],
  callHistory: [],
  silencedTables: [],
  businesses: [],
  currentBusiness: null,
  needsBusiness: false,
  loading: false,
  processingCall: null,
  showTableSelector: false,
  showTablesManager: false,
  showProfilesManager: false
})

// Referencias reactivas para el template  
const availableTables = computed(() => state.availableTables)
const silencedTables = computed(() => state.silencedTables)
const loading = computed(() => state.loading)
const processingCall = computed(() => state.processingCall)
const showTableSelector = computed({
  get: () => state.showTableSelector,
  set: (value) => state.showTableSelector = value
})
const showTablesManager = computed({
  get: () => state.showTablesManager,
  set: (value) => state.showTablesManager = value
})
const showProfilesManager = computed({
  get: () => state.showProfilesManager,
  set: (value) => state.showProfilesManager = value
})

// Referencias
const businessSelector = ref(null)
const businesses = computed(() => state.businesses)
const currentBusiness = computed(() => state.currentBusiness)
const needsBusiness = computed(() => state.needsBusiness)
const businessName = computed(() => state.currentBusiness?.name || 'Seleccionar Negocio')

// Computed properties
// pendingCalls se calcula dinámicamente filtrando por activeCalls (si existe)
const pendingCalls = computed(() => {
  try {
    if (window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls) {
      const activeIds = new Set(Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k)))
      return state.pendingCalls.filter(call => !activeIds.has(String(call.id)))
    }
  } catch (e) {
    // fallback
  }
  return state.pendingCalls
})

// callHistory debe excluir cualquier llamada que siga en pending para evitar mezclas
const callHistory = computed(() => {
  try {
    const pendingIds = new Set((window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls)
      ? Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k))
      : []
    )
    return state.callHistory.filter(c => !pendingIds.has(String(c.id)))
  } catch (e) {
    return state.callHistory
  }
})

// Evitar duplicados en la maquetación: si UltraFast mantiene activeCalls, filtrar
// las pendingCalls que ya estén presentes allí (por id)
const visiblePendingCalls = computed(() => {
  try {
    if (window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls) {
  const activeIds = new Set(Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k)))
  return state.pendingCalls.filter(call => !activeIds.has(String(call.id)))
    }
  } catch (err) {
    // ignore and fallback
  }
  return state.pendingCalls
})

const assignedTables = computed(() => {
  return state.assignedTables
})

// --- Event handlers to let Dashboard own all rendering of realtime calls ---
function addOrUpdatePendingCall(call) {
  const id = String(call.id)
  // Si se añade/actualiza como pending, asegurarnos que no esté en el historial
  state.callHistory = state.callHistory.filter(c => String(c.id) !== id)
  const idx = state.pendingCalls.findIndex(c => String(c.id) === id)
  const now = Date.now()
  const calledAt = call.called_at || call.timestamp || now
  const minutesAgo = Math.max(0, Math.floor((now - calledAt) / 60000))

  const normalized = { ...call, minutes_ago: minutesAgo }

  if (idx === -1) {
    // Insert at top (newest first)
    state.pendingCalls.unshift(normalized)
  } else {
    state.pendingCalls[idx] = { ...state.pendingCalls[idx], ...normalized }
  }
}

function handleUltraFastAddCall(ev) {
  try {
    const call = ev?.detail
    if (!call || !call.id) return
  //console.debug('Dashboard handler ultraFastAddCall', call.id)
  addOrUpdatePendingCall(call)
  // Actualizar contadores/mesas en background para mantener UI consistente
  try {
    // loadAssignedTables está definido más abajo; se ejecutará cuando exista
    if (typeof loadAssignedTables === 'function') {
      loadAssignedTables()
    }
  } catch (e) {
    /* no-op */
  }
  } catch (e) {
    console.warn('Error handling ultraFastAddCall:', e)
  }
}

function handleUpdateCallStatus(ev) {
  try {
    const call = ev?.detail
    if (!call || !call.id) return
    // Update status in pendingCalls if present
    addOrUpdatePendingCall(call)
  } catch (e) {
    console.warn('Error handling updateCallStatus:', e)
  }
}

function handleRemoveCall(ev) {
  try {
    const callId = ev?.detail?.callId
    if (!callId) return
    const id = String(callId)
    state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== id)
  } catch (e) {
    console.warn('Error handling removeCall:', e)
  }
}

function handleClearAllCalls() {
  state.pendingCalls = []
}

function handleCallAcknowledged(ev) {
  try {
    const callId = ev?.detail?.callId
    if (!callId) return
    const idx = state.pendingCalls.findIndex(c => String(c.id) === String(callId))
    if (idx !== -1) {
      // Marcar como acknowledged en pending
      const acknowledgedCall = { ...state.pendingCalls[idx], status: 'acknowledged' }
      // Remover de pending
      state.pendingCalls.splice(idx, 1)
      // Añadir al historial al inicio
      state.callHistory.unshift(acknowledgedCall)
    }
  } catch (e) {
    console.warn('Error handling callAcknowledged:', e)
  }
}

function handleCallMovedToHistory(ev) {
  try {
    const detail = ev?.detail || {}
    const callId = detail.callId || (detail.callData && detail.callData.id)
    const callData = detail.callData || null
    if (!callId) return
    // Ignorar eventos que llevan status 'pending' (no deben ir al historial)
    if (callData && callData.status === 'pending') return

    // Remover de pending si por algún motivo sigue ahí
    state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== String(callId))

    // Si ya está en history, actualizarlo, si no, insertarlo al inicio
    const exists = state.callHistory.find(c => String(c.id) === String(callId))
    if (exists) {
      Object.assign(exists, callData || {})
    } else if (callData) {
      state.callHistory.unshift(callData)
    }
  } catch (err) {
    console.warn('Error manejando callMovedToHistory en Dashboard:', err)
  }
}

/**
 * Completar llamada desde la sección historial.
 * Intentará usar UltraFast si está disponible, si no usará el servicio API.
 */
const completeFromHistory = async (callId) => {
  if (!callId) return
  state.processingCall = callId
  try {
    if (ultraFastNotifications && ultraFastNotifications.completeCall) {
      await ultraFastNotifications.completeCall(callId)
    } else {
      await waiterCallsService.completeCall(callId)
    }

    // Remover de historial local
    state.callHistory = state.callHistory.filter(c => String(c.id) !== String(callId))
    showSuccessToast('Llamada marcada como completada')
  } catch (e) {
    console.error('Error completing call from history:', e)
    showErrorToast('Error completando la llamada')
  } finally {
    state.processingCall = null
  }
}

// Adapter realtime unificado (antes variable se usaba para ultra-fast legacy)
let ultraFastNotifications = null

// ===== MÉTODOS PRINCIPALES =====

/**
 * Cargar datos iniciales
 */
const loadDashboardData = async () => {
  // Si no hay negocio activo, no cargar datos de mesas
  if (state.needsBusiness || !state.currentBusiness) {
    return
  }

  state.loading = true
  try {
    await Promise.all([
      loadAssignedTables(),
      loadPendingCalls(),
      loadAvailableTables(),
      loadSilencedTables()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    showErrorToast('Error cargando datos del dashboard')
  } finally {
    state.loading = false
  }
}

// Inicializar UltraFast y listeners relacionados
onMounted(async () => {
  // Cargar datos iniciales
  await loadDashboardData()

  // (Legacy UltraFast DESACTIVADO) - usamos solo el adapter unified en startRealtimeListeners()

  // Registrar listeners de eventos emitidos por el módulo realtime
  if (!window.__waiterDashboardListenersRegistered) {
    window.addEventListener('ultraFastAddCall', handleUltraFastAddCall)
    window.addEventListener('newWaiterCall', handleUltraFastAddCall)
    window.addEventListener('updateCallStatus', handleUpdateCallStatus)
    window.addEventListener('removeCall', handleRemoveCall)
    window.addEventListener('clearAllCalls', handleClearAllCalls)
    window.addEventListener('callAcknowledged', handleCallAcknowledged)
  // Mantener sincronizado el historial cuando adapters mueven llamadas a history
  window.addEventListener('callMovedToHistory', handleCallMovedToHistory)
    window.__waiterDashboardListenersRegistered = true
  }

  // Exponer helper de debug para inspeccionar desde consola
  try {
    window.debugUltra = () => ({
      pendingCalls: state.pendingCalls.slice(),
      activeCalls: window.ultraFastNotifications ? Array.from(window.ultraFastNotifications.activeCalls.keys()) : []
    })
  } catch (e) {
    /* no-op */
  }
})

onUnmounted(() => {
  try {
    // Sólo eliminar si fuimos quienes los registramos
    if (window.__waiterDashboardListenersRegistered) {
      window.removeEventListener('ultraFastAddCall', handleUltraFastAddCall)
      window.removeEventListener('newWaiterCall', handleUltraFastAddCall)
      window.removeEventListener('updateCallStatus', handleUpdateCallStatus)
      window.removeEventListener('removeCall', handleRemoveCall)
      window.removeEventListener('clearAllCalls', handleClearAllCalls)
      window.removeEventListener('callAcknowledged', handleCallAcknowledged)
  window.removeEventListener('callMovedToHistory', handleCallMovedToHistory)
      window.__waiterDashboardListenersRegistered = false
    }
  } catch (e) {
    console.warn('Error removing ultraFast event listeners:', e)
  }

  try {
    if (ultraFastNotifications && ultraFastNotifications.stopListening) {
      ultraFastNotifications.stopListening()
    }
  } catch (e) {
    console.warn('Error stopping ultraFastNotifications on unmount:', e)
  }
})

/**
 * Cargar mesas asignadas (carga inicial + tiempo real con Firestore)
 */
const loadAssignedTables = async () => {
  if (!state.currentBusiness) {
    // console.log('⚠️ No hay negocio activo, no se pueden cargar mesas')
    return
  }
  
  try {
    // console.log('📋 Cargando mesas asignadas para negocio:', state.currentBusiness.id)
    const response = await waiterCallsService.getWaiterBusinessTables(state.currentBusiness.id)
    
    // console.log('📋 Respuesta completa:', response)
    
    if (response.success) {
      // Filtrar solo las mesas asignadas al mozo actual
      const assignedTables = response.tables?.filter(table => 
        table.status?.assignment === 'assigned_to_me'
      ) || []
      
      state.assignedTables = assignedTables
      // console.log('✅ Mesas asignadas cargadas:', assignedTables.length, assignedTables)
    } else {
      // console.error('❌ Error en respuesta:', response)
    }
  } catch (error) {
    console.error('❌ Error cargando mesas asignadas:', error)
    showErrorToast('Error al cargar las mesas asignadas')
  }
}

/**
 * Cargar llamadas pendientes - delegado a Firebase
 */
const loadPendingCalls = async () => {
  // (UNIFICACIÓN) Ya no se carga historial por API.
  // El historial se construirá SOLO con eventos tiempo real (callMovedToHistory).
  // Esta función se mantiene para no romper llamadas existentes en Promise.all.
  //console.debug('🔄 Pending manejadas por realtime; historial API deshabilitado')
}

/**
 * Cargar mesas disponibles
 */
const loadAvailableTables = async () => {
  // console.log('🔍 Cargando mesas disponibles...')
  try {
    const response = await waiterCallsService.getAvailableTables()
    // console.log('📋 Respuesta mesas disponibles:', response)
    if (response.success) {
      state.availableTables = response.available_tables || []
      // console.log('✅ Mesas disponibles cargadas:', state.availableTables.length, state.availableTables)
    } else {
      // console.error('❌ Error en respuesta mesas disponibles:', response.message)
    }
  } catch (error) {
    console.error('💥 Error loading available tables:', error)
  }
}

/**
 * Cargar mesas silenciadas
 */
const loadSilencedTables = async () => {
  try {
    const response = await waiterCallsService.getSilencedTables()
    if (response.success) {
      state.silencedTables = response.silenced_tables || []
    }
  } catch (error) {
    console.error('Error loading silenced tables:', error)
  }
}

// ===== GESTIÓN DE LLAMADAS =====


// ===== GESTIÓN DE MESAS =====

/**
 * Activar mesa individual
 */
const activateTable = async (tableId) => {
  // console.log('🚀 Dashboard: Iniciando activación de mesa:', tableId)
  try {
    const response = await waiterCallsService.activateTable(tableId)
    // console.log('📊 Dashboard: Respuesta de activación:', response)
    
    if (response.success) {
      // console.log('✅ Dashboard: Mesa activada exitosamente')
      showSuccessToast(response.message || 'Mesa activada')
      // console.log('🔄 Dashboard: Recargando mesas asignadas...')
      await loadAssignedTables()
      
      // Reiniciar monitoreo en tiempo real con las nuevas mesas
      startRealtimeListeners()
    } else {
      // console.error('❌ Dashboard: Error en respuesta:', response.message)
      showErrorToast(response.message || 'Error activando mesa')
    }
  } catch (error) {
    console.error('💥 Dashboard: Error completo activando mesa:', error)
    showErrorToast('Error activando mesa')
  }
}

/**
 * Silenciar mesa individual
 */
const silenceTable = async (tableId) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Silenciar mesa?',
      'La mesa no podrá realizar llamadas durante 30 minutos.',
      'Silenciar',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.silenceTable(tableId, 30)
      if (response.success) {
        showSuccessToast(response.message || 'Mesa silenciada')
        await loadAssignedTables()
        await loadSilencedTables()
      } else {
        showErrorToast(response.message || 'Error silenciando mesa')
      }
    }
  } catch (error) {
    console.error('Error silencing table:', error)
    showErrorToast('Error silenciando mesa')
  }
}

/**
 * Quitar silencio de mesa
 */
const unsilenceTable = async (tableId) => {
  try {
    const response = await waiterCallsService.unsilenceTable(tableId)
    if (response.success) {
      showSuccessToast(response.message || 'Silencio removido')
      await loadAssignedTables()
      await loadSilencedTables()
    } else {
      showErrorToast(response.message || 'Error removiendo silencio')
    }
  } catch (error) {
    console.error('Error unsilencing table:', error)
    showErrorToast('Error removiendo silencio')
  }
}

/**
 * Desactivar mesa individual
 */
const deactivateTable = async (tableId) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Desactivar mesa?',
      'Te desasignarás de esta mesa y no recibirás más llamadas.',
      'Desactivar',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.deactivateTable(tableId)
      if (response.success) {
        showSuccessToast(response.message || 'Mesa desactivada')
        await loadAssignedTables()
        await loadAvailableTables()
        await loadPendingCalls()
        
        // Reiniciar monitoreo en tiempo real tras desactivar mesa
        startRealtimeListeners()
      } else {
        showErrorToast(response.message || 'Error desactivando mesa')
      }
    }
  } catch (error) {
    console.error('Error deactivating table:', error)
    showErrorToast('Error desactivando mesa')
  }
}

/**
 * Silenciar mesa desde llamada
 */
const silenceTableFromCall = async (tableId) => {
  await silenceTable(tableId)
  await loadPendingCalls() // Actualizar llamadas
}

/**
 * Refrescar datos de mesas
 */
const refreshTables = async () => {
  await loadDashboardData()
}

/**
 * Finalizar turno
 */
const endShift = async () => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Finalizar turno?',
      'Te desasignarás de todas las mesas y saldrás de la aplicación.',
      'Finalizar Turno',
      'Cancelar',
      'danger'
    )

    if (confirmed) {
      // Desactivar todas las mesas
      if (state.assignedTables.length > 0) {
        const tableIds = state.assignedTables.map(table => table.id)
        await waiterCallsService.deactivateMultipleTables(tableIds)
      }

      // Parar monitoreo en tiempo real
      stopRealtimeListeners()

      // Cerrar sesión
      await authStore.logout()
      
      showSuccessToast('Turno finalizado correctamente')
      
      // Redirigir al login
      await router.push('/login')
    }
  } catch (error) {
    console.error('Error ending shift:', error)
    showErrorToast('Error finalizando turno')
  }
}

// ===== GESTIÓN DE NEGOCIOS =====

/**
 * Cuando se cargan los negocios
 */
const onBusinessesLoaded = (data) => {
  state.businesses = data.businesses || []
  state.currentBusiness = data.activeBusiness || null
  state.needsBusiness = data.needsBusiness || false

  // console.log('🏢 Negocios cargados:', {
  //   total: state.businesses.length,
  //   current: state.currentBusiness?.name,
  //   needsBusiness: state.needsBusiness
  // })

  // Si hay negocio activo, cargar datos del dashboard
  if (state.currentBusiness && !state.needsBusiness) {
    loadDashboardData()
    // Iniciar monitoreo en tiempo real para las mesas del mozo
    startRealtimeListeners()
  }
}

/**
 * Cuando se cambia de negocio
 */
const onBusinessChanged = (business) => {
  state.currentBusiness = business
  
  // console.log('🏢 Negocio cambiado a:', business.name)
  
  // Limpiar datos anteriores
  state.assignedTables = []
  state.availableTables = []
  state.pendingCalls = []
  state.silencedTables = []
  
  // Cargar nuevos datos
  loadDashboardData()
  
  // Reiniciar monitoreo en tiempo real
  startRealtimeListeners()
}

// ===== EVENT HANDLERS =====

/**
 * Cuando se seleccionan mesas para activar
 */
const onTablesSelected = async (selectedTableIds) => {
  // console.log('🚀 Dashboard: Mesas seleccionadas para activar:', selectedTableIds)
  state.showTableSelector = false
  
  if (selectedTableIds.length === 0) {
    // console.log('⚠️ Dashboard: No se seleccionaron mesas')
    return
  }

  try {
    // console.log('🔄 Dashboard: Iniciando activación múltiple...')
    const response = await waiterCallsService.activateMultipleTables(selectedTableIds)
    // console.log('📊 Dashboard: Respuesta activación múltiple:', response)
    
    if (response.success) {
      console.log('✅ Dashboard: Mesas activadas exitosamente')
      showSuccessToast(response.message || `${response.summary?.successful || selectedTableIds.length} mesas activadas`)
      // console.log('🔄 Dashboard: Recargando datos del dashboard...')
      await loadAssignedTables()
      await loadAvailableTables()
      
      // Reiniciar monitoreo en tiempo real con las nuevas mesas activadas
      startRealtimeListeners()
    } else {
      // console.error('❌ Dashboard: Error en respuesta múltiple:', response.message)
      showErrorToast(response.message || 'Error activando mesas')
    }
  } catch (error) {
    console.error('💥 Dashboard: Error completo activando mesas múltiples:', error)
    showErrorToast('Error activando mesas')
  }
}

/**
 * Cuando se actualizan las mesas desde el gestor
 */
const onTablesUpdated = async (tables) => {
  // console.log('📋 Mesas del negocio actualizadas:', tables.length)
  // Recargar datos del dashboard
  await loadDashboardData()
}

/**
 * Cuando se actualizan los perfiles desde el gestor
 */
const onProfilesUpdated = async () => {
  // console.log('📋 Perfiles actualizados')
  // Recargar datos del dashboard
  await loadDashboardData()
}

// ===== TIEMPO REAL CON FIRESTORE =====

/**
 * Inicializar Ultra Fast Firebase Realtime Database
 */
const startRealtimeListeners = async () => {
  if (!authStore.user || state.needsBusiness) {
    return
  }

  // console.log('⚡ Iniciando UNIFIED Firebase Realtime Database para mozo:', authStore.user.id)
  
  try {
    // Inicializar sistema UNIFIED
    ultraFastNotifications = initializeUnifiedWaiterNotifications(authStore.user.id.toString())
    
    // console.log('✅ UNIFIED Firebase Realtime Database activado')
  } catch (error) {
    console.error('❌ Error configurando Ultra Fast Firebase:', error)
    showErrorToast('Error configurando notificaciones ultra rápidas')
  }
}

/**
 * Parar listeners de tiempo real
 */
const stopRealtimeListeners = async () => {
  // console.log('🛑 Deteniendo UNIFIED Firebase Realtime Database')
  
  try {
    if (ultraFastNotifications) {
      ultraFastNotifications.stopListening()
      ultraFastNotifications = null
    }
    // console.log('✅ UNIFIED Firebase Realtime Database desconectado')
  } catch (error) {
    console.error('❌ Error desconectando Ultra Fast Firebase:', error)
  }
}

// Auto-refresh eliminado - ahora usamos tiempo real

// ===== LIFECYCLE =====

onMounted(async () => {
  // console.log('🏠 Waiter Dashboard mounted')
  
  // Las empresas se cargan automáticamente por el BusinessSelector
  // loadDashboardData se llamará desde onBusinessesLoaded si hay negocio activo
  
  // Escuchar eventos personalizados del Ultra Fast Firebase
  window.addEventListener('newWaiterCall', handleFirebaseNewCall)
  window.addEventListener('updateCallStatus', handleFirebaseCallUpdate)
  window.addEventListener('removeCall', handleFirebaseCallRemove)
  window.addEventListener('clearAllCalls', handleFirebaseClearAllCalls)
})

onUnmounted(() => {
  stopRealtimeListeners()
  window.removeEventListener('newWaiterCall', handleFirebaseNewCall)
  window.removeEventListener('updateCallStatus', handleFirebaseCallUpdate)
  window.removeEventListener('removeCall', handleFirebaseCallRemove)
  window.removeEventListener('clearAllCalls', handleFirebaseClearAllCalls)
})

/**
 * Manejar nueva llamada desde Firebase
 */
const handleFirebaseNewCall = async (event) => {
  console.log('🔔 Nueva llamada desde Firebase:', event.detail)
  // Agregar a la lista local
  state.pendingCalls.unshift(event.detail)
  await loadAssignedTables() // Actualizar contadores
}

/**
 * Manejar actualización de llamada desde Firebase
 */
const handleFirebaseCallUpdate = async (event) => {
  console.log('🔄 Llamada actualizada desde Firebase:', event.detail)
  const callData = event.detail
  const index = state.pendingCalls.findIndex(call => call.id === callData.id)
  if (index !== -1) {
    state.pendingCalls[index] = callData
  }
}

/**
 * Manejar eliminación de llamada desde Firebase
 */
const handleFirebaseCallRemove = async (event) => {
  // console.log('❌ Llamada eliminada desde Firebase:', event.detail)
  const { callId } = event.detail
  state.pendingCalls = state.pendingCalls.filter(call => call.id !== callId)
  await loadAssignedTables() // Actualizar contadores
}

/**
 * Manejar limpieza de todas las llamadas desde Firebase
 */
const handleFirebaseClearAllCalls = async (event) => {
  // console.log('🧹 Limpiando todas las llamadas desde Firebase')
  state.pendingCalls = []
  await loadAssignedTables() // Actualizar contadores
}

// ===== ACCIONES DE LLAMADAS DELEGADAS A FIREBASE =====

/**
 * Reconocer una llamada usando Ultra Fast Firebase
 */
const acknowledgeCall = async (callId) => {
  if (!ultraFastNotifications) {
    showErrorToast('Sistema de notificaciones ultra rápidas no disponible')
    return
  }

  try {
    state.processingCall = callId
    await ultraFastNotifications.acknowledgeCall(callId)
  } catch (error) {
    console.error('Error reconociendo llamada:', error)
    showErrorToast('Error al reconocer la llamada')
  } finally {
    state.processingCall = null
  }
}

/**
 * Completar una llamada usando Ultra Fast Firebase
 */
const completeCall = async (callId) => {
  if (!ultraFastNotifications) {
    showErrorToast('Sistema de notificaciones ultra rápidas no disponible')
    return
  }

  try {
    state.processingCall = callId
    await ultraFastNotifications.completeCall(callId)
  } catch (error) {
    console.error('Error completando llamada:', error)
    showErrorToast('Error al completar la llamada')
  } finally {
    state.processingCall = null
  }
}

/**
 * Crear llamada de prueba
 */
const createTestCall = async () => {
  if (!ultraFastNotifications) {
    showErrorToast('Sistema de notificaciones ultra rápidas no disponible')
    return
  }

  try {
    const testCall = await ultraFastNotifications.createTestCall()
    showSuccessToast(`🧪 Llamada de prueba creada: Mesa ${testCall.table_number}`)
  } catch (error) {
    console.error('Error creando llamada de prueba:', error)
    showErrorToast('Error al crear la llamada de prueba')
  }
}
</script>

<style scoped>
.waiter-dashboard {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-header {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.waiter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.waiter-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.waiter-details h2 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.business-selector-container {
  margin-top: 8px;
  max-width: 280px;
}

.dashboard-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 4px;
}

.stat-item.urgent .stat-number {
  color: #dc3545;
}

.stat-label {
  font-size: 11px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
}

.section-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.action-btn.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.action-btn.primary:hover {
  background: #0056b3;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.action-btn.secondary:hover {
  background: #545b62;
}

.action-btn.info {
  background: #17a2b8;
  color: white;
  border-color: #17a2b8;
}

.action-btn.info:hover {
  background: #138496;
}

.action-btn.warning {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.action-btn.warning:hover {
  background: #f57c00;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tables-list {
  max-height: 400px;
  overflow-y: auto;
}

.table-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.table-item.has-calls {
  border-color: #dc3545;
  background: #fff5f5;
  animation: pulse-border 2s infinite;
}

.table-item.silenced {
  border-color: #6c757d;
  background: #f6f6f6;
  opacity: 0.8;
}

.table-info {
  flex: 1;
}

.table-name {
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.table-subtitle {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.urgency-icon {
  color: #dc3545;
}

.silence-icon {
  color: #6c757d;
}

.ok-icon {
  color: #28a745;
}

.table-actions {
  display: flex;
  gap: 4px;
}

.table-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.table-action-btn.activate {
  background: #28a745;
  color: white;
}

.table-action-btn.silence {
  background: #ffc107;
  color: #212529;
}

.table-action-btn.unsilence {
  background: #28a745;
  color: white;
}

.table-action-btn.deactivate {
  background: #dc3545;
  color: white;
}

.table-action-btn:hover {
  transform: scale(1.05);
}

.notifications-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.notification-item.urgent {
  border-color: #dc3545;
  background: #fff5f5;
  animation: pulse-border 2s infinite;
}

.notification-item.old {
  border-color: #fd7e14;
  background: #fff8f0;
}

.notification-info {
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.notification-message {
  font-size: 13px;
  color: #495057;
  margin: 4px 0;
}

.notification-time {
  font-size: 11px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 8px;
}

.urgent-badge {
  background: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
}

.notification-actions {
  display: flex;
  gap: 4px;
}

.notification-action-btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.notification-action-btn.ok {
  background: #007bff;
  color: white;
}

.notification-action-btn.complete {
  background: #28a745;
  color: white;
}

.notification-action-btn.silence {
  background: #6c757d;
  color: white;
  flex: none;
  width: 32px;
}

.notification-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.notification-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.end-shift-btn {
  width: 100%;
  padding: 12px;
  border: 2px solid #dc3545;
  background: white;
  color: #dc3545;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.end-shift-btn:hover {
  background: #dc3545;
  color: white;
}

.empty-state,
.empty-notifications {
  text-align: center;
  padding: 32px 16px;
  color: #6c757d;
}

.empty-state i,
.empty-notifications i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p,
.empty-notifications p {
  margin-bottom: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

@keyframes pulse-border {
  0% { border-color: #dc3545; }
  50% { border-color: rgba(220, 53, 69, 0.5); }
  100% { border-color: #dc3545; }
}

@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .dashboard-stats {
    justify-content: center;
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content.large {
  width: 95vw;
  height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 16px;
}

.close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  max-height: calc(90vh - 80px);
}

@media (max-width: 768px) {
  .waiter-dashboard {
    padding: 12px;
  }
  
  .section-card {
    padding: 16px;
  }
  
  .dashboard-stats {
    gap: 16px;
  }
  
  .modal-content.large {
    width: 95vw;
    height: 95vh;
  }
  
  .modal-body {
    max-height: calc(95vh - 80px);
  }
}
</style>