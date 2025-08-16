<template>
  <div class="debug-api-tester">
    <div class="debug-header">
      <h3>🔧 Debug API Tester</h3>
      <p>Herramienta para probar las APIs de negocios y mesas</p>
    </div>

    <div class="debug-section">
      <h4>1. Test Negocios</h4>
      <button @click="testGetBusinesses" class="debug-btn" :disabled="loading">
        Probar GET /api/waiter/businesses
      </button>
      <pre v-if="businessesResult">{{ JSON.stringify(businessesResult, null, 2) }}</pre>
    </div>

    <div class="debug-section" v-if="selectedBusinessId">
      <h4>2. Test Mesas del Negocio</h4>
      <button @click="testGetBusinessTables" class="debug-btn" :disabled="loading">
        Probar GET /api/waiter/businesses/{{ selectedBusinessId }}/tables
      </button>
      <pre v-if="businessTablesResult">{{ JSON.stringify(businessTablesResult, null, 2) }}</pre>
    </div>

    <div class="debug-section">
      <h4>3. Test Mesas Disponibles</h4>
      <button @click="testGetAvailableTables" class="debug-btn" :disabled="loading">
        Probar GET /api/waiter/tables/available
      </button>
      <pre v-if="availableTablesResult">{{ JSON.stringify(availableTablesResult, null, 2) }}</pre>
    </div>

    <div class="debug-section">
      <h4>4. Test Mesas Asignadas</h4>
      <button @click="testGetAssignedTables" class="debug-btn" :disabled="loading">
        Probar GET /api/waiter/tables/assigned
      </button>
      <pre v-if="assignedTablesResult">{{ JSON.stringify(assignedTablesResult, null, 2) }}</pre>
    </div>

    <div class="debug-section" v-if="businessCodeToJoin">
      <h4>5. Test Unirse a Negocio</h4>
      <input v-model="businessCodeToJoin" placeholder="Código del negocio" />
      <button @click="testJoinBusiness" class="debug-btn" :disabled="loading">
        Probar POST /api/waiter/join-business
      </button>
      <pre v-if="joinBusinessResult">{{ JSON.stringify(joinBusinessResult, null, 2) }}</pre>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Probando API...</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import waiterCallsService from '@/services/waiterCallsService'
import { apiService } from '@/services/api'

// Estado
const loading = ref(false)
const businessesResult = ref(null)
const businessTablesResult = ref(null)
const availableTablesResult = ref(null)
const assignedTablesResult = ref(null)
const joinBusinessResult = ref(null)
const selectedBusinessId = ref(null)
const businessCodeToJoin = ref('FGT-464')

// Tests
const testGetBusinesses = async () => {
  loading.value = true
  businessesResult.value = null
  
  try {
    console.log('🧪 Testing GET /api/waiter/businesses')
    const response = await waiterCallsService.getWaiterBusinesses()
    businessesResult.value = response
    
    // Si hay negocios, seleccionar el primero para testing
    if (response.success && response.businesses && response.businesses.length > 0) {
      selectedBusinessId.value = response.businesses[0].id
    }
    
    console.log('✅ Resultado:', response)
  } catch (error) {
    console.error('❌ Error:', error)
    businessesResult.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

const testGetBusinessTables = async () => {
  if (!selectedBusinessId.value) return
  
  loading.value = true
  businessTablesResult.value = null
  
  try {
    console.log('🧪 Testing GET /api/waiter/businesses/' + selectedBusinessId.value + '/tables')
    const response = await waiterCallsService.getWaiterBusinessTables(selectedBusinessId.value)
    businessTablesResult.value = response
    console.log('✅ Resultado:', response)
  } catch (error) {
    console.error('❌ Error:', error)
    businessTablesResult.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

const testGetAvailableTables = async () => {
  loading.value = true
  availableTablesResult.value = null
  
  try {
    console.log('🧪 Testing GET /api/waiter/tables/available')
    const response = await waiterCallsService.getAvailableTables()
    availableTablesResult.value = response
    console.log('✅ Resultado:', response)
  } catch (error) {
    console.error('❌ Error:', error)
    availableTablesResult.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

const testGetAssignedTables = async () => {
  loading.value = true
  assignedTablesResult.value = null
  
  try {
    console.log('🧪 Testing GET /api/waiter/tables/assigned')
    const response = await waiterCallsService.getAssignedTables()
    assignedTablesResult.value = response
    console.log('✅ Resultado:', response)
  } catch (error) {
    console.error('❌ Error:', error)
    assignedTablesResult.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

const testJoinBusiness = async () => {
  if (!businessCodeToJoin.value) return
  
  loading.value = true
  joinBusinessResult.value = null
  
  try {
    console.log('🧪 Testing POST /api/waiter/join-business with code:', businessCodeToJoin.value)
    const response = await waiterCallsService.joinBusinessWithCode(businessCodeToJoin.value)
    joinBusinessResult.value = response
    console.log('✅ Resultado:', response)
  } catch (error) {
    console.error('❌ Error:', error)
    joinBusinessResult.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

// Test directo con apiService
const testDirectAPI = async () => {
  try {
    console.log('🧪 Testing direct apiService call')
    const response = await apiService.get('waiter/businesses')
    console.log('✅ Direct API result:', response)
  } catch (error) {
    console.error('❌ Direct API error:', error)
  }
}
</script>

<style scoped>
.debug-api-tester {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.debug-header {
  text-align: center;
  margin-bottom: 30px;
}

.debug-header h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.debug-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.debug-section h4 {
  color: #495057;
  margin-bottom: 15px;
}

.debug-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;
  font-size: 14px;
}

.debug-btn:hover:not(:disabled) {
  background: #0056b3;
}

.debug-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin-right: 10px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #6c757d;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e9ecef;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>