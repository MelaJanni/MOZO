<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')
const user = ref({
  roles: []
})

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const userData = await authStore.getCurrentUser()
    user.value = userData
    
    if (user.value.roles && user.value.roles.length === 1) {
      selectRole(user.value.roles[0])
    }
  } catch (err) {
    error.value = err.message || 'No se pudo cargar la información del usuario'
  } finally {
    isLoading.value = false
  }
})

const selectRole = async (role) => {
  isLoading.value = true
  error.value = ''
  
  try {
    localStorage.setItem('userRole', role)
    
    if (role === 'admin') {
      router.push({ name: 'admin-home' })
    } else if (role === 'waiter') {
      router.push({ name: 'waiter-dashboard' })
    } else if (role === 'customer') {
      router.push({ name: 'customer-home' })
    } else {
      error.value = 'Rol no válido'
      isLoading.value = false
    }
  } catch (err) {
    error.value = err.message || 'Error al seleccionar el rol'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="select-role-container">
    <div class="select-role-card">
      <div class="logo-container">
        <img src="@/assets/mozo-logo.svg" alt="MOZO Logo" class="logo" />
      </div>
      
      <h1 class="title">¿Qué rol tienes?</h1>
      <p class="subtitle">Selecciona tu rol para continuar</p>
      
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="router.go(0)" class="retry-button">
          Reintentar
        </button>
      </div>
      
      <div v-else class="roles-container">
        <div class="role-card" @click="selectRole('admin')">
          <div class="role-icon admin-icon"></div>
          <h2 class="role-title">Dueño de local</h2>
          <p class="role-description">Administra tu negocio, menús y personal</p>
          <button class="role-button">
            Entrar como Admin
          </button>
        </div>
        
        <div class="role-card" @click="selectRole('waiter')">
          <div class="role-icon waiter-icon"></div>
          <h2 class="role-title">Mozo</h2>
          <p class="role-description">Gestiona las mesas y pedidos del restaurante</p>
          <button class="role-button">
            Entrar como Mozo
          </button>
        </div>
        
        <div v-if="user.roles.includes('customer')" class="role-card" @click="selectRole('customer')">
          <div class="role-icon customer-icon"></div>
          <h2 class="role-title">Cliente</h2>
          <p class="role-description">Navega menús y realiza pedidos</p>
          <button class="role-button">
            Entrar como Cliente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select-role-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  padding: 1rem;
}

.select-role-card {
  width: 100%;
  max-width: 800px;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 2rem;
  text-align: center;
}

.logo-container {
  margin-bottom: 1.5rem;
}

.logo {
  width: 5rem;
  height: 5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
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

.retry-button {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.retry-button:hover {
  background-color: #4f46e5;
}

.roles-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.role-card {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.role-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-icon {
  background-color: #fef3c7;
}

.waiter-icon {
  background-color: #dcfce7;
}

.customer-icon {
  background-color: #dbeafe;
}

.role-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.role-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.role-button {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.role-button:hover {
  background-color: #4f46e5;
}
</style> 