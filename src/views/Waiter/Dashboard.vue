<template>
  <!-- Wrapper agregado para asegurar un único nodo raíz (necesario para <Transition>) -->
  <div class="waiter-dashboard-root">
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
          <div class="stat-number">{{ pendingCallsWithSpamInfo.length }}</div>
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
                @click="showBlockedIpsManager = true" 
                class="action-btn danger"
              >
                <i class="fas fa-shield-alt"></i>
                Anti-Spam
              </button>
              <button 
                v-if="!needsBusiness" 
                @click="openIpDebugPanel" 
                class="action-btn secondary"
              >
                <i class="fas fa-bug"></i>
                IP Debug
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
                  <span
                    v-else-if="table.is_silenced"
                    class="silence-icon"
                    :title="table.silence?.remaining_time || 'Mesa silenciada'"
                  >
                    <i class="fas fa-volume-mute"></i>
                  </span>
                  <span v-else class="ok-icon">
                    <i class="fas fa-check"></i>
                  </span>
                </div>
                <div v-if="table.name && table.name !== `Mesa ${table.number}`" class="table-subtitle">
                  {{ table.name }}
                </div>
                <div 
                  v-if="table.is_silenced" 
                  class="table-silenced-info"
                >
                  <i class="fas fa-volume-mute"></i>
                  <span>
                    {{ table.silence?.remaining_time || (table.silence?.reason === 'manual' ? 'Silenciada manualmente' : 'Mesa silenciada') }}
                  </span>
                </div>
              </div>

              <div class="table-actions">
                <button 
                  @click="activateTable(table.id)"
                  class="table-action-btn activate"
                  title="Activar llamadas"
                  v-if="table.actions_available?.can_activate"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  @click="silenceTable(table.id)"
                  class="table-action-btn silence"
                  title="Silenciar"
                  v-if="table.actions_available?.can_silence"
                >
                  <i class="fas fa-volume-mute"></i>
                </button>
                <button 
                  @click="unsilenceTable(table.id)"
                  class="table-action-btn unsilence"
                  title="Quitar silencio"
                  v-if="table.actions_available?.can_unsilence"
                >
                  <i class="fas fa-volume-up"></i>
                </button>
                <button 
                  @click="deactivateTable(table.id)"
                  class="table-action-btn deactivate"
                  title="Desactivar"
                  v-if="table.actions_available?.can_deactivate"
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
              v-for="call in pendingCallsWithSpamInfo" 
              :key="call.id"
              class="notification-item"
              :class="{
                'urgent': call.urgency === 'high',
                'old': call.minutes_ago > 5,
                'potential-spam': call.is_potential_spam
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
                  <span v-if="call.is_potential_spam" class="spam-badge">
                    POSIBLE SPAM ({{ call.ip_call_count }}x)
                  </span>
                </div>
                <div v-if="call.client_info?.ip_address" class="client-info">
                  IP: {{ call.client_info.ip_address }}
                  <span v-if="call.client_info.source_type" class="source-badge">
                    {{ call.client_info.source_type }}
                  </span>
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
                <button 
                  v-if="call.client_info?.ip_address"
                  @click="blockIpForSpam(call)"
                  class="notification-action-btn block-ip"
                  :disabled="processingCall === call.id"
                  title="Bloquear IP por spam"
                >
                  <i class="fas fa-ban"></i>
                </button>
              </div>
            </div>

            <!-- Mensaje si no hay notificaciones -->
            <div v-if="pendingCallsWithSpamInfo.length === 0" class="empty-notifications">
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

        <!-- IPs Bloqueadas -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="fas fa-ban"></i>
              IPs Bloqueadas
            </h3>
            <button @click="loadBlockedIps" class="action-btn" :disabled="loading" title="Actualizar">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            </button>
          </div>

          <div class="blocked-ips-list-sidebar">
            <div
              v-for="blockedIp in blockedIps"
              :key="blockedIp.ip_address"
              class="blocked-ip-item"
            >
              <div class="blocked-ip-info">
                <div class="blocked-ip-address">
                  <i class="fas fa-shield-alt"></i>
                  {{ blockedIp.ip_address }}
                </div>
                <div class="blocked-ip-details">
                  <div class="blocked-detail">
                    <strong>Razón:</strong> {{ blockedIp.reason }}
                  </div>
                  <div class="blocked-detail">
                    <strong>Por:</strong> {{ blockedIp.blocked_by }}
                  </div>
                  <div class="blocked-detail">
                    <strong>Fecha:</strong> {{ formatBlockDate(blockedIp.blocked_at) }}
                  </div>
                  <div v-if="blockedIp.expires_at" class="blocked-detail expires">
                    <strong>Expira:</strong> {{ formatBlockDate(blockedIp.expires_at) }}
                  </div>
                  <div v-else class="blocked-detail permanent">
                    <strong>Duración:</strong> Permanente
                  </div>
                  <div v-if="blockedIp.notes" class="blocked-detail notes">
                    <strong>Notas:</strong> {{ blockedIp.notes }}
                  </div>
                </div>
              </div>

              <div class="blocked-ip-actions">
                <button
                  @click="unblockIp(blockedIp.ip_address)"
                  class="blocked-action-btn unblock"
                  title="Desbloquear IP"
                >
                  <i class="fas fa-unlock"></i>
                  Desbloquear
                </button>
              </div>
            </div>

            <div v-if="blockedIps.length === 0" class="empty-notifications">
              <i class="fas fa-shield-check"></i>
              <p v-if="!needsBusiness">No hay IPs bloqueadas</p>
              <p v-else>Selecciona un negocio para ver IPs bloqueadas</p>
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

    <!-- Modal gestor de IPs bloqueadas -->
    <div v-if="showBlockedIpsManager && currentBusiness" class="modal-overlay" @click.self="showBlockedIpsManager = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-shield-alt"></i>
            Sistema Anti-Spam - IPs Bloqueadas
          </h3>
          <button @click="showBlockedIpsManager = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="anti-spam-section">
            <!-- Estadísticas de spam -->
            <div v-if="suspiciousIps.length > 0" class="spam-alerts">
              <h4><i class="fas fa-exclamation-triangle"></i> IPs Sospechosas Activas</h4>
              <div v-for="ipData in suspiciousIps" :key="ipData.ip" class="suspicious-ip-card">
                <div class="ip-info">
                  <strong>{{ ipData.ip }}</strong>
                  <span class="call-count">{{ ipData.count }} llamadas en 10 min</span>
                </div>
                <div class="ip-calls">
                  <div v-for="call in ipData.calls" :key="call.id" class="mini-call">
                    Mesa {{ call.table_number }} - {{ call.message }}
                  </div>
                </div>
                <button 
                  @click="blockIpForSpam(ipData.calls[0])" 
                  class="btn-block-ip"
                >
                  <i class="fas fa-ban"></i> Bloquear IP
                </button>
              </div>
            </div>

            <!-- Lista de IPs bloqueadas -->
            <div class="blocked-ips-list">
              <div class="section-header">
                <h4><i class="fas fa-ban"></i> IPs Bloqueadas</h4>
                <button @click="loadBlockedIps" class="btn btn-secondary btn-sm">
                  <i class="fas fa-sync"></i> Actualizar
                </button>
              </div>

              <div v-if="blockedIps.length === 0" class="empty-state">
                <i class="fas fa-shield-check"></i>
                <p>No hay IPs bloqueadas actualmente</p>
              </div>

              <div v-else class="blocked-ip-cards">
                <div v-for="blockedIp in blockedIps" :key="blockedIp.ip_address" class="blocked-ip-card">
                  <div class="blocked-ip-header">
                    <div class="ip-address">{{ blockedIp.ip_address }}</div>
                    <div class="block-reason">{{ blockedIp.reason }}</div>
                  </div>
                  <div class="blocked-ip-details">
                    <div class="detail-item">
                      <strong>Bloqueada por:</strong> {{ blockedIp.blocked_by }}
                    </div>
                    <div class="detail-item">
                      <strong>Fecha:</strong> {{ new Date(blockedIp.blocked_at).toLocaleString() }}
                    </div>
                    <div v-if="blockedIp.expires_at" class="detail-item">
                      <strong>Expira:</strong> {{ new Date(blockedIp.expires_at).toLocaleString() }}
                    </div>
                    <div v-else class="detail-item">
                      <strong>Duración:</strong> Permanente
                    </div>
                    <div v-if="blockedIp.notes" class="detail-item">
                      <strong>Notas:</strong> {{ blockedIp.notes }}
                    </div>
                  </div>
                  <div class="blocked-ip-actions">
                    <button 
                      @click="unblockIp(blockedIp.ip_address)"
                      class="btn btn-warning btn-sm"
                    >
                      <i class="fas fa-unlock"></i> Desbloquear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    
    <!-- Modal Debug de IP (mantenido fuera del contenedor interno pero dentro del root único) -->
    <div v-if="showIpDebugPanel" class="modal-overlay" @click.self="showIpDebugPanel = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-bug"></i>
            Debug de IP (Anti-Spam)
          </h3>
          <button @click="showIpDebugPanel = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body ip-debug-body">
          <div class="ip-debug-form">
            <label>IP a diagnosticar</label>
            <input 
              v-model="ipDebugInput" 
              type="text" 
              placeholder="Ej: 190.123.45.67" 
              class="ip-input"
            />
            <div class="actions">
              <button 
                class="btn btn-primary" 
                @click="runIpDebug" 
                :disabled="!ipDebugInput || ipDebugLoading"
              >
                <i class="fas fa-search" v-if="!ipDebugLoading"></i>
                <i class="fas fa-spinner fa-spin" v-else></i>
                Diagnosticar
              </button>
              <button 
                class="btn btn-warning" 
                v-if="ipDebugResult?.active_locks?.length" 
                @click="forceUnblockFromDebug" 
                :disabled="ipDebugLoading"
              >
                <i class="fas fa-unlock"></i>
                Force Unblock ({{ ipDebugResult.active_locks.length }})
              </button>
            </div>
            <div v-if="ipDebugError" class="error-box">
              <i class="fas fa-exclamation-triangle"></i> {{ ipDebugError }}
            </div>
          </div>
          <div v-if="ipDebugResult" class="ip-debug-result">
            <h4>Resultado:</h4>
            <div class="summary-line">
              <strong>IP:</strong> {{ ipDebugResult.ip_address }}
              <strong style="margin-left:16px;">Locks activos:</strong> {{ ipDebugResult.active_locks?.length || 0 }}
              <strong style="margin-left:16px;">Total registros:</strong> {{ ipDebugResult.all_locks?.length || 0 }}
            </div>
            <div class="locks-section" v-if="ipDebugResult.active_locks?.length">
              <h5>Locks Activos</h5>
              <ul>
                <li v-for="lock in ipDebugResult.active_locks" :key="lock.id">
                  ID {{ lock.id }} - expira: {{ lock.expires_at || lock.unblock_at || 'N/D' }} - razón: {{ lock.reason }}
                </li>
              </ul>
            </div>
            <div class="locks-section" v-if="ipDebugResult.inactive_locks?.length">
              <h5>Locks Inactivos</h5>
              <ul>
                <li v-for="lock in ipDebugResult.inactive_locks" :key="'i-'+lock.id">
                  ID {{ lock.id }} - desbloqueado: {{ lock.unblocked_at || 'N/D' }} - razón: {{ lock.reason }}
                </li>
              </ul>
            </div>
            <details class="raw-json">
              <summary>Ver JSON crudo</summary>
              <pre>{{ ipDebugResult }}</pre>
            </details>
          </div>
          <div v-else-if="!ipDebugLoading" class="hint-box">
            Ingrese una IP y presione Diagnosticar para ver su estado en el sistema anti-spam.
          </div>
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
  showProfilesManager: false,
  showBlockedIpsManager: false,
  blockedIps: [],
  showIpDebugPanel: false,
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
const showBlockedIpsManager = computed({
  get: () => state.showBlockedIpsManager,
  set: (value) => state.showBlockedIpsManager = value
})
const showIpDebugPanel = computed({
  get: () => state.showIpDebugPanel,
  set: (value) => state.showIpDebugPanel = value
})

