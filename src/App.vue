<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import Navbar from '@/components/UI/Navbar.vue'
import OffCanvasNavbar from '@/components/layout/OffCanvasNavbar.vue'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { getFormattedVersion } from '@/utils/version'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

const showNavigationUI = computed(() => {
  const hiddenRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'role-selection', 'admin']
  return !hiddenRoutes.includes(route.name)
})

// Esperar a que authStore haya intentado restaurar sesión en dispositivos donde
// la lectura de localStorage o inicialización puede ser asíncrona (ej. Android webview)
const canShowNavigation = computed(() => {
  return authStore.initialized === undefined ? true : authStore.initialized
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
    //console.log('Back button listener configurado')
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
  
  // Auto-cargar notificaciones si está autenticado
  if (authStore.isAuthenticated) {
    notificationsStore.loadNotifications()
    // Inicializar listeners de Firestore para tiempo real
    notificationsStore.initializeRealTimeNotifications()
    // Asegurar token FCM web si aún no existe (fallback por si no se llamó initializePushNotifications en login)
    try {
      const isNative = !!window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web'
      const existingToken = localStorage.getItem('fcm_token')
      if (!isNative && !existingToken && !window.__pushInitStarted) {
        window.__pushInitStarted = true
        console.log('🔔 (Fallback) Inicializando push porque fcm_token está vacío tras login restaurado...')
        const { initializePushNotifications } = await import('@/services/pushNotifications')
        await initializePushNotifications()
        const newToken = localStorage.getItem('fcm_token')
        console.log('🔔 (Fallback) Resultado obtención token:', newToken ? newToken.substring(0,25)+'...' : 'NO TOKEN')
        if (!newToken) {
          console.warn('⚠️ (Fallback) No se pudo obtener token FCM en inicialización tardía.')
        }
      }
    } catch (e) {
      console.warn('⚠️ (Fallback) Error asegurando token FCM:', e)
    }
  }
})

onUnmounted(() => {
  cleanupBackButton()
  // Desconectar listeners de Firestore
  if (authStore.isAuthenticated) {
    notificationsStore.disconnectRealTimeNotifications()
  }
})
</script>

<template>
  <div class="app-container">
  <Navbar v-if="showNavigationUI && canShowNavigation" />
  <OffCanvasNavbar v-if="showNavigationUI && canShowNavigation" />
    
    <main :class="{ 'with-navbar': showNavigationUI && route.name !== 'admin' }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer global -->
    <footer v-if="showNavigationUI && canShowNavigation" class="app-footer">
      <div class="footer-content">
        <span class="app-name">MozoApp</span>
        <span class="version">{{ getFormattedVersion() }}</span>
      </div>
    </footer>

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
  padding-bottom: 50px;
}

.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2c3e50;
  color: white;
  padding: 8px 16px;
  z-index: 999;
  border-top: 1px solid #34495e;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  font-size: 12px;
}

.footer-content .app-name {
  color: #007bff;
  font-weight: 600;
}

.footer-content .version {
  color: #adb5bd;
  font-weight: 400;
}
</style> 