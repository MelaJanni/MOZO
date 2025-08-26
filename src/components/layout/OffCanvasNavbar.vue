<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
const uiStore = useUiStore();
const authStore = useAuthStore();
const { currentRole } = storeToRefs(authStore);
const router = useRouter();
const isOpen = computed(() => uiStore.isOffCanvasOpen);
// Rol actual del usuario (admin|waiter)
const userRole = computed(() => currentRole.value);

onMounted(() => {
  // Helpful debug info when running on device (Android) to see why items may be hidden
  try {
    console.log('OffCanvasNavbar - mounted - userRole:', userRole.value);
    console.log('OffCanvasNavbar - mounted - isAuthenticated:', authStore.isAuthenticated);
    console.log('OffCanvasNavbar - mounted - currentRole:', authStore.currentRole);
  } catch (e) {
    /* no-op */
  }
});
const handleLogout = async () => {
  uiStore.closeOffCanvas();
  await authStore.logout();
  router.push({ name: 'login' });
};
const navigate = (routeName) => {
  uiStore.closeOffCanvas();
  router.push({ name: routeName });
};
</script>
<template>
  <div class="off-canvas-container" :class="{ open: isOpen }">
    <div class="off-canvas-backdrop" @click="uiStore.closeOffCanvas"></div>
    <aside class="off-canvas-panel">
      <header class="panel-header">
        <h3>Menú</h3>
        <button @click="uiStore.closeOffCanvas" class="close-btn">&times;</button>
      </header>
      <nav class="panel-nav">
        <ul>
          <li v-if="userRole === 'admin'">
            <RouterLink :to="{ name: 'admin' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-speedometer2"></i> Dashboard
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'admin-notification-debug' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-bug"></i> Debug Notificaciones
            </RouterLink>
          </li>
          <li v-if="userRole === 'waiter'">
            <RouterLink :to="{ name: 'waiter-dashboard' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-grid-1x2-fill"></i> Tablero
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'staff-invitations' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-envelope"></i> Invitaciones
            </RouterLink>
          </li>
          <li v-if="userRole === 'admin'">
            <RouterLink :to="{ name: 'admin-profile' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-person-fill"></i> Mi Perfil
            </RouterLink>
          </li>
          <li v-if="userRole === 'waiter'">
            <RouterLink :to="{ name: 'profile' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-person-fill"></i> Mi Perfil
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'role-selection' }" class="nav-link" @click="uiStore.closeOffCanvas()">
              <i class="bi bi-person-badge-fill"></i> Cambiar Rol
            </RouterLink>
          </li>
          <li class="separator"></li>
          <li>
            <a @click.prevent="handleLogout" class="nav-link">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>
<style scoped>
.off-canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
  pointer-events: none;
  transition: all 0.3s ease-in-out;
}
.off-canvas-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
.off-canvas-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}
.off-canvas-container.open {
  pointer-events: auto;
}
.off-canvas-container.open .off-canvas-backdrop {
  opacity: 1;
}
.off-canvas-container.open .off-canvas-panel {
  transform: translateX(0);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}
.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  color: #6c757d;
}
.panel-nav ul {
  list-style: none;
  padding: 1rem 0;
  margin: 0;
}
.panel-nav li a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  color: #343a40;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}
.panel-nav .nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  color: #343a40;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}
.panel-nav li a:hover {
  background-color: #f8f9fa;
}
.panel-nav .nav-link:hover {
  background-color: #f8f9fa;
}
.panel-nav li a .bi {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  color: #6A3FEA;
}
.panel-nav .separator {
  height: 1px;
  background-color: #e9ecef;
  margin: 1rem 1.5rem;
}
</style>