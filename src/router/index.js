import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/auth'

import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import RoleSelection from '@/views/auth/RoleSelection.vue'

import WaiterDashboard from '@/views/Waiter/Dashboard.vue'
import UserProfile from '@/views/Waiter/Profile.vue'
import WaiterOnboarding from '@/views/Waiter/Onboarding.vue'

import AdminDashboard from '@/views/Admin/Dashboard.vue'
import AdminHome from '@/views/Admin/Home.vue'
import AdminQR from '@/views/Admin/QR.vue'
import AdminStats from '@/views/Admin/Stats.vue'
import AdminStaff from '@/views/Admin/Staff.vue'
import AdminStaffDetail from '@/views/Admin/StaffDetail.vue'
import AdminProfile from '@/views/Admin/Profile.vue'
import AdminSettings from '@/views/Admin/Settings.vue'
import AdminNotificationDebug from '@/views/Admin/NotificationDebug.vue'

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
          const role = currentRole.value || 'admin';
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
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: { requiresGuest: true }
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
      path: '/waiter/onboard',
      name: 'waiter-onboard',
      component: WaiterOnboarding,
      meta: { requiresAuth: true, role: 'waiter' }
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
      path: '/admin/home',
      name: 'admin-home',
      component: AdminHome,
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
      path: '/admin/notification-debug',
      name: 'admin-notification-debug',
      component: AdminNotificationDebug,
      meta: { requiresAuth: true, role: 'admin' }
    },
    
    // Public routes (no authentication required)
    {
      path: '/menu/mesa/:tableId',
      name: 'menu-table',
      component: MenuTable,
      meta: { isPublic: true }
    },
    
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const { isAuthenticated } = storeToRefs(authStore);
  
  // Allow public routes without authentication
  if (to.meta.isPublic) {
    return next();
  }
  
  if (isAuthenticated.value && !authStore.user) {
    await authStore.fetchUser();
  }

  next();
})

export default router 