// Estado debug IP
const ipDebugInput = ref('')
const ipDebugLoading = ref(false)
const ipDebugResult = ref(null)
const ipDebugError = ref(null)

// Referencias reactivas para el template
const blockedIps = computed(() => state.blockedIps || [])

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
  return state.assignedTables.map(table => {
    // pending desde respuesta directa si existe
    const apiPending = table.calls?.pending_count
    // fallback: contar pendingCalls locales
    const localPending = state.pendingCalls.filter(call => 
      call.table_id === table.id || call.table?.id === table.id
    ).length
    return {
      ...table,
      is_silenced: table.silence?.is_silenced ?? table.is_silenced ?? false,
      pending_calls_count: typeof apiPending === 'number' ? apiPending : localPending
    }
  })
})

// Computed para detectar IPs sospechosas (más de 2 llamadas en 10 minutos)
const ipCallCounts = computed(() => {
  if (!state.pendingCalls || !Array.isArray(state.pendingCalls)) {
    return {}
  }
  
  const now = Date.now()
  const tenMinutesAgo = now - (10 * 60 * 1000)
  const ipCounts = {}
  
  state.pendingCalls.forEach(call => {
    const ip = call.client_info?.ip_address
    if (!ip || !call.called_at || call.called_at < tenMinutesAgo) return
    
    if (!ipCounts[ip]) {
      ipCounts[ip] = { count: 0, calls: [] }
    }
    ipCounts[ip].count++
    ipCounts[ip].calls.push(call)
  })
  
  return ipCounts
})

