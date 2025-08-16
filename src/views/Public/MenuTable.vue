<template>
  <div class="menu-table-page">
    <!-- Header del negocio -->
    <div class="business-header">
      <div class="business-info">
        <div class="business-logo" v-if="businessData.logo">
          <img :src="businessData.logo" :alt="businessData.name" />
        </div>
        <div class="business-details">
          <h1>{{ businessData.name || 'Bienvenido' }}</h1>
          <div class="table-info">
            <i class="fas fa-table"></i>
            <span>Mesa {{ tableNumber }}</span>
          </div>
          <div v-if="businessData.address" class="business-address">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ businessData.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="main-content">
      <!-- Visualizador del menú PDF -->
      <div class="menu-section">
        <div class="section-header">
          <h2>
            <i class="fas fa-utensils"></i>
            Nuestro Menú
          </h2>
        </div>

        <!-- Cargando menú -->
        <div v-if="loadingMenu" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando menú...</p>
        </div>

        <!-- Error cargando menú -->
        <div v-else-if="menuError" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>No pudimos cargar el menú</p>
          <button @click="loadMenu" class="retry-btn">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>

        <!-- PDF del menú -->
        <div v-else-if="menuPdfUrl" class="pdf-container">
          <iframe 
            :src="menuPdfUrl" 
            class="pdf-viewer"
            title="Menú del restaurante"
            frameborder="0"
          ></iframe>
          
          <!-- Botón para abrir en nueva pestaña -->
          <div class="pdf-actions">
            <a :href="menuPdfUrl" target="_blank" class="pdf-action-btn">
              <i class="fas fa-external-link-alt"></i>
              Ver menú completo
            </a>
          </div>
        </div>

        <!-- Sin menú disponible -->
        <div v-else class="no-menu-state">
          <i class="fas fa-file-pdf"></i>
          <p>Menú no disponible temporalmente</p>
          <small>Consulte con el personal del establecimiento</small>
        </div>
      </div>

      <!-- Sección llamar mozo -->
      <div class="waiter-call-section">
        <CallWaiterButton 
          :table-id="tableId"
          :business-id="businessId" 
          :table-number="tableNumber"
          @call-status-change="onCallStatusChange"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="app-branding">
        <span>Powered by</span>
        <strong>MozoApp</strong>
        <span class="version">{{ getFormattedVersion() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CallWaiterButton from '@/components/Public/CallWaiterButton.vue'
import apiService from '@/services/api'
import { getFormattedVersion } from '@/utils/version'

// Route params
const route = useRoute()
const tableId = computed(() => route.params.tableId)
const businessId = computed(() => route.query.business_id)
const tableNumber = computed(() => route.query.table_number || tableId.value)

// Base URL from environment
const qrBaseUrl = import.meta.env.VITE_QR_BASE_URL || window.location.origin

// Estado reactivo
const state = reactive({
  businessData: {},
  menuPdfUrl: null,
  loadingMenu: true,
  loadingBusiness: true,
  menuError: false,
  businessError: false,
  callStatus: 'idle'
})

// Referencias reactivas para template
const businessData = computed(() => state.businessData)
const menuPdfUrl = computed(() => state.menuPdfUrl)
const loadingMenu = computed(() => state.loadingMenu)
const menuError = computed(() => state.menuError)

// ===== MÉTODOS =====

/**
 * Cargar información del negocio
 */
const loadBusinessInfo = async () => {
  if (!businessId.value) {
    console.error('Business ID not provided')
    return
  }

  try {
    state.loadingBusiness = true
    state.businessError = false

    // Llamada pública para obtener info del negocio
    const response = await apiService.get(`/public/business/${businessId.value}`)
    
    if (response.data.success) {
      state.businessData = response.data.business
      console.log('✅ Business info loaded:', state.businessData)
    } else {
      throw new Error(response.data.message || 'Error loading business info')
    }
    
  } catch (error) {
    console.error('❌ Error loading business info:', error)
    state.businessError = true
    
    // Fallback data
    state.businessData = {
      name: 'Restaurante',
      address: null,
      logo: null
    }
  } finally {
    state.loadingBusiness = false
  }
}

/**
 * Cargar menú PDF
 */
const loadMenu = async () => {
  if (!businessId.value) {
    console.error('Business ID not provided for menu')
    state.loadingMenu = false
    return
  }

  try {
    state.loadingMenu = true
    state.menuError = false

    // Llamada pública para obtener la URL del menú PDF
    const response = await apiService.get(`/public/business/${businessId.value}/menu`)
    
    if (response.data.success && response.data.menu_pdf_url) {
      state.menuPdfUrl = response.data.menu_pdf_url
      console.log('✅ Menu PDF loaded:', state.menuPdfUrl)
    } else {
      console.warn('⚠️ No menu available for this business')
      state.menuPdfUrl = null
    }
    
  } catch (error) {
    console.error('❌ Error loading menu:', error)
    state.menuError = true
  } finally {
    state.loadingMenu = false
  }
}

/**
 * Handler para cambios en el estado de llamada
 */
const onCallStatusChange = (status) => {
  state.callStatus = status
  console.log('📱 Call status changed:', status)
}

// ===== LIFECYCLE =====

onMounted(async () => {
  console.log('🏠 MenuTable mounted', {
    tableId: tableId.value,
    businessId: businessId.value,
    tableNumber: tableNumber.value
  })

  // Validar parámetros requeridos
  if (!tableId.value || !businessId.value) {
    console.error('❌ Missing required parameters')
    // Redirigir a página de error o mostrar mensaje
    return
  }

  // Cargar datos en paralelo
  await Promise.all([
    loadBusinessInfo(),
    loadMenu()
  ])
})
</script>

<style scoped>
.menu-table-page {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.business-header {
  background: white;
  padding: 20px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e9ecef;
}

.business-info {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.business-logo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.business-details h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #007bff;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.business-address {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 14px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 16px;
}

.menu-section,
.waiter-call-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
}

.loading-state,
.error-state,
.no-menu-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.loading-state .spinner,
.error-state i,
.no-menu-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #dee2e6;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error-state i {
  color: #ffc107 !important;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px auto 0;
  font-size: 14px;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.pdf-container {
  width: 100%;
}

.pdf-viewer {
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.pdf-actions {
  margin-top: 16px;
  text-align: center;
}

.pdf-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pdf-action-btn:hover {
  background: #1e7e34;
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
}

.page-footer {
  background: #2c3e50;
  color: white;
  text-align: center;
  padding: 16px;
  margin-top: 40px;
}

.app-branding {
  font-size: 14px;
}

.app-branding span {
  color: #adb5bd;
  margin-right: 6px;
}

.app-branding strong {
  color: #007bff;
  font-weight: 600;
}

.app-branding .version {
  color: #6c757d;
  font-size: 12px;
  margin-left: 8px;
  font-weight: 400;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .business-header {
    padding: 16px;
  }
  
  .business-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .main-content {
    padding: 16px 12px;
  }
  
  .menu-section,
  .waiter-call-section {
    padding: 20px 16px;
  }
  
  .pdf-viewer {
    height: 500px;
  }
  
  .business-details h1 {
    font-size: 20px;
  }
}
</style>