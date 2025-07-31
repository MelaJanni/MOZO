<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import BaseModal from '@/components/UI/BaseModal.vue'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import MenuCardSkeleton from '@/components/skeletons/MenuCardSkeleton.vue'

const router = useRouter()
const adminStore = useAdminStore()

const isPageLoading = ref(false)
const showImportModal = ref(false)
const uploadProgress = ref(0)
const activeTab = ref('menu')
const newMenu = ref({
  name: '',
  file: null,
  setAsDefault: false
})
const editMenuName = ref('')
const showRenameModal = ref(false)
const selectedMenu = ref(null)
const overlayMenuId = ref(null)
const processingMenuId = ref(null)

const toggleOverlay = (menuId) => {
  if (overlayMenuId.value === menuId) {
    overlayMenuId.value = null
  } else {
    overlayMenuId.value = menuId
  }
}

onMounted(async () => {
  isPageLoading.value = true
  try {
    await adminStore.fetchMenus()
  } catch (err) {
    showErrorToast(err.message || 'Error al cargar menús')
  } finally {
    isPageLoading.value = false
  }
})

const sortedMenus = computed(() => {
  if (!adminStore.menus) return []
  return [...adminStore.menus].sort((a, b) => {
    if (a.isDefault) return -1
    if (b.isDefault) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

const setDefaultMenu = async (menuId) => {
  if (processingMenuId.value) return
  processingMenuId.value = menuId
  try {
    await adminStore.setDefaultMenu(menuId)
    showSuccessToast('Menú predeterminado actualizado')
    overlayMenuId.value = null
  } catch (err) {
    showErrorToast(err.message || 'Error al establecer menú predeterminado')
  } finally {
    processingMenuId.value = null
  }
}

const uploadMenu = async () => {
  if (!newMenu.value.name || !newMenu.value.file) {
    showErrorToast('Por favor completa todos los campos')
    return
  }
  if (newMenu.value.file.type !== 'application/pdf') {
    showErrorToast('Solo se permiten archivos PDF')
    return
  }
  if (newMenu.value.file.size > 10 * 1024 * 1024) {
    showErrorToast('El archivo no debe superar los 10MB')
    return
  }
  const isLoading = ref(true)
  uploadProgress.value = 0
  try {
    const totalSteps = 10
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      uploadProgress.value = Math.round((i / totalSteps) * 100)
    }
    const formData = new FormData()
    formData.append('file', newMenu.value.file)
    formData.append('name', newMenu.value.name)
    formData.append('is_default', newMenu.value.setAsDefault)
    
    await adminStore.uploadMenu(formData)
    
    showImportModal.value = false
    newMenu.value = { name: '', file: null, setAsDefault: false }
    showSuccessToast('Menú subido correctamente')
  } catch (err) {
    showErrorToast(err.message || 'Error al subir menú')
  } finally {
    isLoading.value = false
    uploadProgress.value = 0
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.type !== 'application/pdf') {
      showErrorToast('Solo se permiten archivos PDF')
      event.target.value = null
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showErrorToast('El archivo no debe superar los 10MB')
      event.target.value = null
      return
    }
    newMenu.value.file = file
  }
}

const deleteMenu = async (menu) => {
  if (!menu || processingMenuId.value) return

  const result = await Swal.fire({
    title: `¿Eliminar "${menu.name}"?`,
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    processingMenuId.value = menu.id
    try {
      await adminStore.deleteMenu(menu.id)
      showSuccessToast('Menú eliminado correctamente')
      overlayMenuId.value = null
    } catch (err) {
      showErrorToast(err.message || 'Error al eliminar menú')
    } finally {
      processingMenuId.value = null
    }
  }
}

const openRenameModal = (menu) => {
  if (!menu) return
  selectedMenu.value = menu
  editMenuName.value = menu.name
  showRenameModal.value = true
}

const renameMenu = async () => {
  if (!selectedMenu.value || !editMenuName.value.trim() || processingMenuId.value) return
  processingMenuId.value = selectedMenu.value.id
  try {
    await adminStore.renameMenu(selectedMenu.value.id, editMenuName.value.trim())
    showSuccessToast('Menú renombrado correctamente')
    showRenameModal.value = false
    overlayMenuId.value = null
  } catch (err) {
    showErrorToast(err.message || 'Error al renombrar menú')
  } finally {
    processingMenuId.value = null
  }
}

const goToTables = () => {
  router.push({ name: 'admin-qr' })
}

const handleView = async (menu) => {
  const url = await adminStore.previewMenu(menu.id)
  if (url) window.open(url, '_blank')
}

const downloadMenu = async (menu) => {
  const url = menu.url || (await adminStore.previewMenu(menu.id))
  if (url) {
    const a = document.createElement('a')
    a.href = url
    a.download = `${menu.name}.pdf`
    a.click()
  }
}
</script>

<template>
  <div class="menus-container">
    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'mesas' }" 
          @click="goToTables"
        >
          MESAS
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'menu' }" 
        >
          MENU
        </button>
      </div>
    </div>
    
    <div v-if="isPageLoading && !uploadProgress" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando menús...</p>
    </div>
    
    <div v-if="!isPageLoading || uploadProgress" class="menus-content">
      <div v-if="isPageLoading" class="menu-grid">
        <MenuCardSkeleton v-for="n in 6" :key="n" />
      </div>
      <div v-else class="menu-grid">
        <template v-if="sortedMenus.length">
          <div 
            v-for="menu in sortedMenus" 
            :key="menu.id" 
            class="menu-card"
            :class="{ 
              'default': menu.isDefault,
              'processing': processingMenuId === menu.id 
            }"
            @click="() => toggleOverlay(menu.id)"
          >
            <div class="card-content">
              <img :src="menu.thumbnailUrl" alt="Miniatura del menú" class="menu-thumbnail">
              <div class="menu-info">
                <span class="menu-name">{{ menu.name }}</span>
                <span v-if="menu.isDefault" class="default-badge">PREDETERMINADO</span>
              </div>
            </div>
            
            <div class="menu-actions" :class="{ show: overlayMenuId === menu.id }" @click.stop>
              <div @click="setDefaultMenu(menu.id)" v-if="!menu.isDefault" class="action-item">
                <span class="action-icon select"><i class="bi bi-check-lg"></i></span>
                <span class="action-label">Seleccionar</span>
              </div>
              <div @click="handleView(menu)" class="action-item">
                 <span class="action-icon view"><i class="bi bi-eye-fill"></i></span>
                <span class="action-label">Ver</span>
              </div>
              <div @click="openRenameModal(menu)" class="action-item">
                <span class="action-icon rename"><i class="bi bi-pencil-fill"></i></span>
                <span class="action-label">Renombrar</span>
              </div>
              <div @click="downloadMenu(menu)" class="action-item">
                <span class="action-icon download"><i class="bi bi-download"></i></span>
                <span class="action-label">Descargar</span>
              </div>
              <div @click="deleteMenu(menu)" class="action-item">
                <span class="action-icon delete"><i class="bi bi-trash-fill"></i></span>
                <span class="action-label">Eliminar</span>
              </div>
            </div>

            <div v-if="processingMenuId === menu.id" class="processing-overlay">
              <div class="loading-spinner-small"></div>
            </div>
          </div>
        </template>
        
        <div v-if="!isPageLoading" class="menu-card add-new" @click="showImportModal = true">
          <div class="plus-icon">
            <i class="fas fa-plus"></i>
          </div>
          <span>Agregar menú (PDF)</span>
        </div>
      </div>
    </div>
    
    <BaseModal 
      v-model="showImportModal" 
      title="Agregar nuevo menú"
      size="md"
    >
      <div class="upload-form">
        <div class="form-group">
          <label for="menu-name">Nombre del menú</label>
          <input 
            type="text"
            id="menu-name"
            v-model="newMenu.name"
            class="form-control"
            placeholder="Ej: Menú de Verano"
          />
        </div>
        
        <div class="form-group">
          <label for="menu-file">Archivo PDF (máx. 10MB)</label>
          <div class="file-input-container">
            <input 
              type="file"
              id="menu-file"
              class="form-control"
              accept="application/pdf"
              @change="handleFileChange"
            />
          </div>
          <small class="file-help">Formato aceptado: PDF. Tamaño máximo: 10MB</small>
        </div>
        
        <div class="form-check">
          <input 
            type="checkbox"
            id="set-default"
            v-model="newMenu.setAsDefault"
            class="form-check-input"
          />
          <label for="set-default" class="form-check-label">
            Establecer como menú predeterminado
          </label>
        </div>
        
        <div v-if="uploadProgress > 0" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
      </div>
      
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showImportModal = false"
          :disabled="isPageLoading"
        >
          Cancelar
        </button>
        
        <button 
          class="btn btn-primary" 
          @click="uploadMenu"
          :disabled="!newMenu.name || !newMenu.file || isPageLoading"
        >
          <span v-if="isPageLoading">Subiendo...</span>
          <span v-else>Subir menú</span>
        </button>
      </template>
    </BaseModal>
    
    <BaseModal 
      v-model="showRenameModal" 
      title="Renombrar menú"
      size="sm"
    >
      <div class="rename-form">
        <div class="form-group">
          <label for="edit-menu-name">Nuevo nombre</label>
          <input 
            type="text"
            id="edit-menu-name"
            v-model="editMenuName"
            class="form-control"
            placeholder="Ingresa el nuevo nombre"
          />
        </div>
      </div>
      
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showRenameModal = false"
          :disabled="isPageLoading"
        >
          Cancelar
        </button>
        
        <button 
          class="btn btn-primary" 
          @click="renameMenu"
          :disabled="!editMenuName.trim() || isPageLoading"
        >
          <span v-if="isPageLoading">Guardando...</span>
          <span v-else>Guardar</span>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.menus-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
  padding-top: 80px;
}

