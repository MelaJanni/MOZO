<template>
 <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="row justify-content-center align-items-center w-100">
      <div class="role-card col-11 d-flex flex-column justify-content-center align-items-center">
        <div class="text-center mb-4 row justify-content-center align-items-center w-100">
          <img src="@/assets/mozo-logo.svg" alt="MOZO Logo" class="logo mb-3" />
          <h1 class="h3">¿Qué rol tienes?</h1>
        </div>
        <div class="row justify-content-between align-items-center w-100">
          <div class="col me-2 d-flex flex-column justify-content-center align-items-center px-0">
            <div class="role-option static" @click="selectRole('admin')">
              <div class="role-icon">
                <i class="bi bi-house-door"></i>
              </div>
              <h3 class="h5 mt-3">Dueño</h3>
            </div>
          </div>
          <div class="col ms-2 d-flex flex-column justify-content-center align-items-center px-0">
            <div class="role-option static" @click="selectRole('waiter')">
              <div class="role-icon">
                <i class="bi bi-person"></i>
              </div>
              <h3 class="h5 mt-3">Mozo</h3>
            </div>
          </div>
        </div>
        <div class="mt-5 text-center row justify-content-center align-items-center w-100">
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
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/auth'
const router = useRouter()
const error = ref('')
const loading = ref(false)
const roleLoading = ref('')
const authStore = useAuthStore()
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
    router.push({ name: 'login' })
  } catch (err) {
    router.push({ name: 'login' })
  }
}
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