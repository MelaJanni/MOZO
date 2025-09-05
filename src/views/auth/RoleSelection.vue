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
  // Obtener el ID del usuario actual para verificar que el rol guardado le pertenece
  const currentUserId = authStore.user?.id
  const savedRole = localStorage.getItem('mozo_last_selected_role')
  const savedUserId = localStorage.getItem('mozo_last_selected_user_id')
  
  // Solo usar el rol guardado si es del mismo usuario
  if (savedRole && (savedRole === 'admin' || savedRole === 'waiter') && savedUserId === String(currentUserId)) {
    lastSelectedRole.value = savedRole
    console.log('🔄 Último rol recordado para usuario actual:', savedRole)
  } else if (savedUserId !== String(currentUserId)) {
    // Limpiar rol de usuario anterior
    localStorage.removeItem('mozo_last_selected_role')
    localStorage.removeItem('mozo_last_selected_user_id')
    console.log('🧹 Limpiado rol de usuario anterior')
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
  
  // Guardar el rol seleccionado para la próxima vez con el ID del usuario
  localStorage.setItem('mozo_last_selected_role', role);
  localStorage.setItem('mozo_last_selected_user_id', String(authStore.user?.id || ''));
  console.log('💾 Rol guardado para próxima sesión:', role, 'Usuario ID:', authStore.user?.id);
  
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
    localStorage.removeItem('mozo_last_selected_user_id')
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
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

/* Variables CSS */
:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-accent: #8b5cf6;
  --color-light: #f8fafc;
  --color-gradient-start: #6366f1;
  --color-gradient-end: #8b5cf6;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --font-primary: 'Poppins', sans-serif;
  --font-secondary: 'Inter', sans-serif;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Contenedor principal */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  font-family: var(--font-secondary);
}

.role-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 2rem;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 3rem 2rem;
  max-width: 520px;
  width: 100%;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.role-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%);
}

/* Logo y header */
.logo {
  width: 80px;
  height: 80px;
  border-radius: 1rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 1.5rem;
  object-fit: cover;
}

.text-center h1 {
  font-family: var(--font-primary);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.text-primary.small {
  color: var(--color-primary) !important;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.text-muted.small {
  color: var(--text-muted);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Opciones de rol mejoradas */
.role-option.static {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1.5rem;
  padding: 2.5rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.role-option.static::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.role-option.static > * {
  position: relative;
  z-index: 1;
}

.role-option.static:hover {
  border-color: var(--color-primary);
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.role-option.static:hover::before {
  opacity: 0.1;
}

.role-option.static:hover .role-icon {
  color: var(--color-primary);
  transform: scale(1.1);
}

.role-option.static:hover h3 {
  color: var(--color-primary);
}

/* Rol preferido */
.role-option.static.preferred {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}

.role-option.static.preferred::before {
  opacity: 0.1;
}

.role-option.static.preferred .role-icon {
  color: var(--color-primary);
}

.role-option.static.preferred h3 {
  color: var(--color-primary);
}

.role-option.static.preferred:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);
}

/* Loading state */
.role-option.static.loading {
  pointer-events: none;
  opacity: 0.7;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 0.25rem;
}

/* Iconos y texto */
.role-icon {
  font-size: 3rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.role-option h3 {
  font-family: var(--font-primary);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

/* Badge preferido */
.preferred-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  margin-top: 1rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

/* Botón de logout mejorado */
.btn-outline-secondary {
  background: white;
  border: 2px solid #e2e8f0;
  color: var(--text-secondary);
  font-family: var(--font-secondary);
  font-weight: 500;
  border-radius: 1rem;
  padding: 0.875rem 2rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.btn-outline-secondary:hover {
  border-color: var(--text-secondary);
  background: var(--text-secondary);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Responsive design */
@media (max-width: 576px) {
  .container {
    padding: 1rem;
  }
  
  .role-card {
    padding: 2rem 1.5rem;
    border-radius: 1.5rem;
  }
  
  .text-center h1 {
    font-size: 1.75rem;
  }
  
  .role-option.static {
    padding: 2rem 1rem;
  }
  
  .role-icon {
    font-size: 2.5rem;
  }
  
  .logo {
    width: 70px;
    height: 70px;
  }
}

/* Animaciones adicionales */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-card {
  animation: fadeInUp 0.6s ease-out;
}

.role-option.static {
  animation: fadeInUp 0.6s ease-out;
  animation-delay: 0.1s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.role-option.static:nth-child(2) {
  animation-delay: 0.2s;
}
</style>