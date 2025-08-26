<template>
  <div class="business-selector">
    <!-- Selector de negocio activo -->
    <div v-if="businesses.length > 0" class="business-dropdown">
      <div class="current-business" @click="showDropdown = !showDropdown">
        <div class="business-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="business-details">
          <div class="business-name">{{ currentBusiness?.name || 'Seleccionar Negocio' }}</div>
          <div class="business-subtitle">{{ businesses.length }} negocio{{ businesses.length !== 1 ? 's' : '' }}</div>
        </div>
        <div class="dropdown-arrow">
          <i class="fas fa-chevron-down" :class="{ 'rotated': showDropdown }"></i>
        </div>
      </div>

      <!-- Dropdown de negocios -->
      <div v-if="showDropdown" class="dropdown-menu">
        <div class="dropdown-header">
          <h4>Mis Negocios</h4>
          <button @click="showDropdown = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="businesses-list">
          <button
            v-for="business in businesses"
            :key="business.id"
            @click="selectBusiness(business)"
            class="business-item"
            :class="{ 'active': currentBusiness?.id === business.id }"
          >
            <div class="business-info">
              <div class="business-name">{{ business.name }}</div>
              <div class="business-address">{{ business.address || 'Sin dirección' }}</div>
            </div>
            <div v-if="currentBusiness?.id === business.id" class="current-indicator">
              <i class="fas fa-check"></i>
            </div>
          </button>
        </div>

        <div class="dropdown-footer">
          <button @click="showJoinForm = true; showDropdown = false" class="join-btn">
            <i class="fas fa-plus"></i>
            Unirse a nuevo negocio
          </button>
        </div>
      </div>
    </div>

    <!-- Estado cuando no hay negocios -->
    <div v-else class="no-business-state">
      <div class="no-business-content">
        <i class="fas fa-building"></i>
        <h3>Sin negocios asignados</h3>
        <p>Necesitas unirte a un negocio para empezar a trabajar</p>
        <button @click="showJoinForm = true" class="join-btn primary">
          <i class="fas fa-plus"></i>
          Unirse a negocio
        </button>
      </div>
    </div>

    <!-- Modal para unirse a negocio -->
    <div v-if="showJoinForm" class="modal-overlay" @click.self="closeJoinForm">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Unirse a negocio</h3>
          <button @click="closeJoinForm" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>Ingresa el código del negocio al que deseas unirte:</p>
          <form @submit.prevent="joinBusiness">
            <div class="form-group">
              <label for="businessCode">Código del negocio:</label>
              <input
                id="businessCode"
                v-model="businessCode"
                type="text"
                class="form-input"
                placeholder="Ej: ABC123"
                :disabled="joining"
                required
              />
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button @click="closeJoinForm" class="btn btn-secondary" :disabled="joining">
            Cancelar
          </button>
          <button @click="joinBusiness" class="btn btn-primary" :disabled="joining || !businessCode.trim()">
            <i v-if="joining" class="fas fa-spinner fa-spin"></i>
            <span v-else>Unirse</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import waiterCallsService from '@/services/waiterCallsService'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import { createStaffJoinSuccessNotification } from '@/services/staffNotifications'

// Props y emits
const emit = defineEmits(['business-changed', 'businesses-loaded'])

// Estado reactivo
const businesses = ref([])
const currentBusiness = ref(null)
const showDropdown = ref(false)
const showJoinForm = ref(false)
const businessCode = ref('')
const joining = ref(false)
const loading = ref(false)

// Métodos principales
const loadBusinesses = async () => {
  loading.value = true
  //console.log('🏢 Cargando negocios del mozo...')
  
  try {
    const response = await waiterCallsService.getWaiterBusinesses()
    //console.log('📋 Respuesta de negocios:', response)

    if (response.success) {
      businesses.value = response.businesses || []

      // Determinar negocio activo
      if (response.active_business_id && businesses.value.length > 0) {
        currentBusiness.value = businesses.value.find(b => b.id === response.active_business_id) || null
      } else {
        currentBusiness.value = response.active_business || null
      }

      // Autoseleccionar cuando hay exactamente 1 negocio y ninguno activo
      if (!currentBusiness.value && businesses.value.length === 1) {
        try {
          const only = businesses.value[0]
          const setResp = await waiterCallsService.setActiveWaiterBusiness(only.id)
          if (setResp.success) {
            currentBusiness.value = only
          }
        } catch (e) {
          // si falla, continuar sin bloquear
        }
      }

      // Emitir eventos (needsBusiness si no hay negocio activo)
      emit('businesses-loaded', {
        businesses: businesses.value,
        activeBusiness: currentBusiness.value,
        needsBusiness: !currentBusiness.value
      })
    } else {
      console.error('❌ Error en respuesta de negocios:', response.message)
      showErrorToast(response.message || 'Error cargando negocios')
    }
  } catch (error) {
    console.error('💥 Error loading businesses:', error)
    showErrorToast('Error cargando negocios')
  } finally {
    loading.value = false
  }
}

