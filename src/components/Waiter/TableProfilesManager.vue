<template>
  <Teleport to="body">
    <div class="pm-overlay" @click.self="$emit('close')">
      <div class="pm-modal row">
        <div class="pm-header col-12 px-4">
            <div class="pm-title">
            <i :class="viewMode === 'list' ? 'bi bi-geo-alt pm-icon' : 'bi bi-bookmark pm-icon'"></i>
            <span>Gestionar Perfiles de Mesas</span>
          </div>
          <button @click="$emit('close')" class="pm-close" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div class="pm-body col-12 px-4">
          <!-- Vista STARTER: texto de ayuda + CTA grande + 1 tarjeta con acciones (play/edit/delete) -->
          <template v-if="viewMode === 'starter'">
            <div class="modal-description">
              Crea perfiles con conjuntos de mesas para activar rápidamente
            </div>
            <button @click="showCreateModal = true" class="add-profile-btn">
              Agregar Nuevo Perfil
            </button>

            <div v-if="!loading && profiles.length > 0" class="profiles-list">
              <div
                v-for="profile in profiles.slice(0,1)"
                :key="profile.id"
                class="profile-card simple starter"
                :class="{ 'active': profile.is_active, 'has-conflicts': profile.conflict_tables?.length > 0 }"
              >
                <div class="profile-row">
                  <div class="col-6 d-flex flex-column justify-content-center align-items-start">
                    <h4 class="profile-name">{{ profile.name }}</h4>
                    <span class="count-pill mt-2">
                      {{ profile.table_numbers?.length || 0 }} mesas
                    </span>
                  </div>
                  <div class="row-right">
                    <button @click="editProfile(profile)" class="action-btn edit" title="Editar perfil">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="deleteProfile(profile.id, profile.name)" class="action-btn delete" title="Eliminar perfil">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div v-if="profile.conflict_tables?.length > 0" class="conflict-info">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>{{ profile.conflict_tables.length }} mesa(s) en conflicto con otros mozos</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Vista LIST: toolbar + listado de perfiles con iconos pequeños -->
          <template v-else>
            <div class="pm-toolbar mb-3">
              <button class="toolbar-cta" @click="showCreateModal = true">
                <i class="bi bi-plus"></i>
                Agregar Nuevo Perfil
              </button>
            </div>

            <div class="profiles-list" v-if="!loading && profiles.length > 0">
              <div
                v-for="profile in profiles"
                :key="profile.id"
                class="profile-card modern"
              >
                <div class="profile-row">
                  <div class="profile-info">
                    <div class="profile-name">{{ profile.name }}</div>
                    <div v-if="profile.description" class="profile-description">{{ profile.description }}</div>
                  </div>
                  <div class="profile-actions">
                    <span class="table-count-badge">{{ profile.table_numbers?.length || profile.table_ids?.length || 0 }} mesas</span>
                    <button @click="editProfile(profile)" class="action-icon-btn edit" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button @click="deleteProfile(profile.id, profile.name)" class="action-icon-btn delete" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="!loading" class="empty-state">
              <div class="empty-icon"><i class="bi bi-bookmark"></i></div>
              <div class="empty-title">Sin perfiles aún</div>
              <div class="empty-subtitle">Crea tu primer perfil para agrupar mesas por áreas</div>
              <button class="create-first-btn" @click="showCreateModal = true">
                <i class="bi bi-plus-circle"></i> Crear Perfil
              </button>
            </div>
          </template>

          <!-- Loading state -->
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando perfiles...</p>
          </div>

          <!-- Modal crear/editar perfil - versión UI violeta (teleport al body) -->
          <Teleport to="body">
            <div v-if="showCreateModal || editingProfile" class="pm-overlay" @click.self="closeModal">
              <div class="pm-modal">
                <div class="pm-header">
                  <div class="pm-title">
                    <i class="bi bi-bookmark pm-icon"></i>
                    <span>{{ editingProfile ? 'Editar Perfil de Mesas' : 'Agregar Perfil de Mesas' }}</span>
                  </div>
                  <button @click="closeModal" class="pm-close" aria-label="Cerrar">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <div class="pm-body">
                  <form @submit.prevent="saveProfile">
                    <!-- Nombre -->
                    <div class="pm-field">
                      <div class="pm-label">Nombre del Perfil *</div>
                      <input
                        v-model="formData.name"
                        class="pm-input"
                        type="text"
                        placeholder="ej. Mesas Exteriores"
                        maxlength="50"
                        required
                      />
                    </div>

                    <!-- Seleccionar mesas -->
                    <div class="pm-field">
                      <div class="pm-label-row">
                        <span>Seleccionar Mesas *</span>
                        <span class="pm-chip primary">{{ formData.table_ids.length }} seleccionadas</span>
                      </div>

                      <div class="pm-tables-container">
                        <!-- Agrupado por zonas si existe nombre; si no, listado único -->
                        <div class="pm-section" v-for="group in tableGroups" :key="group.title">
                          <div class="pm-section-title">{{ group.title }}</div>
                          <div class="pm-options">
                            <label
                              v-for="table in group.items"
                              :key="table.id"
                              class="pm-option"
                              :class="{ disabled: formData.table_ids.length >= 20 && !formData.table_ids.includes(table.id) }"
                            >
                              <input
                                type="checkbox"
                                :value="table.id"
                                v-model="formData.table_ids"
                                :disabled="formData.table_ids.length >= 20 && !formData.table_ids.includes(table.id)"
                              />
                              <div class="pm-option-content">
                                <div class="pm-option-text">Mesa {{ table.number }}</div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="pm-actions row">
                      <button type="button" class="pm-btn outline col d-flex justify-content-center align-items-center" @click="closeModal">
                        <i class="bi bi-x me-1"></i>
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        class="pm-btn primary col d-flex justify-content-center align-items-center"
                        :disabled="!formData.name.trim() || formData.table_ids.length === 0 || saving"
                      >
                        <i v-if="saving" class="bi bi-arrow-repeat me-1"></i>
                        <i v-else class="bi bi-check me-1"></i>
                        {{ editingProfile ? 'Actualizar Perfil' : 'Crear Perfil' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>
    </div>
  </Teleport>
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
  },
  variant: { // 'starter' | 'list' | 'auto'
    type: String,
    default: 'auto'
  }
})

