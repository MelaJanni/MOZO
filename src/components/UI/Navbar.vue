<script setup>
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import NotificationBell from '@/components/UI/NotificationBell.vue';

defineProps({
  title: {
    type: String,
    default: 'MÖZÖ'
  }
});

const uiStore = useUiStore();
const authStore = useAuthStore();
</script>

<template>
  <div class="navbar-container">
    <header class="top-bar">
      <div class="navbar-left">
        <button class="menu-toggle" @click="uiStore.toggleOffCanvas" aria-label="Abrir menú">
          <i class="bi bi-list"></i>
        </button>
        <h1 class="app-title">{{ title }}</h1>
      </div>
      
      <div class="navbar-right" v-if="authStore.isAuthenticated">
        <NotificationBell />
      </div>
    </header>
  </div>
</template>

<style scoped>
.navbar-container {
  position: relative;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: #6A3FEA;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
}

.menu-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
</style> 