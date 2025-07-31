<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const adminStore = useAdminStore()

const isLoading = ref(false)
const error = ref('')
const tables = ref([])
const selectedTable = ref(null)
const qrCode = ref(null)

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const tableData = await adminStore.fetchTables()
    tables.value = tableData || []
  } catch (err) {
    error.value = err.message || 'Error al cargar mesas'
  } finally {
    isLoading.value = false
  }
})

const selectTable = (table) => {
  selectedTable.value = table
  const baseUrl = window.location.origin
  qrCode.value = `${baseUrl}/menu?tableId=${table.id}`
}

const downloadQR = () => {
  alert('Función de descarga no implementada')
}

const goBack = () => {
  router.push({ name: 'admin-home' })
}
</script>

<template>
  <div class="qrcode-container">
    <div class="qrcode-header">
      <button class="back-button" @click="goBack">
        ← Volver
      </button>
      <h1>Códigos QR</h1>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando mesas...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <BaseButton @click="$router.go(0)" variant="primary">
        Reintentar
      </BaseButton>
    </div>
    
    <div v-else class="qrcode-content">
      <div class="qrcode-instructions">
        <h2>Genera códigos QR para tus mesas</h2>
        <p>Selecciona una mesa para generar su código QR. Los clientes podrán escanear este código para ver el menú y realizar pedidos.</p>
      </div>
      
      <div class="qrcode-layout">
        <div class="tables-list">
          <h3>Mesas disponibles</h3>
          
          <div v-if="tables.length === 0" class="empty-tables">
            <p>No hay mesas configuradas</p>
            <BaseButton @click="router.push({ name: 'admin-settings' })" variant="primary">
              Configurar mesas
            </BaseButton>
          </div>
          
          <div v-else class="tables-grid">
            <div 
              v-for="table in tables" 
              :key="table.id" 
              class="table-card"
              :class="{ 'selected': selectedTable && selectedTable.id === table.id }"
              @click="selectTable(table)"
            >
              <div class="table-number">{{ table.number }}</div>
              <div class="table-info">
                <span>{{ table.name || `Mesa ${table.number}` }}</span>
                <span class="table-capacity">{{ table.capacity }} personas</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="qr-preview">
          <h3>Vista previa</h3>
          
          <div v-if="!selectedTable" class="empty-preview">
            <p>Selecciona una mesa para generar su código QR</p>
          </div>
          
          <div v-else class="qr-display">
            <div class="qr-image">
              <div class="mock-qr"></div>
            </div>
            
            <div class="qr-info">
              <p>Mesa: {{ selectedTable.name || `Mesa ${selectedTable.number}` }}</p>
              <p class="qr-url">{{ qrCode }}</p>
              
              <div class="qr-actions">
                <BaseButton @click="downloadQR" variant="primary">
                  Descargar QR
                </BaseButton>
                
                <BaseButton variant="outline">
                  Imprimir
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qrcode-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.qrcode-header {
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

.qrcode-header h1 {
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

.qrcode-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.qrcode-instructions {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.qrcode-instructions h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.qrcode-instructions p {
  color: #6b7280;
}

.qrcode-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .qrcode-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.tables-list, .qr-preview {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.tables-list h3, .qr-preview h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.empty-tables, .empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  text-align: center;
}

.empty-tables p, .empty-preview p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  max-height: 350px;
  overflow-y: auto;
}

.table-card {
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.table-card:hover {
  background-color: #e5e7eb;
}

.table-card.selected {
  background-color: rgba(124, 108, 243, 0.1);
  border: 2px solid var(--primary-color);
}

.table-number {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.table-info {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.table-capacity {
  color: #6b7280;
  font-size: 0.75rem;
}

.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-image {
  width: 200px;
  height: 200px;
}

.mock-qr {
  width: 100%;
  height: 100%;
  background-color: #f3f4f6;
  background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), 
                    linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  border: 1px solid #d1d5db;
}

.qr-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.qr-url {
  font-size: 0.75rem;
  color: #6b7280;
  word-break: break-all;
  margin-bottom: 0.5rem;
}

.qr-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style> 