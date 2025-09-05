<!-- DEPRECATED: Usar OffCanvasNavbar.vue montado globalmente en App.vue -->
<template>
  <Transition name="sheet-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 bg-black/50"
      @click="$emit('update:modelValue', false)"
      aria-hidden="true"
    />
  </Transition>

  <Transition name="sheet-slide">
    <aside
      v-if="modelValue"
      class="fixed inset-y-0 left-0 z-[60] w-[86%] max-w-[380px] bg-white shadow-xl flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <header class="flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center gap-2">
          <span class="font-bold">{{ headerTitle }}</span>
          <span v-if="roleLabel" class="text-xs text-gray-500">• {{ roleLabel }}</span>
        </div>
        <button class="p-2 rounded-md hover:bg-gray-100" @click="$emit('update:modelValue', false)">
          <i class="fas fa-times"></i>
        </button>
      </header>

      <nav class="p-2 overflow-auto">
        <ul class="space-y-1">
          <li v-for="item in visibleItems" :key="item.to">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700"
              :class="{ 'bg-gray-100 font-semibold text-gray-900': isActive(item.to) }"
              @click="$emit('update:modelValue', false)"
            >
              <i :class="['w-4 text-gray-500', item.icon]"></i>
              <span class="text-sm">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <footer class="mt-auto p-3 border-t">
        <button class="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Cerrar sesión</span>
        </button>
      </footer>
    </aside>
  </Transition>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  role: { type: String, default: 'waiter' }, // 'admin' | 'waiter'
  headerTitle: { type: String, default: 'Menú' }
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menuByRole = {
  admin: [
    { to: '/admin', icon: 'fas fa-home', label: 'Inicio' },
    { to: '/admin/qr', icon: 'fas fa-qrcode', label: 'QR' },
    { to: '/admin/staff', icon: 'fas fa-users', label: 'Personal' },
    { to: '/admin/settings', icon: 'fas fa-cog', label: 'Configuración' },
  ],
  waiter: [
    { to: '/waiter/dashboard', icon: 'fas fa-bell', label: 'Llamadas' },
    { to: '/waiter/invitations', icon: 'fas fa-envelope-open-text', label: 'Invitaciones' },
  ],
}

const visibleItems = computed(() => menuByRole[props.role] || [])
const roleLabel = computed(() => props.role === 'admin' ? 'Admin' : 'Mozo')

function isActive(to) {
  return route.path === to
}

async function logout() {
  await auth.logout()
  emit('update:modelValue', false)
  router.push('/login')
}

// Body scroll lock when open
watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// ESC key to close
function onKeydown(e) {
  if (e.key === 'Escape') emit('update:modelValue', false)
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.sheet-fade-enter-active, .sheet-fade-leave-active { transition: opacity .2s; }
.sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; }
.sheet-slide-enter-active, .sheet-slide-leave-active { transition: transform .25s ease; }
.sheet-slide-enter-from, .sheet-slide-leave-to { transform: translateX(-100%); }
</style>
