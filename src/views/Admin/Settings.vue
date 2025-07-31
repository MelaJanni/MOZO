<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const success = ref('')
const business = ref(null)
const tables = ref([])
const showAddTableModal = ref(false)
const showEditTableModal = ref(false)
const showDeleteTableModal = ref(false)
const selectedTable = ref(null)

const newTable = reactive({
  number: '',
  name: '',
  capacity: 4
})

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const [businessData, tablesData] = await Promise.all([
      adminStore.fetchBusinessData(),
      adminStore.fetchTables()
    ])
    
    business.value = businessData || {}
    tables.value = tablesData || []
  } catch (err) {
    error.value = err.message || 'Error al cargar datos'
  } finally {
    isLoading.value = false
  }
})

const saveBusinessSettings = async () => {
  if (!business.value) return
  
  isLoading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await adminStore.updateBusinessData(business.value)
    success.value = 'Configuración guardada con éxito'
  } catch (err) {
    error.value = err.message || 'Error al guardar configuración'
  } finally {
    isLoading.value = false
  }
}

const addTable = async () => {
  if (!newTable.number || !newTable.capacity) {
    error.value = 'Por favor, completa todos los campos requeridos'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const result = await adminStore.createTable(newTable)
    
    if (result) {
      tables.value.push(result)
      
      newTable.number = ''
      newTable.name = ''
      newTable.capacity = 4
      showAddTableModal.value = false
    }
  } catch (err) {
    error.value = err.message || 'Error al crear mesa'
  } finally {
    isLoading.value = false
  }
}

const openEditTableModal = (table) => {
  selectedTable.value = { ...table }
  showEditTableModal.value = true
}

const editTable = async () => {
  if (!selectedTable.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    await adminStore.updateTable(selectedTable.value)
    
    tables.value = tables.value.map(table => {
      if (table.id === selectedTable.value.id) {
        return selectedTable.value
      }
      return table
    })
    
    showEditTableModal.value = false
    selectedTable.value = null
  } catch (err) {
    error.value = err.message || 'Error al actualizar mesa'
  } finally {
    isLoading.value = false
  }
}

const openDeleteTableModal = (table) => {
  selectedTable.value = table
  showDeleteTableModal.value = true
}