const suspiciousIps = computed(() => {
  return Object.entries(ipCallCounts.value)
    .filter(([ip, data]) => data.count >= 2)
    .map(([ip, data]) => ({ ip, ...data }))
})

// Computed para marcar llamadas como potencial spam
const pendingCallsWithSpamInfo = computed(() => {
  if (!state.pendingCalls || !Array.isArray(state.pendingCalls)) {
    return []
  }
  
  return state.pendingCalls.map(call => {
    const ip = call.client_info?.ip_address
    const ipData = ipCallCounts.value[ip]
    
    return {
      ...call,
      is_potential_spam: ipData && ipData.count >= 2,
      ip_call_count: ipData ? ipData.count : 1
    }
  })
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
  console.debug('Dashboard handler ultraFastAddCall', call.id, call)
  addOrUpdatePendingCall(call)
  // Los contadores se actualizan automáticamente via computed properties
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
      loadSilencedTables(),
      loadBlockedIps()
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
    window.addEventListener('newWaiterCall', handleUltraFastAddCall)
    window.addEventListener('updateCallStatus', handleUpdateCallStatus)
    window.addEventListener('removeCall', handleRemoveCall)
    window.addEventListener('clearAllCalls', handleClearAllCalls)
    window.addEventListener('callAcknowledged', handleCallAcknowledged)
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

// Abrir selector de mesas: refrescar la lista antes de mostrar
watch(() => state.showTableSelector, async (open) => {
  if (open && state.currentBusiness && !state.needsBusiness) {
    await loadAvailableTables()
  }
})

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
})

