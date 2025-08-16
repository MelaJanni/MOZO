<template>
  <div class="business-tables-manager">
    <div class="manager-header">
      <h3>
        <i class="fas fa-table"></i>
        Mesas de {{ businessName }}
      </h3>
      <div class="manager-stats">
        <div class="stat-item">
          <div class="stat-number">{{ totalTables }}</div>
          <div class="stat-label">Total mesas</div>
        </div>
        <div class="stat-item success">
          <div class="stat-number">{{ assignedCount }}</div>
          <div class="stat-label">Asignadas a mí</div>
        </div>
        <div class="stat-item warning">
          <div class="stat-number">{{ availableCount }}</div>
          <div class="stat-label">Disponibles</div>
        </div>
        <div class="stat-item danger">
          <div class="stat-number">{{ silencedCount }}</div>
          <div class="stat-label">Silenciadas</div>
        </div>
      </div>
    </div>

    <div class="tables-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando mesas del negocio...</p>
      </div>

      <div v-else class="tables-grid">
        <div 
          v-for="table in businessTables" 
          :key="table.id"
          class="table-card"
          :class="{
            'assigned': table.assigned_to_me,
            'available': !table.assigned_to_me && !table.is_silenced,
            'silenced': table.is_silenced,
            'has-calls': table.pending_calls_count > 0
          }"
        >
          <div class="table-header">
            <div class="table-number">Mesa {{ table.number }}</div>
            <div class="table-status">
              <i v-if="table.assigned_to_me && table.pending_calls_count > 0" 
                 class="fas fa-exclamation-triangle status-icon urgent" 
                 title="Tiene llamadas pendientes"></i>
              <i v-else-if="table.assigned_to_me && table.is_silenced" 
                 class="fas fa-volume-mute status-icon silenced" 
                 title="Silenciada"></i>
              <i v-else-if="table.assigned_to_me" 
                 class="fas fa-check status-icon active" 
                 title="Activa y asignada"></i>
              <i v-else-if="table.is_silenced" 
                 class="fas fa-ban status-icon silenced" 
                 title="Mesa silenciada"></i>
              <i v-else 
                 class="fas fa-circle status-icon available" 
                 title="Disponible"></i>
            </div>
          </div>

          <div class="table-info">
            <div v-if="table.name && table.name !== `Mesa ${table.number}`" class="table-name">
              {{ table.name }}
            </div>
            <div class="table-details">
              <span v-if="table.capacity">
                <i class="fas fa-users"></i>
                {{ table.capacity }} personas
              </span>
              <span v-if="table.pending_calls_count > 0">
                <i class="fas fa-bell"></i>
                {{ table.pending_calls_count }} llamada(s)
              </span>
            </div>
            <div v-if="table.assigned_waiter && !table.assigned_to_me" class="assigned-waiter">
              <i class="fas fa-user"></i>
              Asignada a: {{ table.assigned_waiter.name }}
            </div>
          </div>

          <div class="table-actions">
            <!-- Acciones para mesas propias -->
            <template v-if="table.assigned_to_me">
              <button 
                v-if="table.is_silenced"
                @click="unsilenceTable(table.id)"
                class="action-btn unsilence"
                title="Activar mesa"
              >
                <i class="fas fa-volume-up"></i>
              </button>
              <button 
                v-else
                @click="silenceTable(table.id)"
                class="action-btn silence"
                title="Silenciar mesa"
              >
                <i class="fas fa-volume-mute"></i>
              </button>
              <button 
                @click="deactivateTable(table.id)"
                class="action-btn deactivate"
                title="Desasignarme de esta mesa"
              >
                <i class="fas fa-times"></i>
              </button>
            </template>

            <!-- Acciones para mesas disponibles -->
            <template v-else-if="!table.is_silenced">
              <button 
                @click="activateTable(table.id)"
                class="action-btn activate"
                title="Asignarme esta mesa"
              >
                <i class="fas fa-plus"></i>
                Tomar
              </button>
            </template>

            <!-- Mesa silenciada o asignada a otro -->
            <template v-else>
              <div class="no-actions">
                <span v-if="table.is_silenced">Mesa silenciada</span>
                <span v-else>No disponible</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="businessTables.length === 0" class="empty-state">
          <i class="fas fa-table"></i>
          <h4>Sin mesas registradas</h4>
          <p>Este negocio no tiene mesas registradas aún.</p>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="quick-actions">
      <button 
        @click="refreshTables" 
        class="action-btn primary" 
        :disabled="loading"
      >
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Actualizar
      </button>
      
      <button 
        v-if="myTables.length > 0"
        @click="deactivateAllMyTables" 
        class="action-btn danger"
      >
        <i class="fas fa-sign-out-alt"></i>
        Desasignarme de todas ({{ myTables.length }})
      </button>

      <button 
        v-if="availableTables.length > 0"
        @click="activateMultipleTables" 
        class="action-btn success"
      >
        <i class="fas fa-check-double"></i>
        Tomar todas disponibles ({{ availableTables.length }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import waiterCallsService from '@/services/waiterCallsService'
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/notifications'

// Props
const props = defineProps({
  businessId: {
    type: [String, Number],
    required: true
  },
  businessName: {
    type: String,
    default: 'Negocio'
  }
})

// Emits
const emit = defineEmits(['tables-updated'])

// Estado reactivo
const businessTables = ref([])
const loading = ref(false)

// Computed
const totalTables = computed(() => businessTables.value.length)
const assignedCount = computed(() => businessTables.value.filter(t => t.assigned_to_me).length)
const availableCount = computed(() => businessTables.value.filter(t => !t.assigned_to_me && !t.is_silenced).length)
const silencedCount = computed(() => businessTables.value.filter(t => t.is_silenced).length)
const myTables = computed(() => businessTables.value.filter(t => t.assigned_to_me))
const availableTables = computed(() => businessTables.value.filter(t => !t.assigned_to_me && !t.is_silenced))

// Métodos principales
const loadBusinessTables = async () => {
  loading.value = true
  console.log('🏢 Cargando mesas del negocio:', props.businessId)
  
  try {
    const response = await waiterCallsService.getWaiterBusinessTables(props.businessId)
    console.log('📋 Respuesta de mesas del negocio:', response)
    
    if (response.success) {
      businessTables.value = response.tables || []
      console.log('✅ Mesas cargadas:', businessTables.value.length, businessTables.value)
      
      // Log detallado de cada mesa para debuggear
      businessTables.value.forEach((table, index) => {
        if (index < 3) { // Solo mostrar las primeras 3 para no saturar
          console.log(`🔍 Mesa ${table.number}:`, {
            id: table.id,
            assigned_to_me: table.assigned_to_me,
            is_silenced: table.is_silenced,
            assigned_waiter: table.assigned_waiter
          })
        }
      })
      
      console.log('📊 Estadísticas calculadas:')
      console.log('  - Total mesas:', businessTables.value.length)
      console.log('  - Asignadas a mí:', businessTables.value.filter(t => t.assigned_to_me).length)
      console.log('  - Disponibles:', businessTables.value.filter(t => !t.assigned_to_me && !t.is_silenced).length)
      console.log('  - Silenciadas:', businessTables.value.filter(t => t.is_silenced).length)
      emit('tables-updated', businessTables.value)
    } else {
      console.error('❌ Error en respuesta:', response.message)
      showErrorToast(response.message || 'Error cargando mesas del negocio')
    }
  } catch (error) {
    console.error('💥 Error loading business tables:', error)
    showErrorToast('Error cargando mesas del negocio')
  } finally {
    loading.value = false
  }
}

const refreshTables = async () => {
  await loadBusinessTables()
}

// Gestión individual de mesas
const activateTable = async (tableId) => {
  console.log('🚀 BusinessTablesManager: Iniciando activación de mesa:', tableId)
  try {
    const response = await waiterCallsService.activateTable(tableId)
    console.log('📊 BusinessTablesManager: Respuesta de activación:', response)
    
    if (response.success) {
      console.log('✅ BusinessTablesManager: Mesa activada exitosamente')
      showSuccessToast(response.message || 'Mesa activada')
      console.log('🔄 BusinessTablesManager: Recargando mesas del negocio...')
      await loadBusinessTables()
    } else {
      console.error('❌ BusinessTablesManager: Error en respuesta:', response.message)
      showErrorToast(response.message || 'Error activando mesa')
    }
  } catch (error) {
    console.error('💥 BusinessTablesManager: Error completo activando mesa:', error)
    showErrorToast('Error activando mesa')
  }
}

const deactivateTable = async (tableId) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Desasignarte de esta mesa?',
      'Ya no recibirás llamadas de esta mesa.',
      'Desasignar',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.deactivateTable(tableId)
      if (response.success) {
        showSuccessToast(response.message || 'Mesa desasignada')
        await loadBusinessTables()
      } else {
        showErrorToast(response.message || 'Error desasignando mesa')
      }
    }
  } catch (error) {
    console.error('Error deactivating table:', error)
    showErrorToast('Error desasignando mesa')
  }
}

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
        await loadBusinessTables()
      } else {
        showErrorToast(response.message || 'Error silenciando mesa')
      }
    }
  } catch (error) {
    console.error('Error silencing table:', error)
    showErrorToast('Error silenciando mesa')
  }
}

