<script setup>
import { ref, onMounted } from 'vue'
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
const businesses = ref([])
const showDeleteBusinessModal = ref(false)
const deleteConfirmText = ref('')
const deleteBusinessError = ref('')
const deletingBusinessId = ref(null)

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const [businessData, allBiz] = await Promise.all([
      adminStore.fetchBusinessData(true),
      adminStore.fetchAllBusinesses().catch(() => [])
    ])
    
    business.value = businessData.business || {}
    businesses.value = allBiz || []
  } catch (err) {
    error.value = err.message || 'Error al cargar datos'
  } finally {
    isLoading.value = false
  }
})

const updateBusiness = async () => {
  if (!business.value.name.trim()) {
    error.value = 'El nombre del negocio es requerido'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await adminStore.updateBusiness(business.value)
    success.value = 'Negocio actualizado exitosamente'
  } catch (err) {
    error.value = err.message || 'Error al actualizar negocio'
  } finally {
    isLoading.value = false
    setTimeout(() => { success.value = ''; error.value = '' }, 3000)
  }
}

const selectBusiness = async (selectedBusiness) => {
  if (selectedBusiness.id === adminStore.activeBusinessId) return
  
  isLoading.value = true
  try {
    await adminStore.selectActiveBusiness(selectedBusiness.id)
    success.value = `Cambiado a: ${selectedBusiness.name}`
    business.value = selectedBusiness
  } catch (err) {
    error.value = err.message || 'Error al cambiar negocio'
  } finally {
    isLoading.value = false
    setTimeout(() => { success.value = ''; error.value = '' }, 3000)
  }
}

const openDeleteBusinessModal = (businessToDelete) => {
  deletingBusinessId.value = businessToDelete.id
  showDeleteBusinessModal.value = true
  deleteConfirmText.value = ''
  deleteBusinessError.value = ''
}