onUnmounted(() => {
  stopRealtimeListeners()
})


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

// ===== FUNCIONES ANTI-SPAM =====

/**
 * Bloquear IP por spam
 */
const blockIpForSpam = async (call) => {
  if (!call.client_info?.ip_address) {
    showErrorToast('No se puede bloquear: IP no disponible')
    return
  }

  try {
    const confirmed = await showConfirmDialog(
      '¿Bloquear IP por spam?',
      `Se bloqueará la IP ${call.client_info.ip_address} por 24 horas. Esta IP no podrá realizar más llamadas.`,
      'Bloquear IP',
      'Cancelar',
      'error'
    )

    if (confirmed) {
      state.processingCall = call.id
      
      const response = await waiterCallsService.blockIpForSpam(call.id, {
        reason: 'spam',
        duration_hours: 24,
        notes: `Bloqueada desde Mesa ${call.table_number} - IP: ${call.client_info.ip_address}`
      })

      if (response.success) {
        showSuccessToast(`IP ${call.client_info.ip_address} bloqueada por 24 horas`)
        
        // Remover todas las llamadas de esta IP
        const blockedIp = call.client_info.ip_address
        state.pendingCalls = state.pendingCalls.filter(c => 
          c.client_info?.ip_address !== blockedIp
        )
        
        // Recargar lista de IPs bloqueadas
        await loadBlockedIps()
      } else {
        showErrorToast(response.message || 'Error bloqueando IP')
      }
    }
  } catch (error) {
    console.error('Error blocking IP for spam:', error)
    showErrorToast('Error bloqueando IP por spam')
  } finally {
    state.processingCall = null
  }
}

