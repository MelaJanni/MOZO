import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/auth'

import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Callback from '@/views/auth/Callback.vue'
import RoleSelection from '@/views/auth/RoleSelection.vue'

import WaiterDashboard from '@/views/Waiter/Dashboard.vue'
import UserProfile from '@/views/Waiter/Profile.vue'
import StaffInvitations from '@/views/StaffInvitations.vue'

import AdminDashboard from '@/views/Admin/Dashboard.vue'
import AdminQR from '@/views/Admin/QR.vue'
import AdminStats from '@/views/Admin/Stats.vue'
import AdminStaff from '@/views/Admin/Staff.vue'
import AdminStaffDetail from '@/views/Admin/StaffDetail.vue'
import AdminProfile from '@/views/Admin/Profile.vue'
import AdminSettings from '@/views/Admin/Settings.vue'

// Public views (no authentication required)
import MenuTable from '@/views/Public/MenuTable.vue'

import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore();
        const { isAuthenticated, currentRole } = storeToRefs(authStore);
        if (isAuthenticated.value) {
          const role = currentRole.value;
          if (!role) {
            return next({ name: 'role-selection' })
          }
          const dashboardName = role === 'waiter' ? 'waiter-dashboard' : 'admin';
          return next({ name: dashboardName });
        }
        return next({ name: 'login' });
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresGuest: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: Callback,
      meta: { requiresGuest: false }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: { requiresGuest: true }
    },
    {
      path: '/join/:token',
      name: 'join-staff',
      component: () => import('@/views/JoinStaff.vue'),
      meta: { requiresGuest: false } // Can be accessed by both authenticated and unauthenticated users
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPassword,
      meta: { requiresGuest: true }
    },
    {
      path: '/role-selection',
      name: 'role-selection',
      component: RoleSelection,
      meta: { requiresAuth: true }
    },
    
    {
      path: '/waiter/dashboard',
      name: 'waiter-dashboard',
      component: WaiterDashboard,
      meta: { requiresAuth: true, role: 'waiter' }
    },
    {
      path: '/staff/invitations',
      name: 'staff-invitations',
      component: StaffInvitations,
      meta: { requiresAuth: true }
    },
    
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/qr',
      name: 'admin-qr',
      component: AdminQR,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/stats',
      name: 'admin-stats',
      component: AdminStats,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/staff',
      name: 'admin-staff',
      component: AdminStaff,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/staff/:id',
      name: 'admin-staff-detail',
      component: AdminStaffDetail,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/profile',
      name: 'admin-profile',
      component: AdminProfile,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: AdminSettings,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const { isAuthenticated, currentRole, initialized } = storeToRefs(authStore);
  // Lazy import del store para evitar ciclos durante inicialización
  const { useAdminStore } = await import('@/stores/admin')
  const adminStore = useAdminStore()

  // Rutas públicas
  if (to.meta.isPublic) return next();

  // Requiere invitado
  if (to.meta.requiresGuest) {
    if (isAuthenticated.value) return next({ name: 'root' });
    return next();
  }

  // Rutas autenticadas
  if (to.meta.requiresAuth) {
    // Asegurar que el store de auth haya intentado restaurar sesión
    if (!initialized.value) {
      try { await authStore.tryToLogin() } catch (e) {}
    }

    if (!isAuthenticated.value) return next({ name: 'login' });
    if (!authStore.user) await authStore.fetchUser(false); // No forzar, usar cache

    // Enforce role if specified
    if (to.meta.role) {
      // Si aún no hay rol resuelto, dirigir a selección de rol
      if (!currentRole.value) {
        return next({ name: 'role-selection' })
      }
      const role = currentRole.value
      if (to.meta.role !== role) {
        return next({ name: role === 'waiter' ? 'waiter-dashboard' : 'admin' })
      }
    }

    // Admin: si requiere setup de negocio, redirigir a onboarding salvo que ya esté ahí
    if ((to.name?.toString().startsWith('admin')) && to.name !== 'admin-onboard') {
      try {
        // Si aún no sabemos, consulta ligera
        if (adminStore.requiresBusinessSetup === false && adminStore.activeBusinessId) {
          // ya tiene negocio
        } else {
          const info = await adminStore.fetchBusinessData()
          if (adminStore.requiresBusinessSetup || info?.requires_business_setup) {
            return next({ name: 'admin-onboard' })
          }
        }
      } catch (e) {
        // En caso de error de red, no bloquear la navegación
      }
    }
  }

  return next();
})

export default router 