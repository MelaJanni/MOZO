<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'

const router = useRouter()
const adminStore = useAdminStore()

const isLoading = ref(false)
const error = ref('')
const requests = ref([])
const selectedRequest = ref(null)
const showRequestDetails = ref(false)
const filterStatus = ref('all')

const sortedRequests = computed(() => {
  return [...requests.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const filteredRequests = computed(() => {
  if (filterStatus.value === 'all') {
    return sortedRequests.value
  }
  return sortedRequests.value.filter(request => request.status === filterStatus.value)
})

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const requestsData = await adminStore.fetchRequests()
    requests.value = requestsData || []
  } catch (err) {
    error.value = err.message || 'Error al cargar pedidos'
  } finally {
    isLoading.value = false
  }
})

const viewRequestDetails = (request) => {
  selectedRequest.value = request
  showRequestDetails.value = true
}

const updateRequestStatus = async (requestId, newStatus) => {
  isLoading.value = true
  error.value = ''
  
  try {
    await adminStore.updateRequestStatus(requestId, newStatus)
    
    requests.value = requests.value.map(req => {
      if (req.id === requestId) {
        return { ...req, status: newStatus }
      }
      return req
    })
    
    if (selectedRequest.value && selectedRequest.value.id === requestId) {
      selectedRequest.value = { ...selectedRequest.value, status: newStatus }
    }
  } catch (err) {
    error.value = err.message || 'Error al actualizar el estado del pedido'
  } finally {
    isLoading.value = false
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'status-pending'
    case 'processing':
      return 'status-processing'
    case 'ready':
      return 'status-ready'
    case 'delivered':
      return 'status-delivered'
    case 'cancelled':
      return 'status-cancelled'
    default:
      return ''
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'processing':
      return 'En preparación'
    case 'ready':
      return 'Listo'
    case 'delivered':
      return 'Entregado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push({ name: 'admin-home' })
}
</script>

<template>
  <div class="requests-container">
    <div class="requests-header">
      <button class="back-button" @click="goBack">
        ← Volver
      </button>
      <h1>Pedidos</h1>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando pedidos...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <BaseButton @click="$router.go(0)" variant="primary">
        Reintentar
      </BaseButton>
    </div>
    
    <div v-else class="requests-content">
      <div class="requests-filters">
        <div class="filter-group">
          <label>Filtrar por estado:</label>
          <select v-model="filterStatus">
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="processing">En preparación</option>
            <option value="ready">Listos</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        
        <div class="request-stats">
          <div class="stat-pill">
            <span>Total: {{ requests.length }}</span>
          </div>
          <div class="stat-pill status-pending">
            <span>Pendientes: {{ requests.filter(r => r.status === 'pending').length }}</span>
          </div>
          <div class="stat-pill status-ready">
            <span>Listos: {{ requests.filter(r => r.status === 'ready').length }}</span>
          </div>
        </div>
      </div>
      
      <div class="requests-list">
        <div v-if="filteredRequests.length === 0" class="empty-requests">
          <p>No hay pedidos {{ filterStatus !== 'all' ? 'con este filtro' : '' }}</p>
        </div>
        
        <div v-else class="request-cards">
          <div 
            v-for="request in filteredRequests" 
            :key="request.id" 
            class="request-card"
            @click="viewRequestDetails(request)"
          >
            <div class="request-header">
              <div class="request-id">#{{ request.id.substring(0, 8) }}</div>
              <div :class="['request-status', getStatusClass(request.status)]">
                {{ getStatusText(request.status) }}
              </div>
            </div>
            
            <div class="request-info">
              <div class="request-table">
                <span class="info-label">Mesa:</span>
                <span>{{ request.table.name || `Mesa ${request.table.number}` }}</span>
              </div>
              
              <div class="request-time">
                <span class="info-label">Hora:</span>
                <span>{{ formatDate(request.createdAt) }}</span>
              </div>
              
              <div class="request-items">
                <span class="info-label">Productos:</span>
                <span>{{ request.items.length }} items</span>
              </div>
              
              <div class="request-total">
                <span class="info-label">Total:</span>
                <span class="total-price">{{ request.total.toFixed(2) }}€</span>
              </div>
            </div>
            
            <div class="request-actions">
              <BaseButton size="sm" variant="primary">
                Ver detalles
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <BaseModal 
      v-model="showRequestDetails" 
      title="Detalles del pedido" 
      size="lg"
    >
      <div v-if="selectedRequest" class="request-details">
        <div class="details-header">
          <div class="detail-group">
            <span class="detail-label">Pedido:</span>
            <span class="detail-value">#{{ selectedRequest.id.substring(0, 8) }}</span>
          </div>
          
          <div class="detail-group">
            <span class="detail-label">Estado:</span>
            <span :class="['detail-value', 'status-badge', getStatusClass(selectedRequest.status)]">
              {{ getStatusText(selectedRequest.status) }}
            </span>
          </div>
          
          <div class="detail-group">
            <span class="detail-label">Fecha:</span>
            <span class="detail-value">{{ formatDate(selectedRequest.createdAt) }}</span>
          </div>
          
          <div class="detail-group">
            <span class="detail-label">Mesa:</span>
            <span class="detail-value">{{ selectedRequest.table.name || `Mesa ${selectedRequest.table.number}` }}</span>
          </div>
        </div>
        
        <div class="details-items">
          <h3>Productos</h3>
          
          <div class="items-list">
            <div 
              v-for="(item, index) in selectedRequest.items" 
              :key="index" 
              class="item-row"
            >
              <div class="item-details">
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.variant" class="item-variant">{{ item.variant }}</span>
                <div v-if="item.notes" class="item-notes">
                  <span>Notas: {{ item.notes }}</span>
                </div>
              </div>
              
              <div class="item-quantity">
                {{ item.quantity }}x
              </div>
              
              <div class="item-price">
                {{ (item.price * item.quantity).toFixed(2) }}€
              </div>
            </div>
          </div>
          
          <div class="order-total">
            <span>Total:</span>
            <span class="total-amount">{{ selectedRequest.total.toFixed(2) }}€</span>
          </div>
        </div>
        
        <div class="details-actions">
          <h3>Actualizar estado</h3>
          
          <div class="status-buttons">
            <BaseButton 
              :disabled="selectedRequest.status === 'pending'"
              @click="updateRequestStatus(selectedRequest.id, 'pending')"
              variant="outline"
              size="sm"
            >
              Pendiente
            </BaseButton>
            
            <BaseButton 
              :disabled="selectedRequest.status === 'processing'"
              @click="updateRequestStatus(selectedRequest.id, 'processing')"
              variant="outline"
              size="sm"
            >
              En preparación
            </BaseButton>
            
            <BaseButton 
              :disabled="selectedRequest.status === 'ready'"
              @click="updateRequestStatus(selectedRequest.id, 'ready')"
              variant="outline"
              size="sm"
            >
              Listo
            </BaseButton>
            
            <BaseButton 
              :disabled="selectedRequest.status === 'delivered'"
              @click="updateRequestStatus(selectedRequest.id, 'delivered')"
              variant="outline"
              size="sm"
            >
              Entregado
            </BaseButton>
            
            <BaseButton 
              :disabled="selectedRequest.status === 'cancelled'"
              @click="updateRequestStatus(selectedRequest.id, 'cancelled')"
              variant="danger"
              size="sm"
            >
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
      
      <template #footer>
        <BaseButton @click="showRequestDetails = false" variant="outline">
          Cerrar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.requests-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.requests-header {
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

.requests-header h1 {
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

.requests-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.requests-filters {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-group select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
}

.request-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-pill {
  background-color: #f3f4f6;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-requests {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 0.5rem;
  padding: 3rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.request-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.request-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-id {
  font-weight: 600;
  font-size: 0.875rem;
}

.request-status {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-processing {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-ready {
  background-color: #dcfce7;
  color: #166534;
}

.status-delivered {
  background-color: #e0e7ff;
  color: #4338ca;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #b91c1c;
}

.request-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  margin-right: 0.25rem;
}

.total-price {
  font-weight: 600;
  color: var(--primary-color);
}

.request-actions {
  display: flex;
  justify-content: flex-end;
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-value {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.details-items h3, .details-actions h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background-color: #f9fafb;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 500;
}

.item-variant {
  font-size: 0.75rem;
  color: #6b7280;
}

.item-notes {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.25rem;
}

.item-quantity {
  font-weight: 500;
  margin: 0 1rem;
}

.item-price {
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.total-amount {
  color: var(--primary-color);
  font-size: 1.125rem;
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style> 