const unsilenceTable = async (tableId) => {
  try {
    const response = await waiterCallsService.unsilenceTable(tableId)
    if (response.success) {
      showSuccessToast(response.message || 'Mesa activada')
      await loadBusinessTables()
    } else {
      showErrorToast(response.message || 'Error activando mesa')
    }
  } catch (error) {
    console.error('Error unsilencing table:', error)
    showErrorToast('Error activando mesa')
  }
}

// Acciones múltiples
const activateMultipleTables = async () => {
  const available = availableTables.value
  if (available.length === 0) return

  try {
    const confirmed = await showConfirmDialog(
      `¿Tomar todas las mesas disponibles?`,
      `Se asignarán ${available.length} mesas a tu cuenta.`,
      'Tomar todas',
      'Cancelar',
      'info'
    )

    if (confirmed) {
      const tableIds = available.map(t => t.id)
      const response = await waiterCallsService.activateMultipleTables(tableIds)
      
      if (response.success) {
        showSuccessToast(`${response.summary?.successful || available.length} mesas asignadas`)
        await loadBusinessTables()
      } else {
        showErrorToast(response.message || 'Error asignando mesas')
      }
    }
  } catch (error) {
    console.error('Error activating multiple tables:', error)
    showErrorToast('Error asignando mesas múltiples')
  }
}

