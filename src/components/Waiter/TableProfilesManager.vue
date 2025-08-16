<template>
  <div class="table-profiles-manager">
    <!-- Header con botón crear -->
    <div class="profiles-header">
      <div class="header-info">
        <h3>
          <i class="fas fa-bookmark"></i>
          Mis Perfiles de Mesa
        </h3>
        <p class="header-description">
          Crea perfiles con conjuntos de mesas para activar rápidamente
        </p>
      </div>
      <button 
        @click="showCreateModal = true" 
        class="btn btn-primary"
      >
        <i class="fas fa-plus"></i>
        Crear Perfil
      </button>
    </div>

    <!-- Lista de perfiles existentes -->
    <div class="profiles-list" v-if="!loading">
      <div 
        v-for="profile in profiles" 
        :key="profile.id"
        class="profile-card"
        :class="{
          'active': profile.is_active,
          'has-conflicts': profile.conflict_tables?.length > 0
        }"
      >
        <div class="profile-header">
          <div class="profile-info">
            <h4 class="profile-name">
              {{ profile.name }}
              <span v-if="profile.is_active" class="active-badge">ACTIVO</span>
            </h4>
            <div class="profile-meta">
              <span class="table-count">
                <i class="fas fa-table"></i>
                {{ profile.table_numbers?.length || 0 }} mesas
              </span>
              <span class="created-date">
                Creado {{ formatDate(profile.created_at) }}
              </span>
            </div>
          </div>
          
          <div class="profile-actions">
            <button 
              v-if="!profile.is_active"
              @click="activateProfile(profile.id)"
              class="action-btn activate"
              :disabled="processing === profile.id"
              title="Activar perfil"
            >
              <i class="fas fa-play"></i>
            </button>
            <button 
              v-if="profile.is_active"
              @click="deactivateProfile(profile.id)"
              class="action-btn deactivate"
              :disabled="processing === profile.id"
              title="Desactivar perfil"
            >
              <i class="fas fa-pause"></i>
            </button>
            <button 
              @click="editProfile(profile)"
              class="action-btn edit"
              title="Editar perfil"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              @click="deleteProfile(profile.id, profile.name)"
              class="action-btn delete"
              title="Eliminar perfil"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Mesas del perfil -->
        <div class="profile-tables">
          <div class="tables-list">
            <span 
              v-for="tableNumber in profile.table_numbers" 
              :key="tableNumber"
              class="table-tag"
              :class="{
                'conflict': profile.conflict_tables?.includes(tableNumber),
                'assigned': isTableAssigned(tableNumber)
              }"
            >
              Mesa {{ tableNumber }}
              <i v-if="profile.conflict_tables?.includes(tableNumber)" 
                class="fas fa-exclamation-triangle" 
                title="En conflicto con otro mozo"></i>
            </span>
          </div>
        </div>

        <!-- Información de conflictos -->
        <div v-if="profile.conflict_tables?.length > 0" class="conflict-info">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ profile.conflict_tables.length }} mesa(s) en conflicto con otros mozos</span>
        </div>

        <!-- Información de estado -->
        <div v-if="profile.is_active && profile.activation_summary" class="activation-summary">
          <div class="summary-item success" v-if="profile.activation_summary.activated > 0">
            <i class="fas fa-check"></i>
            {{ profile.activation_summary.activated }} activadas
          </div>
          <div class="summary-item info" v-if="profile.activation_summary.already_yours > 0">
            <i class="fas fa-user-check"></i>
            {{ profile.activation_summary.already_yours }} ya eran tuyas
          </div>
          <div class="summary-item warning" v-if="profile.activation_summary.conflicts > 0">
            <i class="fas fa-exclamation-triangle"></i>
            {{ profile.activation_summary.conflicts }} en conflicto
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="profiles.length === 0" class="empty-state">
        <i class="fas fa-bookmark"></i>
        <h4>No tienes perfiles creados</h4>
        <p>Crea tu primer perfil para agrupar mesas que usas frecuentemente</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Crear Primer Perfil
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando perfiles...</p>
    </div>

    <!-- Modal crear/editar perfil -->
    <div v-if="showCreateModal || editingProfile" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-bookmark"></i>
            {{ editingProfile ? 'Editar Perfil' : 'Crear Nuevo Perfil' }}
          </h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveProfile">
            <div class="form-group">
              <label for="profileName">Nombre del perfil</label>
              <input 
                id="profileName"
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="Ej: Zona A, Terraza, Mesas VIP..."
                maxlength="50"
                required
              >
              <small class="form-help">
                Máximo 50 caracteres. Debe ser único.
              </small>
            </div>

            <div class="form-group">
              <label>Selecciona las mesas (máximo 20)</label>
              <div class="tables-grid">
                <label 
                  v-for="table in availableTablesForForm" 
                  :key="table.id"
                  class="table-checkbox"
                  :class="{
                    'selected': formData.table_ids.includes(table.id),
                    'assigned': table.is_assigned_to_me,
                    'conflict': table.is_assigned_to_other
                  }"
                >
                  <input 
                    type="checkbox"
                    :value="table.id"
                    v-model="formData.table_ids"
                    :disabled="formData.table_ids.length >= 20 && !formData.table_ids.includes(table.id)"
                  >
                  <span class="table-info">
                    <span class="table-number">Mesa {{ table.number }}</span>
                    <span v-if="table.name && table.name !== `Mesa ${table.number}`" class="table-name">
                      {{ table.name }}
                    </span>
                    <span v-if="table.is_assigned_to_me" class="status-badge mine">Tuya</span>
                    <span v-else-if="table.is_assigned_to_other" class="status-badge conflict">
                      {{ table.assigned_waiter }}
                    </span>
                    <span v-else class="status-badge available">Disponible</span>
                  </span>
                </label>
              </div>
              <small class="form-help">
                Seleccionadas: {{ formData.table_ids.length }}/20
              </small>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!formData.name.trim() || formData.table_ids.length === 0 || saving"
              >
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ editingProfile ? 'Actualizar' : 'Crear' }} Perfil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiService from '@/services/api'
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/notifications'

