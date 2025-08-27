<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const showBusinessDropdown = ref(false)
const isLoadingBusinessSwitch = ref(false)
const businessCode = ref('')
let onDocumentClick

// Computed properties for business management
const availableBusinesses = computed(() => adminStore.availableBusinesses || [])
const currentBusinessName = computed(() => {
  const current = availableBusinesses.value.find(b => b.id === adminStore.activeBusinessId)
  if (adminStore.businessData?.id === adminStore.activeBusinessId && adminStore.businessData?.name) {
    return adminStore.businessData.name
  }
  return current?.name || adminStore.businessData?.name || 'Negocio'
})
const stats = ref({
  activeRequests: 0,
  pendingRequests: 0,
  totalOrders: 0,
  totalSales: 0,
  salesThisMonth: 0
})

const loadData = async () => {
  try {
    // Solo cargar datos de negocio si no los tenemos ya
    let info = adminStore.businessData
    if (!info || !info.id) {
      info = await adminStore.fetchBusinessData()
    }
    
    // Si el backend indica que requiere setup de negocio, redirigir a onboarding
    if (adminStore.requiresBusinessSetup || info?.requires_business_setup) {
      router.replace({ name: 'admin-onboard' })
      return
    }
    
    // Cargar datos en paralelo para mejorar rendimiento y evitar duplicados
    const promises = []
    
    // Solo cargar negocios si no están ya cargados
    if (!adminStore.requiresBusinessSetup && (!adminStore.availableBusinesses || adminStore.availableBusinesses.length === 0)) {
      promises.push(
        adminStore.fetchAllBusinesses().catch(err => {
          console.warn('Error al cargar lista de negocios:', err)
        })
      )
    }
    
    // Solo cargar si no están ya cargados
    if (!adminStore.staffRequests || adminStore.staffRequests.length === 0) {
      promises.push(adminStore.fetchStaffRequests())
    }
    
    // Cargar estadísticas (estas pueden cambiar frecuentemente)
    promises.push(adminStore.fetchDashboardStats().then(statsData => {
      stats.value = statsData
    }))
    
    // Ejecutar todas las promesas en paralelo
    await Promise.allSettled(promises)
    
    // Actualizar código de negocio
    if (adminStore.businessData && adminStore.invitationCode) {
      businessCode.value = adminStore.invitationCode
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar datos del negocio'
  }
}

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  await loadData()
  
  // Cerrar dropdown al hacer clic fuera
  onDocumentClick = (event) => {
    const businessDropdown = document.querySelector('.business-dropdown')
    if (businessDropdown && !businessDropdown.contains(event.target)) {
      showBusinessDropdown.value = false
    }
  }
  document.addEventListener('click', onDocumentClick)
  
  isLoading.value = false
})

onUnmounted(() => {
  // Limpiar event listeners
  if (onDocumentClick) {
    document.removeEventListener('click', onDocumentClick)
  }
})

const navigateTo = (route) => {
  router.push({ name: route })
}

const copyBusinessId = () => {
  if (adminStore.businessId) {
    navigator.clipboard.writeText(adminStore.businessId)
      .then(() => {
        alert('ID de negocio copiado al portapapeles')
      })
      .catch(() => {
        alert('No se pudo copiar el ID de negocio')
      })
  }
}

const onSelectBusiness = async (id) => {
  try {
    isLoading.value = true
    await adminStore.selectActiveBusiness(id)
  } catch (e) {
    error.value = e.message || 'No se pudo cambiar el negocio activo'
  } finally {
    isLoading.value = false
  }
}

// Business dropdown functions
const toggleBusinessDropdown = () => {
  showBusinessDropdown.value = !showBusinessDropdown.value
}

const switchBusiness = async (business) => {
  if (business.id === adminStore.activeBusinessId) {
    showBusinessDropdown.value = false
    return // Ya está seleccionado
  }
  
  try {
    isLoadingBusinessSwitch.value = true
    showBusinessDropdown.value = false
    
    await adminStore.selectActiveBusiness(business.id)
    
    // Actualizar código de negocio
    businessCode.value = adminStore.invitationCode || ''
    
    // Recargar datos
    await loadData()
  } catch (error) {
    console.error('Error al cambiar negocio:', error)
  } finally {
    isLoadingBusinessSwitch.value = false
  }
}

const copyBusinessCode = () => {
  navigator.clipboard.writeText(businessCode.value)
    .then(() => {
      // Puedes agregar un toast aquí si quieres
      console.log('Código copiado al portapapeles')
    })
    .catch(err => {
      console.error('Error al copiar al portapapeles:', err)
    })
}

