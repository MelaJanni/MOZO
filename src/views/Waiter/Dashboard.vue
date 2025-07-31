<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWaiterStore } from '@/stores/waiter'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const waiterStore = useWaiterStore()
const authStore = useAuthStore()

const selectedProfileId = ref(null)
const newProfileName = ref('')
const showAddProfileModal = ref(false)
let pollingInterval = null

const isLoading = computed(() => waiterStore.isLoading)
const error = computed(() => waiterStore.error)
const tables = computed(() => waiterStore.tables)
const profiles = computed(() => waiterStore.profiles)
const notifications = computed(() => waiterStore.activeNotifications)
const businessName = computed(() => waiterStore.businessData?.name || 'Mi Negocio')

const filteredTables = computed(() => {
  if (!selectedProfileId.value) {
    return tables.value
  }
  return tables.value.filter(table => table.profile_id === selectedProfileId.value)
})

onMounted(async () => {
  if (!waiterStore.isAssociated) {
    router.replace({ name: 'waiter-onboard' })
    return
  }
  await waiterStore.fetchInitialData()
  pollingInterval = setInterval(waiterStore.fetchNotifications, 10000)
})

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
})

const handleLogout = async () => {
  waiterStore.clearWaiterData()
  await authStore.logout()
  router.push('/login')
}

const handleCreateProfile = async () => {
  if (!newProfileName.value.trim()) return
  await waiterStore.createProfile(newProfileName.value)
  newProfileName.value = ''
  showAddProfileModal.value = false
}

const timeSince = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 5) return "justo ahora"
  if (seconds < 60) return `hace ${seconds} seg`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours}h`
}

const getNotificationInfo = (notification) => ({
  call: { icon: 'bi-bell', text: 'Solicita mozo' },
  order: { icon: 'bi-file-text', text: 'Nuevo pedido' },
  payment: { icon: 'bi-credit-card', text: 'Pide la cuenta' },
}[notification.type] || { icon: 'bi-info-circle', text: 'Notificación' })
</script>

<template>
  <div class="waiter-layout">
    <aside class="sidebar">
      <div class="sidebar-content">
        <ul class="tables-list">
          <li @click="selectedProfileId = null" :class="{ active: !selectedProfileId }">
            <i class="bi bi-grid-fill"></i> Todas
          </li>
          <li v-for="table in filteredTables" :key="table.id" @click="console.log('Filter by table', table.id)">
            <i class="bi bi-square-fill" :style="{color: table.color || '#ccc'}"></i> 
            Mesa {{ table.name }}
            <span v-if="table.alert" class="badge-alert">!</span>
            <i v-if="table.is_muted" class="bi bi-bell-slash-fill muted-icon"></i>
          </li>
        </ul>
      </div>
      <div class="sidebar-footer">
        <button class="logout-button" @click="handleLogout">
          Salir y desactivar notificaciones
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="header-selectors">
          <div class="selector-wrapper">
             <i class="bi bi-person-workspace"></i>
             <select>
               <option>{{ businessName }}</option>
             </select>
          </div>
          <div class="selector-wrapper">
             <i class="bi bi-geo-alt-fill"></i>
             <select v-model="selectedProfileId">
                <option :value="null">Todos los perfiles</option>
                <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                  {{ profile.name }}
                </option>
             </select>
          </div>
        </div>
      </header>
      
      <div class="quick-actions">
        <button class="action-card">
          <i class="bi bi-check-circle-fill"></i>
          <span>Activar todas</span>
        </button>
        <button class="action-card">
          <i class="bi bi-x-circle-fill"></i>
          <span>Silenciar todas</span>
        </button>
        <button class="action-card">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>Activar solitarias</span>
        </button>
      </div>

      <div class="notifications-feed">
        <h4>Notificaciones</h4>
        <div v-if="notifications.length === 0" class="empty-state">
          No hay notificaciones activas.
        </div>
        <div v-else class="notifications-list-main">
          <div v-for="n in notifications" :key="n.id" class="notification-card">
            <div class="notification-header">
               <i class="bi" :class="getNotificationInfo(n).icon"></i>
               Mesa {{ n.table_name }}: {{ getNotificationInfo(n).text }}
            </div>
            <p class="notification-message">{{ n.message }}</p>
            <div class="notification-actions">
              <button class="btn-action accept" @click="waiterStore.handleNotification(n.id, 'accept')"><i class="bi bi-check-lg"></i></button>
              <button class="btn-action reject" @click="waiterStore.handleNotification(n.id, 'reject')"><i class="bi bi-x-lg"></i></button>
              <button class="btn-action prioritize"><i class="bi bi-exclamation-lg"></i></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.waiter-layout {
  display: flex;
  height: 100vh;
  background-color: #f4f5f7;
  font-family: 'Inter', sans-serif;
}

.sidebar {
  width: 250px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}
.sidebar-content {
  flex-grow: 1;
  padding: 1rem;
}
.tables-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tables-list li {
  padding: 0.8rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}
.tables-list li:hover { background-color: #f0f0f0; }
.tables-list li.active { background-color: #e9e4f8; color: #6A3FEA; }

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}
.logout-button {
  width: 100%;
  padding: 0.8rem;
  border-radius: 6px;
  border: none;
  background-color: #fdecec;
  color: #c53030;
  font-weight: 600;
  cursor: pointer;
}

.main-content {
  flex-grow: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
}
.main-header {
  margin-bottom: 1.5rem;
}
.header-selectors {
  display: flex;
  gap: 1.5rem;
}
.selector-wrapper {
  display: flex;
  align-items: center;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.selector-wrapper i {
  color: #6c757d;
  margin-right: 0.5rem;
}
.selector-wrapper select {
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
}
.selector-wrapper select:focus { outline: none; }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.action-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: none;
  text-align: center;
  cursor: pointer;
}
.action-card:hover { transform: translateY(-3px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.action-card i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  display: block;
}
.action-card .bi-check-circle-fill { color: #28a745; }
.action-card .bi-x-circle-fill { color: #dc3545; }
.action-card .bi-exclamation-triangle-fill { color: #ffc107; }

.notifications-feed h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.notifications-list-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.notification-card {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.notification-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.notification-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-action {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 1rem;
}
.btn-action.accept { color: #28a745; border-color: #28a745; }
.btn-action.reject { color: #dc3545; border-color: #dc3545; }
.btn-action.prioritize { color: #ffc107; border-color: #ffc107; }
</style> 