// Props
const props = defineProps({
  businessId: {
    type: Number,
    required: true
  },
  availableTables: {
    type: Array,
    default: () => []
  },
  assignedTables: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['profiles-updated'])

// Estado reactivo
const state = reactive({
  profiles: [],
  loading: false,
  processing: null,
  saving: false,
  showCreateModal: false,
  editingProfile: null,
  formData: {
    name: '',
    table_ids: []
  }
})

// Referencias reactivas
const profiles = computed(() => state.profiles)
const loading = computed(() => state.loading)
const processing = computed(() => state.processing)
const saving = computed(() => state.saving)
const showCreateModal = computed({
  get: () => state.showCreateModal,
  set: (value) => state.showCreateModal = value
})
const editingProfile = computed(() => state.editingProfile)
const formData = computed(() => state.formData)

// Tablas disponibles para el formulario
const availableTablesForForm = computed(() => {
  const allTables = [...props.availableTables, ...props.assignedTables]
  return allTables.map(table => ({
    ...table,
    is_assigned_to_me: props.assignedTables.some(t => t.id === table.id),
    is_assigned_to_other: table.assigned_waiter && table.assigned_waiter !== 'Tú',
    assigned_waiter: table.assigned_waiter || 'Disponible'
  }))
})

// ===== MÉTODOS PRINCIPALES =====

/**
 * Cargar perfiles del usuario
 */
const loadProfiles = async () => {
  state.loading = true
  try {
    const response = await apiService.getWaiterTableProfiles()
    if (response.data.success) {
      state.profiles = response.data.profiles || []
      console.log('✅ Perfiles cargados:', state.profiles.length)
    } else {
      showErrorToast(response.data.message || 'Error cargando perfiles')
    }
  } catch (error) {
    console.error('Error loading profiles:', error)
    showErrorToast('Error cargando perfiles')
  } finally {
    state.loading = false
  }
}

/**
 * Crear o actualizar perfil
 */
const saveProfile = async () => {
  if (!state.formData.name.trim() || state.formData.table_ids.length === 0) {
    showErrorToast('Completa todos los campos requeridos')
    return
  }

  state.saving = true
  try {
    const data = {
      name: state.formData.name.trim(),
      table_ids: state.formData.table_ids
    }

    let response
    if (state.editingProfile) {
      response = await apiService.updateWaiterTableProfile(state.editingProfile.id, data)
    } else {
      response = await apiService.createWaiterTableProfile(data)
    }

    if (response.data.success) {
      showSuccessToast(response.data.message || `Perfil ${state.editingProfile ? 'actualizado' : 'creado'} correctamente`)
      closeModal()
      await loadProfiles()
      emit('profiles-updated')
    } else {
      showErrorToast(response.data.message || `Error ${state.editingProfile ? 'actualizando' : 'creando'} perfil`)
    }
  } catch (error) {
    console.error('Error saving profile:', error)
    showErrorToast(`Error ${state.editingProfile ? 'actualizando' : 'creando'} perfil`)
  } finally {
    state.saving = false
  }
}

/**
 * Activar perfil
 */
const activateProfile = async (profileId) => {
  state.processing = profileId
  try {
    const response = await apiService.activateWaiterTableProfile(profileId)
    if (response.data.success) {
      showSuccessToast(response.data.message || 'Perfil activado')
      await loadProfiles()
      emit('profiles-updated')
    } else {
      showErrorToast(response.data.message || 'Error activando perfil')
    }
  } catch (error) {
    console.error('Error activating profile:', error)
    showErrorToast('Error activando perfil')
  } finally {
    state.processing = null
  }
}

/**
 * Desactivar perfil
 */
const deactivateProfile = async (profileId) => {
  const confirmed = await showConfirmDialog(
    '¿Desactivar perfil?',
    'Se desasignarán todas las mesas de este perfil.',
    'Desactivar',
    'Cancelar',
    'warning'
  )

  if (!confirmed) return

  state.processing = profileId
  try {
    const response = await apiService.deactivateWaiterTableProfile(profileId)
    if (response.data.success) {
      showSuccessToast(response.data.message || 'Perfil desactivado')
      await loadProfiles()
      emit('profiles-updated')
    } else {
      showErrorToast(response.data.message || 'Error desactivando perfil')
    }
  } catch (error) {
    console.error('Error deactivating profile:', error)
    showErrorToast('Error desactivando perfil')
  } finally {
    state.processing = null
  }
}

/**
 * Editar perfil
 */
const editProfile = (profile) => {
  state.editingProfile = profile
  state.formData = {
    name: profile.name,
    table_ids: [...(profile.table_ids || [])]
  }
  state.showCreateModal = false
}

/**
 * Eliminar perfil
 */
const deleteProfile = async (profileId, profileName) => {
  const confirmed = await showConfirmDialog(
    `¿Eliminar perfil "${profileName}"?`,
    'Esta acción no se puede deshacer.',
    'Eliminar',
    'Cancelar',
    'danger'
  )

  if (!confirmed) return

  try {
    const response = await apiService.deleteWaiterTableProfile(profileId)
    if (response.data.success) {
      showSuccessToast(response.data.message || 'Perfil eliminado')
      await loadProfiles()
      emit('profiles-updated')
    } else {
      showErrorToast(response.data.message || 'Error eliminando perfil')
    }
  } catch (error) {
    console.error('Error deleting profile:', error)
    showErrorToast('Error eliminando perfil')
  }
}

/**
 * Cerrar modal
 */
const closeModal = () => {
  state.showCreateModal = false
  state.editingProfile = null
  state.formData = {
    name: '',
    table_ids: []
  }
}

// ===== UTILIDADES =====

/**
 * Verificar si una mesa está asignada al usuario
 */
const isTableAssigned = (tableNumber) => {
  return props.assignedTables.some(table => table.number === tableNumber)
}

/**
 * Formatear fecha
 */
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// ===== LIFECYCLE =====

onMounted(async () => {
  console.log('🏠 TableProfilesManager mounted')
  await loadProfiles()
})
</script>

<style scoped>
.table-profiles-manager {
  padding: 20px;
  max-width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.profiles-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.header-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-description {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.profiles-list {
  display: grid;
  gap: 20px;
}

.profile-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s ease;
}

.profile-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-card.active {
  border-color: #28a745;
  background: #f8fff9;
}

.profile-card.has-conflicts {
  border-color: #ffc107;
  background: #fffdf5;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.profile-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c757d;
}

.table-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn.activate {
  background: #28a745;
  color: white;
}

.action-btn.deactivate {
  background: #6c757d;
  color: white;
}

.action-btn.edit {
  background: #007bff;
  color: white;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-tables {
  margin-bottom: 12px;
}

.tables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.table-tag {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 4px;
}

.table-tag.conflict {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.table-tag.assigned {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.conflict-info {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.activation-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-item {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary-item.success {
  background: #d4edda;
  color: #155724;
}

.summary-item.info {
  background: #d1ecf1;
  color: #0c5460;
}

.summary-item.warning {
  background: #fff3cd;
  color: #856404;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
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

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.loading-state i {
  font-size: 32px;
  margin-bottom: 12px;
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
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6c757d;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.table-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-checkbox:hover {
  background: #f8f9fa;
}

.table-checkbox.selected {
  background: #e3f2fd;
  border-color: #007bff;
}

.table-checkbox.assigned {
  background: #f0f8f0;
  border-color: #28a745;
}

.table-checkbox.conflict {
  background: #fff8f0;
  border-color: #ffc107;
}

.table-checkbox input {
  margin: 0;
}

.table-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-number {
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
}

.table-name {
  font-size: 11px;
  color: #6c757d;
}

.status-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.mine {
  background: #d4edda;
  color: #155724;
}

.status-badge.conflict {
  background: #fff3cd;
  color: #856404;
}

.status-badge.available {
  background: #e2e6ea;
  color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .table-profiles-manager {
    padding: 16px;
  }
  
  .profiles-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>