const deactivateAllMyTables = async () => {
  const myTablesData = myTables.value
  if (myTablesData.length === 0) return

  try {
    const confirmed = await showConfirmDialog(
      `¿Desasignarte de todas las mesas?`,
      `Se desasignarán ${myTablesData.length} mesas de tu cuenta.`,
      'Desasignar todas',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const tableIds = myTablesData.map(t => t.id)
      const response = await waiterCallsService.deactivateMultipleTables(tableIds)
      
      if (response.success) {
        showSuccessToast(`${response.summary?.successful || myTablesData.length} mesas desasignadas`)
        await loadBusinessTables()
      } else {
        showErrorToast(response.message || 'Error desasignando mesas')
      }
    }
  } catch (error) {
    console.error('Error deactivating multiple tables:', error)
    showErrorToast('Error desasignando mesas múltiples')
  }
}

// Lifecycle
onMounted(() => {
  console.log('🏢 BusinessTablesManager mounted with businessId:', props.businessId)
  loadBusinessTables()
})

// Exponer métodos
defineExpose({
  loadBusinessTables,
  refreshTables
})
</script>

<style scoped>
.business-tables-manager {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.manager-header {
  margin-bottom: 20px;
}

.manager-header h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.manager-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
}

.stat-item.success {
  border-color: #28a745;
  background: #f8fff9;
}

.stat-item.warning {
  border-color: #ffc107;
  background: #fffbf0;
}

.stat-item.danger {
  border-color: #dc3545;
  background: #fff5f5;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-item.success .stat-number {
  color: #28a745;
}

.stat-item.warning .stat-number {
  color: #fd7e14;
}

.stat-item.danger .stat-number {
  color: #dc3545;
}

.stat-label {
  font-size: 11px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tables-container {
  margin-bottom: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6c757d;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.table-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.table-card.assigned {
  border-color: #28a745;
  background: #f8fff9;
}

.table-card.available {
  border-color: #007bff;
  background: #f0f8ff;
}

.table-card.silenced {
  border-color: #6c757d;
  background: #f6f6f6;
  opacity: 0.8;
}

.table-card.has-calls {
  border-color: #dc3545;
  background: #fff5f5;
  animation: pulse-border 2s infinite;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-number {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.status-icon {
  font-size: 14px;
}

.status-icon.active {
  color: #28a745;
}

.status-icon.available {
  color: #007bff;
}

.status-icon.urgent {
  color: #dc3545;
}

.status-icon.silenced {
  color: #6c757d;
}

.table-info {
  margin-bottom: 12px;
}

.table-name {
  font-size: 14px;
  color: #495057;
  margin-bottom: 6px;
}

.table-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6c757d;
}

.table-details span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.assigned-waiter {
  font-size: 12px;
  color: #fd7e14;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.table-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.activate {
  background: #28a745;
  color: white;
}

.action-btn.activate:hover {
  background: #1e7e34;
}

.action-btn.deactivate {
  background: #dc3545;
  color: white;
}

.action-btn.deactivate:hover {
  background: #c82333;
}

.action-btn.silence {
  background: #ffc107;
  color: #212529;
}

.action-btn.silence:hover {
  background: #e0a800;
}

.action-btn.unsilence {
  background: #17a2b8;
  color: white;
}

.action-btn.unsilence:hover {
  background: #138496;
}

.no-actions {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: #495057;
}

.quick-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.action-btn.success {
  background: #28a745;
  color: white;
}

.action-btn.success:hover {
  background: #1e7e34;
}

.action-btn.danger {
  background: #dc3545;
  color: white;
}

.action-btn.danger:hover {
  background: #c82333;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-border {
  0% { border-color: #dc3545; }
  50% { border-color: rgba(220, 53, 69, 0.5); }
  100% { border-color: #dc3545; }
}

@media (max-width: 768px) {
  .manager-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>