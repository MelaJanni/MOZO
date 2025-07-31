<script setup>
import { useUiStore } from '@/stores/ui';

defineProps({
  title: {
    type: String,
    default: 'MÖZÖ'
  }
});

const uiStore = useUiStore();
</script>

<template>
  <div class="navbar-container">
    <header class="top-bar">
      <button class="menu-toggle" @click="uiStore.toggleOffCanvas" aria-label="Abrir menú">
        <i class="bi bi-list"></i>
      </button>
      <h1 class="app-title">{{ title }}</h1>
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

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
</style> 