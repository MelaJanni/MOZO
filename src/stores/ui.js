import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  // --- STATE ---
  const isOffCanvasOpen = ref(false);
  const isNotifSidebarOpen = ref(false);

  // --- ACTIONS ---
  function toggleOffCanvas() {
    isOffCanvasOpen.value = !isOffCanvasOpen.value;
  }

  function closeOffCanvas() {
    isOffCanvasOpen.value = false;
  }

  function toggleNotifSidebar() {
    isNotifSidebarOpen.value = !isNotifSidebarOpen.value;
  }

  function closeNotifSidebar() {
    isNotifSidebarOpen.value = false;
  }

  return {
    // State
    isOffCanvasOpen,
    isNotifSidebarOpen,
    // Actions
    toggleOffCanvas,
    closeOffCanvas,
    toggleNotifSidebar,
    closeNotifSidebar,
  };
}); 