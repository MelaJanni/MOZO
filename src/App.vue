<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import Navbar from '@/components/UI/Navbar.vue'
import OffCanvasNavbar from '@/components/layout/OffCanvasNavbar.vue'
import DebugPanel from '@/components/UI/DebugPanel.vue'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { initializePushNotifications } from './services/pushNotifications'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

const showNavigationUI = computed(() => {
  const hiddenRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'role-selection']
  return !hiddenRoutes.includes(route.name)
})

const showDebugPanel = computed(() => {
  return import.meta.env.DEV
})

const handleBackButton = () => {
  const exitRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'role-selection']
  
  if (exitRoutes.includes(route.name)) {
    App.exitApp()
    return
  }
  
  if (router.options.history.state.back) {
    router.back()
  } else {
    App.exitApp()
  }
}

const setupBackButton = async () => {
  try {
    await App.addListener('backButton', handleBackButton)
    console.log('Back button listener configurado')
  } catch (error) {
    console.warn('No se pudo configurar el listener del botón atrás:', error)
  }
}

const cleanupBackButton = async () => {
  try {
    await App.removeAllListeners('backButton');
  } catch (error) {
    console.warn('Error al limpiar listeners del botón atrás:', error)
  }
}

onMounted(async () => {
  setupBackButton()
  await authStore.tryToLogin()
  if (authStore.isAuthenticated) {
    initializePushNotifications()
    notificationsStore.initializeRealTimeNotifications()
  }
})

onUnmounted(() => {
  cleanupBackButton()
})
</script>

<template>
  <div class="app-container">
    <Navbar v-if="showNavigationUI" />
    <OffCanvasNavbar v-if="showNavigationUI" />
    
    <main :class="{ 'with-navbar': showNavigationUI }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <DebugPanel v-if="showDebugPanel" />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

main.with-navbar {
  padding-top: 60px;
}
</style> 