// Emits
const emit = defineEmits(['profiles-updated', 'close'])

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

// Modo de visualización (starter vs lista)
const viewMode = computed(() => {
  if (props.variant === 'starter' || props.variant === 'list') return props.variant
  // auto: si hay 0 o 1 perfiles, mostrar starter; si hay varios, lista
  return (state.profiles?.length || 0) <= 1 ? 'starter' : 'list'
})

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

// Agrupar por zonas heurísticas (Terraza/Interior/VIP/Barra) según nombre si está disponible
const tableGroups = computed(() => {
  const groups = [
    { key: 'terraza', title: 'Terraza', items: [] },
    { key: 'interior', title: 'Interior', items: [] },
    { key: 'vip', title: 'VIP', items: [] },
    { key: 'barra', title: 'Barra', items: [] }
  ]
  const other = { key: 'otras', title: 'Otras', items: [] }
  const src = availableTablesForForm.value
  for (const t of src) {
    const name = (t.name || '').toLowerCase()
    if (name.includes('terraza') || name.includes('exterior')) groups[0].items.push(t)
    else if (name.includes('interior')) groups[1].items.push(t)
    else if (name.includes('vip')) groups[2].items.push(t)
    else if (name.includes('barra') || name.includes('bar')) groups[3].items.push(t)
    else other.items.push(t)
  }
  const ordered = [...groups, other].filter(g => g.items.length > 0)
  // ordenar cada grupo por número de mesa
  for (const g of ordered) g.items.sort((a,b) => (a.number||0) - (b.number||0))
  return ordered
})

// ===== MÉTODOS PRINCIPALES =====