.tabs-container {
  margin-bottom: 1.5rem;
}

.tabs-header {
  display: flex;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
}

.tab-button {
  padding: 0.75rem 2rem;
  border: none;
  background: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tab-button.active {
  background-color: #1e3a8a;
  color: white;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.alert-success {
  background-color: #d1fae5;
  color: #047857;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(106, 63, 234, 0.3);
  border-radius: 50%;
  border-top-color: #6A3FEA;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.menus-content {
  padding-bottom: 2rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.menu-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.menu-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.15);
}

.menu-card.processing .card-content {
  filter: blur(4px);
  pointer-events: none;
}

.processing-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.card-content {
  transition: filter 0.2s ease;
}

.menu-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
  background-color: #e9ecef;
}

.menu-info {
  padding: 1rem;
}

.menu-name {
  font-size: 1.25rem;
  margin: 0;
  color: #3e2723;
}

.default-badge {
  background-color: #1e3a8a;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.5rem;
}

.menu-actions {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  place-items: center;
  gap: 1.25rem 1.5rem;
  padding: 1.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.menu-actions.show {
  opacity: 1;
  pointer-events: auto;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: white;
  font-weight: 500;
  text-align: center;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: white;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.action-item:hover .action-icon {
  transform: scale(1.1);
}

.action-icon.select { background-color: #28a745; }
.action-icon.view { background-color: #0d6efd; }
.action-icon.rename { background-color: #ffc107; }
.action-icon.download { background-color: #0dcaf0; }
.action-icon.delete { background-color: #dc3545; }

.loading-spinner-small {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.add-menu-card {
  border: 2px dashed #ccc;
  border-radius: 12px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  gap: 0.5rem;
}

.add-menu-card:hover {
  background-color: #f9f9f9;
  border-color: #6A3FEA;
}

.add-menu-card i {
  font-size: 2rem;
  color: #6A3FEA;
  margin-bottom: 0.5rem;
}

.add-menu-card span {
  color: #555;
  font-weight: 500;
}

.add-menu-card.full {
   grid-column: 1 / -1;
   min-height: 220px;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.form-check-input {
  width: 16px;
  height: 16px;
}

.file-help {
  color: #666;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #6A3FEA;
  transition: width 0.3s;
}

.progress-text {
  display: block;
  text-align: right;
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #6A3FEA;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5933C3;
}

.btn-secondary {
  background-color: #e9ecef;
  color: #495057;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #dee2e6;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .menus-container {
    padding: 2rem;
    padding-top: 80px;
  }
}
</style> 