const deleteTable = async () => {
  if (!selectedTable.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    await adminStore.deleteTable(selectedTable.value.id)
    
    tables.value = tables.value.filter(table => table.id !== selectedTable.value.id)
    
    showDeleteTableModal.value = false
    selectedTable.value = null
  } catch (err) {
    error.value = err.message || 'Error al eliminar mesa'
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'admin-home' })
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <button class="back-button" @click="goBack">
        ← Volver
      </button>
      <h1>Configuración</h1>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando configuración...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <BaseButton @click="$router.go(0)" variant="primary">
        Reintentar
      </BaseButton>
    </div>
    
    <div v-else-if="business" class="settings-content">
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      
      <div class="settings-section">
        <h2>Información del negocio</h2>
        
        <form @submit.prevent="saveBusinessSettings" class="business-form">
          <div class="form-group">
            <label for="business-name">Nombre del restaurante</label>
            <input 
              id="business-name"
              type="text" 
              v-model="business.name" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="business-address">Dirección</label>
            <input 
              id="business-address"
              type="text" 
              v-model="business.address" 
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="business-phone">Teléfono</label>
              <input 
                id="business-phone"
                type="tel" 
                v-model="business.phone" 
              />
            </div>
            
            <div class="form-group">
              <label for="business-email">Email</label>
              <input 
                id="business-email"
                type="email" 
                v-model="business.email" 
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="business-description">Descripción</label>
            <textarea 
              id="business-description"
              v-model="business.description" 
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <BaseButton 
              type="submit" 
              variant="primary" 
              :loading="isLoading"
            >
              Guardar cambios
            </BaseButton>
          </div>
        </form>
      </div>
      
      <div class="settings-section">
        <div class="section-header">
          <h2>Mesas</h2>
          <BaseButton @click="showAddTableModal = true" variant="primary">
            Añadir mesa
          </BaseButton>
        </div>
        
        <div v-if="tables.length === 0" class="empty-tables">
          <p>No hay mesas configuradas</p>
          <p>Añade mesas para que los clientes puedan hacer pedidos</p>
        </div>
        
        <div v-else class="tables-list">
          <div 
            v-for="table in tables" 
            :key="table.id" 
            class="table-card"
          >
            <div class="table-info">
              <div class="table-number">{{ table.number }}</div>
              <div class="table-details">
                <span class="table-name">{{ table.name || `Mesa ${table.number}` }}</span>
                <span class="table-capacity">{{ table.capacity }} personas</span>
              </div>
            </div>
            
            <div class="table-actions">
              <button 
                @click="openEditTableModal(table)" 
                class="edit-button"
              >
                Editar
              </button>
              
              <button 
                @click="openDeleteTableModal(table)" 
                class="delete-button"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section danger-zone">
        <h2>Cerrar Sesión</h2>
        <p>Finaliza tu sesión actual de forma segura.</p>
        <BaseButton @click="logout" variant="danger-outline">
          Cerrar sesión
        </BaseButton>
      </div>
    </div>
    
    <BaseModal 
      v-model="showAddTableModal" 
      title="Añadir nueva mesa" 
      size="md"
    >
      <form @submit.prevent="addTable" class="table-form">
        <div class="form-row">
          <div class="form-group">
            <label for="table-number">Número*</label>
            <input 
              id="table-number"
              type="number" 
              v-model="newTable.number" 
              min="1"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="table-capacity">Capacidad*</label>
            <input 
              id="table-capacity"
              type="number" 
              v-model="newTable.capacity" 
              min="1"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="table-name">Nombre (opcional)</label>
          <input 
            id="table-name"
            type="text" 
            v-model="newTable.name" 
            placeholder="Ej: Terraza 1"
          />
        </div>
      </form>
      
      <template #footer>
        <BaseButton @click="showAddTableModal = false" variant="outline">
          Cancelar
        </BaseButton>
        
        <BaseButton @click="addTable" variant="primary" :loading="isLoading">
          Añadir
        </BaseButton>
      </template>
    </BaseModal>
    
    <BaseModal 
      v-if="selectedTable"
      v-model="showEditTableModal" 
      title="Editar mesa" 
      size="md"
    >
      <form @submit.prevent="editTable" class="table-form">
        <div class="form-row">
          <div class="form-group">
            <label for="edit-table-number">Número*</label>
            <input 
              id="edit-table-number"
              type="number" 
              v-model="selectedTable.number" 
              min="1"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="edit-table-capacity">Capacidad*</label>
            <input 
              id="edit-table-capacity"
              type="number" 
              v-model="selectedTable.capacity" 
              min="1"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="edit-table-name">Nombre (opcional)</label>
          <input 
            id="edit-table-name"
            type="text" 
            v-model="selectedTable.name" 
            placeholder="Ej: Terraza 1"
          />
        </div>
      </form>
      
      <template #footer>
        <BaseButton @click="showEditTableModal = false" variant="outline">
          Cancelar
        </BaseButton>
        
        <BaseButton @click="editTable" variant="primary" :loading="isLoading">
          Guardar
        </BaseButton>
      </template>
    </BaseModal>
    
    <BaseModal 
      v-if="selectedTable"
      v-model="showDeleteTableModal" 
      title="Eliminar mesa" 
      size="sm"
    >
      <div class="confirm-content">
        <p>¿Estás seguro de que deseas eliminar la mesa {{ selectedTable.number }}?</p>
        <p class="confirm-warning">Esta acción no se puede deshacer.</p>
      </div>
      
      <template #footer>
        <BaseButton @click="showDeleteTableModal = false" variant="outline">
          Cancelar
        </BaseButton>
        
        <BaseButton @click="deleteTable" variant="danger" :loading="isLoading">
          Eliminar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.settings-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.back-button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.settings-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.success-message {
  background-color: #dcfce7;
  color: #166534;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  margin-bottom: 1rem;
}

.settings-section {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.settings-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.business-form, .table-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.form-group input, .form-group select, .form-group textarea {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.empty-tables {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  text-align: center;
}

.empty-tables p:first-child {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-tables p:last-child {
  color: #6b7280;
}

.tables-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.table-card {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.table-number {
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 600;
}

.table-details {
  display: flex;
  flex-direction: column;
}

.table-name {
  font-weight: 600;
}

.table-capacity {
  font-size: 0.75rem;
  color: #6b7280;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button, .delete-button {
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.edit-button {
  color: var(--primary-color);
}

.edit-button:hover {
  background-color: rgba(124, 108, 243, 0.1);
}

.delete-button {
  color: var(--error-color);
}

.delete-button:hover {
  background-color: #fee2e2;
}

.confirm-content {
  text-align: center;
  padding: 1rem 0;
}

.confirm-warning {
  color: var(--error-color);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.danger-zone {
  border-top: 2px solid #f8d7da;
  padding-top: 1.5rem;
  margin-top: 2rem;
}

.danger-zone h2 {
  color: #dc3545;
}
</style> 