/**
 * Cargar perfiles del usuario
 */
const loadProfiles = async () => {
  state.loading = true
  try {
    const response = await apiService.getWaiterTableProfiles({ include: 'tables' })
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
/* Main content styles */
.profiles-content {
  text-align: left;
  margin-bottom: 32px;
}

.profiles-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: rgb(16, 0, 43);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.profiles-title i {
  color: #9f54fd;
  font-size: 22px;
}

.profiles-subtitle {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.4;
}

.add-profile-btn {
  width: 100%;
  background: linear-gradient(135deg, #9f54fd 0%, #7c3aed 100%);
  border: none;
  border-radius: 16px;
  padding: 9px;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(159, 84, 253, 0.3);
  letter-spacing: -0.01em;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(159, 84, 253, 0.4);
  }

  i {
    font-size: 18px;
  }
}

.profiles-list {
  display: grid;
  gap: 16px;
}

.profile-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s ease;
  margin-top: 20px;
}

/* Variantes de tarjeta */
.profile-card.starter { padding: 16px 16px; }
.profile-card.compact { padding: 14px 16px; }

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

.profile-row { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.row-left { display:flex; flex-direction:column; gap:6px; min-width:0; }
.row-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

.profile-name {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
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

.created-date { color:#6c757d; font-size:13px; }

.table-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
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

/* Empty state styles */
.empty-state {
  text-align: center;
  padding: 40px 20px 20px;
  margin-top: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.empty-icon i {
  font-size: 32px;
  color: #9ca3af;
}

.empty-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.empty-subtitle {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 24px;
}

.create-first-btn {
  background: #3b82f6;
  border: none;
  border-radius: 12px;
  padding: 14px 32px;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
  letter-spacing: -0.01em;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  i {
    font-size: 16px;
  }
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

/* Descripción superior del modal */
.modal-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

/* Toolbar de la vista list */
.pm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.pm-toolbar .toolbar-cta {
  width: 100%;
  background: linear-gradient(135deg, #9f54fd 0%, #7c3aed 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  height: 44px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(159,84,253,.28);
}
.pm-toolbar .toolbar-cta i { font-size: 18px; }

/* Chip suave como en el diseño */
.pm-chip.soft {
  background: #f1e9ff;
  color: #6b2adf;
  border: 1px solid rgba(159,84,253,.25);
}

/* Chip tipo pill con burbuja numérica */
.count-pill {
  display:inline-flex; justify-content: center; align-items:center; gap:8px;
  background:#efe7ff; color:#6b2adf; border:1px solid rgba(159,84,253,.25);
  border-radius:999px; padding:6px 10px; font-weight:600; font-size:12px;
}
.count-pill .bubble {
  width:22px; height:22px; border-radius:999px; background:white; color:#6b2adf;
  display:flex; align-items:center; justify-content:center; border:1px solid rgba(159,84,253,.35);
  font-size:12px; font-weight:700;
}

/* Modal styles with purple theme */
.pm-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,.6); 
  backdrop-filter: blur(4px); 
  display: flex; 
  align-items: center;
  justify-content: center; 
  z-index: 3500; 
  padding: 20px;
}

.pm-modal { 
  background: #ffffff; 
  border: none; 
  border-radius: 20px; 
  width: 100%; 
  max-width: 600px;
  max-height: 90vh;
  box-shadow: 0 25px 60px rgba(16,0,43,.15); 
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.pm-header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 12px 0; 
  border-bottom: 1px solid rgba(159, 84, 253, 0.1);
  flex-shrink: 0;
}

.pm-title { 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 700; 
  color: rgb(16,0,43); 
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.pm-title .pm-icon { 
  color: var(--brand-primary, #9f54fd); 
  font-size: 20px;
}

.pm-close { 
  background: rgba(107, 114, 128, 0.1); 
  border: none; 
  color: #6b7280; 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
  cursor: pointer;
}
.pm-close:hover { 
  background: rgba(159, 84, 253, 0.1); 
  color: #9f54fd; 
  transform: scale(1.1);
}

.pm-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

/* Form styles */
.pm-field {
  margin-bottom: 24px;
}

.pm-label {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgb(16,0,43);
  margin-bottom: 8px;
  display: block;
}

.pm-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgb(16,0,43);
}

.pm-chip {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.pm-chip.primary {
  background: linear-gradient(135deg, #e8dbff 0%, #dac8ff 100%);
  color: #6b2adf;
  border: 1px solid rgba(159, 84, 253, 0.3);
}

.pm-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e9d8ff;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(159, 84, 253, 0.05);
}

.pm-input:focus {
  outline: none;
  border-color: #9f54fd;
  box-shadow: 0 4px 12px rgba(159, 84, 253, 0.15);
}

.pm-input::placeholder {
  color: #9ca3af;
  font-size: 15px;
}

/* Tables container and sections */
.pm-tables-container {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border: 2px solid #e9d8ff;
  border-radius: 16px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(159, 84, 253, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(159, 84, 253, 0.4);
    border-radius: 3px;
    
    &:hover {
      background: rgba(159, 84, 253, 0.6);
    }
  }
}

.pm-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.pm-section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: rgb(16,0,43);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(159, 84, 253, 0.2);
  letter-spacing: -0.01em;
}

.pm-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.pm-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 2px solid rgba(159, 84, 253, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(159, 84, 253, 0.05);

  &:hover:not(.disabled) {
    border-color: rgba(159, 84, 253, 0.3);
    box-shadow: 0 4px 8px rgba(159, 84, 253, 0.1);
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pm-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(159, 84, 253, 0.3);
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  position: relative;
  appearance: none;
  margin: 0;
  transition: all 0.2s ease;

  &:checked {
    background: linear-gradient(135deg, #9f54fd 0%, #7c3aed 100%);
    border-color: #9f54fd;

    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  }

  &:hover:not(:disabled) {
    border-color: rgba(159, 84, 253, 0.5);
  }
}

.pm-option-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pm-option-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgb(16,0,43);
  letter-spacing: -0.01em;
}

.pm-option-meta {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
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

/* Modal actions */
.pm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(159, 84, 253, 0.1);
}

.pm-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.pm-btn.outline {
  background: transparent;
  border: 2px solid rgba(159, 84, 253, 0.3);
  color: #9f54fd;

  &:hover:not(:disabled) {
    background: rgba(159, 84, 253, 0.1);
    border-color: rgba(159, 84, 253, 0.5);
  }
}

.pm-btn.primary {
  background: linear-gradient(135deg, #9f54fd 0%, #7c3aed 100%);
  color: white;
  border: none;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(159, 84, 253, 0.3);
  }
}

.pm-btn i {
  font-size: 16px;
}

/* Tarjetas compactas del listado */
.compact-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.compact-info { display:flex; flex-direction:column; gap:4px; }
.compact-title { font-weight:700; font-size:16px; color:#111827; }
.compact-sub { font-size:13px; color:#6b7280; }
.compact-actions { display:flex; align-items:center; gap:10px; }
.icon-btn { width:36px; height:36px; border:none; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.icon-btn.edit { background:#e0e7ff; color:#1d4ed8; }
.icon-btn.delete { background:#fee2e2; color:#b91c1c; }

/* Estilos modernos para las tarjetas */
.profile-card.modern {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-card.modern:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-card.modern .profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.profile-card.modern .profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.profile-card.modern .profile-name {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.2;
}

.profile-card.modern .profile-description {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
  line-height: 1.2;
}

.profile-card.modern .profile-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.table-count-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  white-space: nowrap;
}

.action-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.action-icon-btn.edit {
  background: #f0f9ff;
  color: #0369a1;
}

.action-icon-btn.edit:hover {
  background: #e0f2fe;
  color: #0c4a6e;
}

.action-icon-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-icon-btn.delete:hover {
  background: #fee2e2;
  color: #b91c1c;
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