const deleteBusiness = async () => {
  if (deleteConfirmText.value !== 'ELIMINAR') {
    deleteBusinessError.value = 'Debes escribir "ELIMINAR" exactamente'
    return
  }

  if (!deletingBusinessId.value) return

  isLoading.value = true
  deleteBusinessError.value = ''

  try {
    await adminStore.deleteBusiness(deletingBusinessId.value)
    
    // Si eliminamos el negocio activo, redirigir
    if (deletingBusinessId.value === adminStore.activeBusinessId) {
      router.push({ name: 'admin-onboard' })
      return
    }

    // Actualizar lista de negocios
    businesses.value = businesses.value.filter(b => b.id !== deletingBusinessId.value)
    showDeleteBusinessModal.value = false
    success.value = 'Negocio eliminado exitosamente'
  } catch (err) {
    deleteBusinessError.value = err.message || 'Error al eliminar negocio'
  } finally {
    isLoading.value = false
    setTimeout(() => { success.value = ''; deleteBusinessError.value = '' }, 3000)
  }
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Administra la información de tu negocio</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <!-- Información del Negocio -->
    <div class="settings-section">
      <div class="section-header">
        <h2>Información del Negocio</h2>
      </div>

      <form @submit.prevent="updateBusiness" class="business-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="business-name">Nombre del Negocio*</label>
            <input 
              id="business-name"
              type="text" 
              v-model="business.name" 
              required 
              :disabled="isLoading"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="business-address">Dirección</label>
            <input 
              id="business-address"
              type="text" 
              v-model="business.address" 
              :disabled="isLoading"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="business-phone">Teléfono</label>
            <input 
              id="business-phone"
              type="tel" 
              v-model="business.phone" 
              :disabled="isLoading"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="business-email">Email</label>
            <input 
              id="business-email"
              type="email" 
              v-model="business.email" 
              :disabled="isLoading"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group full-width">
          <label for="business-description">Descripción</label>
          <textarea 
            id="business-description"
            v-model="business.description" 
            rows="3" 
            :disabled="isLoading"
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-actions">
          <BaseButton type="submit" :loading="isLoading" variant="primary">
            Guardar Cambios
          </BaseButton>
        </div>
      </form>
    </div>

    <!-- Cambiar Negocio (solo si tiene múltiples) -->
    <div v-if="businesses.length > 1" class="settings-section">
      <div class="section-header">
        <h2>Cambiar Negocio Activo</h2>
        <p class="section-description">Selecciona cuál negocio quieres administrar</p>
      </div>

      <div class="business-list">
        <div 
          v-for="biz in businesses" 
          :key="biz.id"
          class="business-card"
          :class="{ active: biz.id === adminStore.activeBusinessId }"
          @click="selectBusiness(biz)"
        >
          <div class="business-info">
            <h3 class="business-name">{{ biz.name }}</h3>
            <p class="business-details">{{ biz.address || 'Sin dirección' }}</p>
          </div>
          <div class="business-actions">
            <BaseButton 
              v-if="biz.id === adminStore.activeBusinessId"
              variant="primary"
              size="sm"
              disabled
            >
              Activo
            </BaseButton>
            <BaseButton 
              v-else
              @click.stop="selectBusiness(biz)"
              variant="outline-primary"
              size="sm"
              :loading="isLoading"
            >
              Seleccionar
            </BaseButton>
            <BaseButton 
              @click.stop="openDeleteBusinessModal(biz)"
              variant="outline-danger"
              size="sm"
              class="ml-2"
            >
              Eliminar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Zona de Peligro -->
    <div class="settings-section danger-zone">
      <div class="section-header">
        <h2>Zona de Peligro</h2>
        <p class="section-description">Acciones que no se pueden deshacer</p>
      </div>

      <div class="danger-actions">
        <div class="danger-item">
          <div class="danger-info">
            <h3>Eliminar Negocio</h3>
            <p>Elimina permanentemente este negocio y todos sus datos asociados (mesas, menús, códigos QR, staff, llamadas, archivos, pivotes). Es irreversible.</p>
          </div>
          <BaseButton 
            @click="openDeleteBusinessModal(business)"
            variant="danger"
            :loading="isLoading"
          >
            Eliminar Negocio
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar Negocio -->
    <BaseModal 
      v-model="showDeleteBusinessModal" 
      title="Eliminar Negocio" 
      size="md"
    >
      <div class="delete-confirmation">
        <div class="warning-message">
          <svg class="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5C3.312 16.333 4.273 18 5.814 18z"></path>
          </svg>
          <div>
            <h3>¿Estás absolutamente seguro?</h3>
            <p>Esta acción no se puede deshacer. Esto eliminará permanentemente el negocio y todos los datos asociados.</p>
          </div>
        </div>

        <div class="confirmation-input">
          <label>Escribe <strong>ELIMINAR</strong> para confirmar:</label>
          <input 
            type="text" 
            v-model="deleteConfirmText" 
            placeholder="ELIMINAR"
            :disabled="isLoading"
            class="form-input"
          />
          <p v-if="deleteBusinessError" class="error-message">{{ deleteBusinessError }}</p>
        </div>
      </div>

      <template #footer>
        <BaseButton @click="showDeleteBusinessModal = false" variant="outline">
          Cancelar
        </BaseButton>
        <BaseButton @click="deleteBusiness" variant="danger" :loading="isLoading">
          Eliminar Negocio
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.settings-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.business-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input, .form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled, .form-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.business-list {
  padding: 1.5rem;
}

.business-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.business-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.business-card.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.business-info h3 {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.business-details {
  color: #6b7280;
  font-size: 0.875rem;
}

.business-actions {
  display: flex;
  gap: 0.5rem;
}

.danger-zone {
  border: 2px solid #fecaca;
}

.danger-zone .section-header {
  background-color: #fef2f2;
  border-bottom-color: #fecaca;
}

.danger-zone .section-header h2 {
  color: #dc2626;
}

.danger-actions {
  padding: 1.5rem;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.danger-info h3 {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.danger-info p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.delete-confirmation {
  padding: 1rem;
}

.warning-message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 0.5rem;
}

.warning-icon {
  width: 2rem;
  height: 2rem;
  color: #dc2626;
  flex-shrink: 0;
}

.warning-message h3 {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.warning-message p {
  color: #7f1d1d;
  font-size: 0.875rem;
  line-height: 1.5;
}

.confirmation-input label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

@media (max-width: 640px) {
  .settings-container {
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .danger-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .business-card {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .business-actions {
    justify-content: flex-end;
  }
}
</style>