// Refrescar automáticamente cuando cambie el negocio activo (por selección o eliminación)
watch(() => adminStore.activeBusinessId, async (newVal, oldVal) => {
  if (!newVal || newVal === oldVal) return
  try {
    isLoading.value = true
    // Forzar refresco de datos de negocio para asegurar nombre/códigos/contadores correctos
    await adminStore.fetchBusinessData(true)
    businessCode.value = adminStore.invitationCode || ''
    // Recargar datos dependientes
    await loadData()
  } catch (e) {
    console.warn('No se pudo refrescar datos tras cambio de negocio:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="container py-3">
      <div class="role-section">
        <div class="role-dropdown me-2">
          <button class="btn btn-outline-secondary dropdown-toggle" id="roleMenu" data-bs-toggle="dropdown">
            Rol Admin
          </button>
          <ul class="dropdown-menu" aria-labelledby="roleMenu">
            <li><a class="dropdown-item" href="#">Admin</a></li>
            <li><a class="dropdown-item" href="#">Mozo</a></li>
          </ul>
        </div>
        <!-- Business Selector - Only show if multiple businesses available -->
        <div v-if="availableBusinesses.length > 1" class="business-dropdown ms-auto me-2">
          <button 
            class="btn btn-outline-primary dropdown-toggle btn-sm" 
            @click="toggleBusinessDropdown"
            :disabled="isLoadingBusinessSwitch"
          >
            <i class="bi bi-building me-1"></i>
            {{ isLoadingBusinessSwitch ? 'Cambiando...' : currentBusinessName }}
            <i v-if="isLoadingBusinessSwitch" class="bi bi-arrow-clockwise spin ms-1"></i>
          </button>
          <div class="dropdown-menu" :class="{ show: showBusinessDropdown }">
            <div v-for="business in availableBusinesses" :key="business.id" class="dropdown-item-wrapper">
              <a 
                class="dropdown-item" 
                href="#" 
                @click="switchBusiness(business)"
                :class="{ active: business.id === adminStore.activeBusinessId }"
              >
                <i class="bi bi-building me-2"></i>
                {{ business.name }}
                <small v-if="business.id === adminStore.activeBusinessId" class="text-success ms-2">
                  <i class="bi bi-check-circle-fill"></i>
                </small>
              </a>
            </div>
          </div>
        </div>
        
        <div class="user-id-container d-flex align-items-center ms-auto">
          <span class="user-id me-2">ID:{{ businessCode }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="copyBusinessCode" title="Copiar al portapapeles">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      </div>
    
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando...</p>
    </div>
    
      <div v-else-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
        <button class="btn btn-primary" @click="$router.go(0)">
        Reintentar
            </button>
      </div>
      
      <div v-else>
        <div v-if="adminStore.requiresBusinessSetup" class="alert alert-warning d-flex justify-content-between align-items-center">
          <span>Aún no tienes un negocio configurado.</span>
          <button class="btn btn-sm btn-primary" @click="$router.replace({ name: 'admin-onboard' })">Configurar ahora</button>
        </div>
        <!-- Resumen de negocio activo -->
        <div class="card mb-3">
          <div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="me-auto">
              <h5 class="mb-1">{{ adminStore.businessData?.name || 'Mi negocio' }}</h5>
              <div class="text-muted small">Negocio activo: #{{ adminStore.activeBusinessId }}</div>
            </div>
            <div class="d-flex gap-3">
              <div class="text-center">
                <div class="fw-bold">{{ adminStore.tablesCount }}</div>
                <div class="small text-muted">Mesas</div>
              </div>
              <div class="text-center">
                <div class="fw-bold">{{ adminStore.menusCount }}</div>
                <div class="small text-muted">Menús</div>
              </div>
              <div class="text-center">
                <div class="fw-bold">{{ adminStore.qrCodesCount }}</div>
                <div class="small text-muted">QRs</div>
              </div>
            </div>
          </div>
          <div class="card-footer d-flex flex-wrap align-items-center gap-2">
            <div class="me-auto small">
              <span class="text-muted">Código de invitación: </span>
              <code>{{ adminStore.invitationCode || '—' }}</code>
              <span v-if="adminStore.invitationUrl" class="ms-2">
                <a :href="adminStore.invitationUrl" target="_blank">Enlace</a>
              </span>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="() => adminStore.regenerateInvitation().then(() => adminStore.fetchBusinessData())">Regenerar</button>
            <button class="btn btn-sm btn-outline-secondary" @click="copyBusinessId">Copiar ID</button>
          </div>
        </div>

        

        <div class="row g-3 card-grid">
        <div class="col-6">
          <RouterLink :to="{ name: 'admin-qr' }" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-qr-code"></i>
              </div>
            <div class="card-footer">QR</div>
          </RouterLink>
            </div>
            
        <div class="col-6">
          <RouterLink :to="{ name: 'admin-stats' }" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="card-footer">ESTADÍSTICAS</div>
          </RouterLink>
        </div>
        
        <div class="col-6">
          <RouterLink :to="{ name: 'admin-staff' }" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-person-fill"></i>
              </div>
            <div class="card-footer">PERSONAL</div>
          </RouterLink>
            </div>
            
        <div class="col-6">
          <RouterLink :to="{ name: 'admin-settings' }" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-gear-fill"></i>
            </div>
            <div class="card-footer">CONFIGURACIÓN</div>
          </RouterLink>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-dropdown {
  position: relative;
}

.business-dropdown .dropdown-toggle {
  display: flex;
  align-items: center;
  max-width: 200px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  border: 1px solid #007bff;
  background: white;
  transition: all 0.2s ease;
}

.business-dropdown .dropdown-toggle:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
}

.business-dropdown .dropdown-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.business-dropdown .dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  min-width: 200px;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  color: #212529;
  text-align: left;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.business-dropdown .dropdown-menu.show {
  display: block;
}

.business-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 1rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.business-dropdown .dropdown-item:hover,
.business-dropdown .dropdown-item:focus {
  background-color: #f8f9fa;
  color: #1e2125;
  text-decoration: none;
}

.business-dropdown .dropdown-item.active {
  background-color: #007bff;
  color: white;
}

.business-dropdown .dropdown-item.active:hover {
  background-color: #0056b3;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-id-container {
  margin-left: auto;
}

.user-id {
  font-family: monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
</style> 