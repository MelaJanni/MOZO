<template>
 <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="row justify-content-center align-items-center w-100">
      <div class="role-card col-11 d-flex flex-column justify-content-center align-items-center">
        <div class="text-center mb-4 row justify-content-center align-items-center w-100">
          <img src="@/assets/mozo-logo.jpeg" alt="MOZO Logo" class="logo mb-3" />
          <h1 class="h3">¿Qué rol tienes?</h1>
          <p v-if="route.query.change === 'true'" class="text-primary small mt-1">
            <i class="bi bi-arrow-repeat me-1"></i>
            Selecciona tu nuevo rol
          </p>
          <p v-else-if="lastSelectedRole" class="text-muted small mt-1">
            <i class="bi bi-clock-history me-1"></i>
            Último usado: {{ lastSelectedRole === 'admin' ? 'Dueño' : 'Mozo' }}
          </p>
        </div>
        <div class="row justify-content-center w-100">
          <div class="col-12 col-md-6 mb-3 mb-md-0">
            <div 
              class="role-option static" 
              :class="{ 'preferred': lastSelectedRole === 'admin', 'loading': roleLoading === 'admin' }"
              @click="selectRole('admin')"
            >
              <div v-if="roleLoading === 'admin'" class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
              <template v-else>
                <div class="role-icon">
                  <i class="bi bi-house-door"></i>
                </div>
                <h3 class="h5 mt-3">Dueño</h3>
                <small v-if="lastSelectedRole === 'admin'" class="preferred-badge">
                  <i class="bi bi-star-fill me-1"></i>Preferido
                </small>
              </template>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div 
              class="role-option static" 
              :class="{ 'preferred': lastSelectedRole === 'waiter', 'loading': roleLoading === 'waiter' }"
              @click="selectRole('waiter')"
            >
              <div v-if="roleLoading === 'waiter'" class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
              <template v-else>
                <div class="role-icon">
                  <i class="bi bi-person"></i>
                </div>
                <h3 class="h5 mt-3">Mozo</h3>
                <small v-if="lastSelectedRole === 'waiter'" class="preferred-badge">
                  <i class="bi bi-star-fill me-1"></i>Preferido
                </small>
              </template>
            </div>
          </div>
        </div>
        <div class="row justify-content-center w-100 mt-5">
          <div class="col-12 col-md-8 col-lg-6">
            <button 
              class="btn btn-outline-secondary w-100" 
              @click="logout"
              :disabled="loading || !!roleLoading"
            >
              <i class="bi bi-box-arrow-left me-1"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
 </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/auth'

const router = useRouter()
const route = useRoute()
const error = ref('')
const loading = ref(false)
const roleLoading = ref('')
const authStore = useAuthStore()
const lastSelectedRole = ref('')

// Cargar el último rol seleccionado
const loadLastSelectedRole = () => {
  const savedRole = localStorage.getItem('mozo_last_selected_role')
  if (savedRole && (savedRole === 'admin' || savedRole === 'waiter')) {
    lastSelectedRole.value = savedRole
    console.log('🔄 Último rol recordado:', savedRole)
  }
}

// Preseleccionar automáticamente si hay un rol guardado
const autoSelectLastRole = (wantsToChangeRole = false) => {
  if (wantsToChangeRole) {
    console.log('👤 Usuario quiere cambiar rol - deshabilitando autoselección')
    return
  }
  
  if (lastSelectedRole.value) {
    console.log('✨ Auto-seleccionando último rol:', lastSelectedRole.value)
    // Pequeño delay para mejor UX
    setTimeout(() => {
      selectRole(lastSelectedRole.value)
    }, 800)
  }
}

defineProps([])
const selectRole = async (role) => {
  if (roleLoading.value) return;
  roleLoading.value = role;
  error.value = '';
  try {
    console.log('RoleSelection - Inicio de selección de rol:', role);
    console.log('RoleSelection - Token antes de selectRole:', localStorage.getItem('token'));
    const response = await authService.selectRole(role);
    console.log('RoleSelection - Respuesta de selectRole:', response);
    console.log('RoleSelection - Token después de selectRole:', localStorage.getItem('token'));
  } catch (err) {
    console.warn('RoleSelection - selectRole falló, se continúa localmente:', err?.message || err);
    console.error('RoleSelection - Error completo:', err);
  }
  
  // Guardar el rol seleccionado para la próxima vez
  localStorage.setItem('mozo_last_selected_role', role);
  console.log('💾 Rol guardado para próxima sesión:', role);
  
  console.log('RoleSelection - Actualizando estado local con setSelectedRole');
  authStore.setSelectedRole(role);
  console.log('RoleSelection - Estado actualizado, token actual:', localStorage.getItem('token'));
  const targetRoute = role === 'waiter' ? 'waiter-dashboard' : 'admin';
  console.log('RoleSelection - Redirigiendo a:', targetRoute);
  router.push({ name: targetRoute });
  roleLoading.value = '';
};
const logout = async () => {
  try {
    await authService.logout()
    authStore.logout()
    // Limpiar datos guardados al hacer logout
    localStorage.removeItem('mozo_remember_email')
    localStorage.removeItem('mozo_remember_checked') 
    localStorage.removeItem('mozo_last_selected_role')
    router.push({ name: 'login' })
  } catch (err) {
    router.push({ name: 'login' })
  }
}

// Inicializar cuando se monta el componente
onMounted(() => {
  loadLastSelectedRole()
  
  // Verificar si el usuario viene con intención de cambiar rol
  const wantsToChangeRole = route.query.change === 'true'
  console.log('🔍 Query parameter change:', route.query.change, 'wantsToChangeRole:', wantsToChangeRole)
  
  // Limpiar parámetro de query si existe (después de procesarlo)
  if (route.query.change) {
    // Usar replace para no crear una nueva entrada en el historial
    router.replace({ name: 'role-selection' })
  }
  
  // Auto-seleccionar después de un breve delay para mejor UX
  setTimeout(() => {
    autoSelectLastRole(wantsToChangeRole)
  }, 500)
})
</script>
<style scoped>
.role-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bs-light);
  padding: 1rem;
}
.role-card {
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.10);
  max-width: 420px;
  text-align: center;
}
.logo {
  width: 70px;
  height: 70px;
  margin-bottom: 1rem;
}
.role-option.static {
  border: 2px solid #a084e8;
  border-radius: 1.2rem;
  padding: 2.2rem 1rem 1.2rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #faf8ff;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 250px;
}
.role-option.static:hover {
  background: #f0eaff;
  border-color: #7c4dff;
  box-shadow: 0 0 0 2px #a084e8;
  transform: translateY(-3px) scale(1.03);
}

.role-option.static.preferred {
  border-color: #9f54fd;
  background: linear-gradient(135deg, #faf8ff 0%, #f3edff 100%);
  box-shadow: 0 4px 12px rgba(159, 84, 253, 0.2);
}

.role-option.static.preferred:hover {
  border-color: #7b2cbf;
  background: linear-gradient(135deg, #f3edff 0%, #ede0ff 100%);
  transform: translateY(-5px) scale(1.05);
}

.role-option.static.loading {
  pointer-events: none;
  opacity: 0.8;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

.preferred-badge {
  display: block;
  color: #9f54fd;
  font-weight: 600;
  margin-top: 8px;
  font-size: 0.75rem;
}

.text-muted.small {
  font-size: 0.85rem;
  margin-top: 4px;
}
.role-icon {
  font-size: 2.8rem;
  color: #a084e8;
}
.btn-outline-secondary {
  border-radius: 0.7rem;
  font-size: 1.1rem;
  padding: 0.7rem 2.2rem;
}
</style>