const selectBusiness = async (business) => {
  try {
    const response = await waiterCallsService.setActiveWaiterBusiness(business.id)
    if (response.success) {
      currentBusiness.value = business
      showDropdown.value = false
      showSuccessToast(`Negocio "${business.name}" seleccionado`)
      
      // Emitir cambio de negocio
      emit('business-changed', business)
    } else {
      showErrorToast(response.message || 'Error seleccionando negocio')
    }
  } catch (error) {
    console.error('Error selecting business:', error)
    showErrorToast('Error seleccionando negocio')
  }
}

const joinBusiness = async () => {
  if (!businessCode.value.trim()) return

  joining.value = true
  try {
    const response = await waiterCallsService.joinBusinessWithCode(businessCode.value.trim())
    if (response.success) {
      const businessName = response.business?.name || response.data?.business?.name || 'el negocio'
      
      // Mostrar mensaje según el estado de la solicitud
      if (response.staff_request?.status === 'pending') {
        showSuccessToast('Solicitud enviada al administrador. Te notificaremos cuando sea aprobada.')
      } else {
        showSuccessToast(response.message || 'Te has unido al negocio exitosamente')
        // Crear notificación de éxito si se unió directamente
        createStaffJoinSuccessNotification(businessName)
      }
      
      businessCode.value = ''
      closeJoinForm()
      
      // Recargar negocios
      await loadBusinesses()
    } else {
      showErrorToast(response.message || 'Error uniéndose al negocio')
    }
  } catch (error) {
    console.error('Error joining business:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Error uniéndose al negocio'
    showErrorToast(errorMessage)
  } finally {
    joining.value = false
  }
}

const closeJoinForm = () => {
  showJoinForm.value = false
  businessCode.value = ''
  joining.value = false
}

// Cerrar dropdown al hacer click fuera
const handleClickOutside = (event) => {
  if (!event.target.closest('.business-dropdown')) {
    showDropdown.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadBusinesses()
  document.addEventListener('click', handleClickOutside)
})

// Cleanup
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Exposar métodos para uso externo
defineExpose({
  loadBusinesses,
  getCurrentBusiness: () => currentBusiness.value
})
</script>

<style scoped>
.business-selector {
  position: relative;
}

.business-dropdown {
  position: relative;
}

.current-business {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 250px;
}

.current-business:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.business-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.business-details {
  flex: 1;
}

.business-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.business-subtitle {
  font-size: 12px;
  color: #6c757d;
}

.dropdown-arrow {
  color: #6c757d;
  transition: transform 0.2s ease;
}

.dropdown-arrow .rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  margin-top: 4px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.businesses-list {
  max-height: 250px;
  overflow-y: auto;
}

.business-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.business-item:hover {
  background: #f8f9fa;
}

.business-item.active {
  background: #e3f2fd;
  border-color: #007bff;
}

.business-info {
  flex: 1;
}

.business-info .business-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.business-address {
  font-size: 12px;
  color: #6c757d;
}

.current-indicator {
  color: #007bff;
}

.dropdown-footer {
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.join-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.join-btn:hover {
  background: #007bff;
  color: white;
}

.join-btn.primary {
  background: #007bff;
  color: white;
}

.join-btn.primary:hover {
  background: #0056b3;
}

.no-business-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 40px 20px;
}

.no-business-content {
  text-align: center;
  max-width: 300px;
}

.no-business-content i {
  font-size: 48px;
  color: #6c757d;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-business-content h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
}

.no-business-content p {
  color: #6c757d;
  margin-bottom: 20px;
  font-size: 14px;
}

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
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin-bottom: 16px;
  color: #495057;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
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

.form-input:disabled {
  background: #f8f9fa;
  color: #6c757d;
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 0 20px 20px 20px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

@media (max-width: 768px) {
  .current-business {
    min-width: 200px;
  }
  
  .dropdown-menu {
    left: -20px;
    right: -20px;
  }
}
</style>