/**
 * Cargar IPs bloqueadas
 */
const loadBlockedIps = async () => {
  try {
    const response = await waiterCallsService.getBlockedIps({ active_only: true })
    if (response.success) {
      state.blockedIps = response.blocked_ips || []
    } else {
      state.blockedIps = []
    }
  } catch (error) {
    console.error('Error loading blocked IPs:', error)
    state.blockedIps = []
  }
}

/**
 * Desbloquear IP
 */
const unblockIp = async (ipAddress) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Desbloquear IP?',
      `Se desbloqueará la IP ${ipAddress} y podrá volver a realizar llamadas.`,
      'Desbloquear',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.unblockIp(ipAddress, state.currentBusiness?.id)
      
      if (response.success) {
        showSuccessToast(`IP ${ipAddress} desbloqueada`)
        await loadBlockedIps()
      } else {
        showErrorToast(response.message || 'Error desbloqueando IP')
      }
    }
  } catch (error) {
    console.error('Error unblocking IP:', error)
    showErrorToast('Error desbloqueando IP')
  }
}

// ===== DEBUG IP (Anti-Spam) =====
const openIpDebugPanel = () => {
  state.showIpDebugPanel = true
  ipDebugInput.value = ''
  ipDebugResult.value = null
  ipDebugError.value = null
}

const runIpDebug = async () => {
  if (!ipDebugInput.value) return
  ipDebugLoading.value = true
  ipDebugError.value = null
  ipDebugResult.value = null
  try {
    const response = await waiterCallsService.debugBlockedIp(ipDebugInput.value, state.currentBusiness?.id)
    if (response.success) {
      ipDebugResult.value = response.data || response // según backend
    } else {
      ipDebugError.value = response.message || 'Diagnóstico fallido'
    }
  } catch (e) {
    console.error('Error debug IP:', e)
    ipDebugError.value = e.message || 'Error de red'
  } finally {
    ipDebugLoading.value = false
  }
}

const forceUnblockFromDebug = async () => {
  if (!ipDebugResult.value?.ip_address) return
  const confirmed = await showConfirmDialog(
    '¿Force Unblock?',
    `Se forzará el desbloqueo completo de la IP ${ipDebugResult.value.ip_address}.`,
    'Desbloquear',
    'Cancelar',
    'warning'
  )
  if (!confirmed) return
  ipDebugLoading.value = true
  try {
    const resp = await waiterCallsService.forceUnblockIp(ipDebugResult.value.ip_address, state.currentBusiness?.id)
    if (resp.success) {
      showSuccessToast('IP desbloqueada forzadamente')
      // refrescar resultado debug
      await runIpDebug()
      await loadBlockedIps()
    } else {
      showErrorToast(resp.message || 'No se pudo desbloquear')
    }
  } catch (e) {
    console.error('Error force unblock:', e)
    showErrorToast(e.message || 'Error desconocido')
  } finally {
    ipDebugLoading.value = false
  }
}

/**
 * Formatear fecha para mostrar en la lista de bloqueados
 */
const formatBlockDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes}m`
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha inválida'
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

.action-btn.danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.action-btn.danger:hover {
  background: #c82333;
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

.table-silenced-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  font-style: italic;
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

/* Estilos Anti-Spam */
.notification-item.potential-spam {
  border-color: #fd7e14;
  background: #fff8ed;
  animation: spam-pulse 3s infinite;
}

@keyframes spam-pulse {
  0% { border-color: #fd7e14; }
  50% { border-color: #dc3545; }
  100% { border-color: #fd7e14; }
}

.spam-badge {
  background: #fd7e14;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  margin-left: 8px;
}

.client-info {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.source-badge {
  background: #e9ecef;
  color: #495057;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
  margin-left: 8px;
}

.notification-action-btn.block-ip {
  background: #dc3545;
  color: white;
  flex: none;
  width: 32px;
}

.notification-action-btn.block-ip:hover:not(:disabled) {
  background: #c82333;
}

/* Modal Anti-Spam */
.anti-spam-section {
  padding: 20px;
}

.spam-alerts {
  background: #fff8ed;
  border: 1px solid #fd7e14;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 24px;
}

.spam-alerts h4 {
  color: #fd7e14;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.suspicious-ip-card {
  background: white;
  border: 1px solid #fd7e14;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.ip-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.call-count {
  background: #dc3545;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.ip-calls {
  margin: 8px 0;
}

.mini-call {
  font-size: 11px;
  color: #6c757d;
  padding: 2px 0;
}

.btn-block-ip {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-block-ip:hover {
  background: #c82333;
}

.blocked-ips-list {
  background: white;
}

.blocked-ips-list .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.blocked-ips-list h4 {
  margin: 0;
  color: #dc3545;
  font-size: 14px;
}

.blocked-ip-cards {
  display: grid;
  gap: 12px;
}

.blocked-ip-card {
  border: 1px solid #dc3545;
  border-radius: 6px;
  padding: 16px;
  background: #fff5f5;
}

.blocked-ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ip-address {
  font-family: monospace;
  font-weight: bold;
  color: #dc3545;
  font-size: 14px;
}

.block-reason {
  background: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-transform: uppercase;
}

.blocked-ip-details {
  margin: 12px 0;
}

.detail-item {
  font-size: 12px;
  margin: 4px 0;
  color: #495057;
}

.blocked-ip-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

/* Estilos para la sección de IPs bloqueadas en el sidebar */
.blocked-ips-list-sidebar {
  max-height: 300px;
  overflow-y: auto;
}

.blocked-ip-item {
  padding: 12px;
  border: 1px solid #dc3545;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fff5f5;
  transition: all 0.2s ease;
}

.blocked-ip-item:hover {
  border-color: #c82333;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.1);
}

.blocked-ip-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  font-weight: bold;
  color: #dc3545;
  font-size: 13px;
  margin-bottom: 8px;
}

.blocked-ip-address i {
  color: #dc3545;
}

.blocked-ip-details {
  margin: 8px 0 12px 0;
}

.blocked-detail {
  font-size: 11px;
  margin: 3px 0;
  color: #495057;
  line-height: 1.3;
}

.blocked-detail strong {
  color: #212529;
  font-weight: 600;
}

.blocked-detail.expires {
  color: #fd7e14;
}

.blocked-detail.permanent {
  color: #dc3545;
  font-weight: 500;
}

.blocked-detail.notes {
  font-style: italic;
  color: #6c757d;
  max-width: 100%;
  word-wrap: break-word;
}

.blocked-ip-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.blocked-action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.blocked-action-btn.unblock {
  background: #ffc107;
  color: #212529;
}

.blocked-action-btn.unblock:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.blocked-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive ajustes para la sección de bloqueados */
@media (max-width: 768px) {
  .blocked-ip-item {
    padding: 10px;
  }
  
  .blocked-ip-address {
    font-size: 12px;
  }
  
  .blocked-detail {
    font-size: 10px;
  }
  
  .blocked-action-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
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
  
  .anti-spam-section {
    padding: 12px;
  }
  
  .blocked-ip-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>