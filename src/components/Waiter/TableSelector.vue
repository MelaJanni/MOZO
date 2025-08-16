<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-table"></i>
          Seleccionar Mesas para Activar
        </h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando mesas disponibles...</p>
        </div>

        <div v-else>
          <div class="selection-summary" v-if="selectedTables.length > 0">
            <strong>{{ selectedTables.length }} mesa(s) seleccionada(s)</strong>
          </div>

          <div class="tables-grid">
            <div 
              v-for="table in availableTables" 
              :key="table.id"
              class="table-card"
              :class="{ 'selected': selectedTables.includes(table.id) }"
              @click="toggleTable(table.id)"
            >
              <div class="table-checkbox">
                <input 
                  type="checkbox" 
                  :checked="selectedTables.includes(table.id)"
                  @click.stop
                  @change="toggleTable(table.id)"
                >
              </div>
              <div class="table-info">
                <div class="table-number">Mesa {{ table.number }}</div>
                <div v-if="table.name && table.name !== `Mesa ${table.number}`" class="table-name">
                  {{ table.name }}
                </div>
                <div class="table-details">
                  <span v-if="table.capacity">
                    <i class="fas fa-users"></i>
                    {{ table.capacity }} personas
                  </span>
                  <span v-if="table.location">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ table.location }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Mensaje si no hay mesas disponibles -->
            <div v-if="availableTables.length === 0" class="empty-state">
              <i class="fas fa-table"></i>
              <p>No hay mesas disponibles para activar</p>
              <small>Todas las mesas ya están asignadas a otros mozos</small>
            </div>
          </div>

          <!-- Quick selection buttons -->
          <div class="quick-actions" v-if="availableTables.length > 0">
            <button @click="selectAll" class="quick-btn">
              <i class="fas fa-check-double"></i>
              Seleccionar Todas ({{ availableTables.length }})
            </button>
            <button @click="selectNone" class="quick-btn" v-if="selectedTables.length > 0">
              <i class="fas fa-times"></i>
              Deseleccionar Todas
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancelar
        </button>
        <button 
          @click="confirmSelection" 
          class="btn btn-primary"
          :disabled="selectedTables.length === 0 || loading"
        >
          <i class="fas fa-check"></i>
          Activar {{ selectedTables.length }} Mesa(s)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
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
const emit = defineEmits(['close', 'tables-selected'])

// Estado
const selectedTables = ref([])
const loading = ref(false)

// Computed
const availableTables = computed(() => props.availableTables || [])

// Métodos
const toggleTable = (tableId) => {
  const index = selectedTables.value.indexOf(tableId)
  if (index === -1) {
    selectedTables.value.push(tableId)
  } else {
    selectedTables.value.splice(index, 1)
  }
}

const selectAll = () => {
  selectedTables.value = availableTables.value.map(table => table.id)
}

const selectNone = () => {
  selectedTables.value = []
}

const confirmSelection = () => {
  console.log('🎯 TableSelector: Confirmando selección de mesas:', selectedTables.value)
  emit('tables-selected', selectedTables.value)
}

// Lifecycle
onMounted(() => {
  console.log('🏠 TableSelector mounted')
  console.log('📋 Mesas disponibles recibidas:', props.availableTables)
  console.log('📋 Mesas asignadas recibidas:', props.assignedTables)
  console.log('Available tables:', availableTables.value)
  console.log('Assigned tables:', props.assignedTables)
})
</script>

<style scoped>
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.selection-summary {
  background: #e3f2fd;
  color: #1565c0;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.table-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.table-card:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.table-card.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.table-checkbox {
  margin-top: 2px;
}

.table-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.table-info {
  flex: 1;
}

.table-number {
  font-weight: bold;
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 4px;
}

.table-name {
  font-size: 14px;
  color: #495057;
  margin-bottom: 8px;
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-details span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c757d;
}

.quick-actions {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #e9ecef;
  margin-top: 16px;
}

.quick-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: #007bff;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  grid-column: 1 / -1;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-state p {
  margin-bottom: 8px;
  font-size: 16px;
}

.empty-state small {
  font-size: 13px;
  opacity: 0.7;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>