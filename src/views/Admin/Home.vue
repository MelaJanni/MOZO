<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const stats = ref({
  activeRequests: 0,
  pendingRequests: 0,
  totalOrders: 0,
  totalSales: 0,
  salesThisMonth: 0
})

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    await adminStore.fetchBusinessData()
    await adminStore.fetchStaffRequests()
    const statsData = await adminStore.fetchDashboardStats()
    stats.value = statsData
  } catch (err) {
    error.value = err.message || 'Error al cargar datos del negocio'
  } finally {
    isLoading.value = false
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

        <span class="user-id">ID:{{ adminStore.businessId }}</span>
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
      
      <div v-else class="row g-3 card-grid">
        <div class="col-6">
          <a href="#" @click.prevent="navigateTo('admin-qr')" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-qr-code"></i>
              </div>
            <div class="card-footer">QR</div>
          </a>
            </div>
            
        <div class="col-6">
          <a href="#" @click.prevent="navigateTo('admin-stats')" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="card-footer">ESTADÍSTICAS</div>
          </a>
        </div>
        
        <div class="col-6">
          <a href="#" @click.prevent="navigateTo('admin-staff')" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-person-fill"></i>
              </div>
            <div class="card-footer">PERSONAL</div>
          </a>
            </div>
            
        <div class="col-6">
          <a href="#" @click.prevent="navigateTo('admin-settings')" class="card dashboard-card text-center text-decoration-none">
            <div class="card-body">
              <i class="bi bi-gear-fill"></i>
            </div>
            <div class="card-footer">CONFIGURACIÓN</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style> 