import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://mozoqr.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    try {
      const data = response.data;
      if (data) {
        const token = data.token || 
                     data.access_token || 
                     data.plainTextToken || 
                     (data.user && data.user.token) ||
                     (data.user && data.user.access_token);
        
        if (token) {
          localStorage.setItem('token', token);
        }
      }
      // Fallback: token en encabezado Authorization
      if (!localStorage.getItem('token') && response.headers) {
        const authHeader = response.headers['authorization'] || response.headers['Authorization']
        if (authHeader && authHeader.startsWith('Bearer ')) {
          localStorage.setItem('token', authHeader.replace('Bearer ', ''))
        }
      }
    } catch (e) {}
    
    return response
  },
  error => {
    const extractErrorMessage = (err) => {
      if (err.response) {
        const data = err.response.data
        if (data) {
          if (typeof data === 'string') return data
          if (data.message) return data.message
          if (data.error) return data.error
        }
        return `Error ${err.response.status}: ${err.response.statusText || 'Error en la respuesta del servidor'}`
      }
      if (err.request) {
        return 'No se recibió respuesta del servidor. Verifique su conexión.'
      }
      return err.message || 'Ocurrió un error desconocido.'
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    error.message = extractErrorMessage(error)

    return Promise.reject(error)
  }
)

const apiService = {
  login: (credentials) => api.post('login', credentials),
  loginWithGoogle: (data) => api.post('login/google', data),
  checkUserExists: (email) => api.post('check-user-exists', { email }),
  forgotPassword: (email) => api.post('forgot-password', email),
  resetPassword: (data) => api.post('reset-password', data),
  callWaiter: (tableId) => api.post(`tables/${tableId}/call-waiter`),
  register: (data) => api.post('register', data),
  
  getCurrentUser: () => api.get('user'),
  logout: () => api.post('logout'),
  // Selección de rol (opcionalmente con negocio activo)
  selectRole: (role, businessId = null) => {
    const payload = { role }
    if (businessId) payload.business_id = businessId
    return api.post('role/select', payload)
  },
  updateProfile: (formData) => api.post('profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateWaiterProfile: (data) => api.post('profile/waiter/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProfileCompleteness: () => api.get('profile/completeness'),
  
  // 🔄 NUEVAS APIs de Perfiles Separados por Rol
  getActiveUserProfile: (businessId = null) => {
    const params = businessId ? { business_id: businessId } : {}
    return api.get('user-profile/active', { params })
  },
  getAllUserProfiles: () => api.get('user-profile/all'),
  updateWaiterUserProfile: (data) => api.post('user-profile/waiter/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateAdminUserProfile: (data) => api.post('user-profile/admin/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteUserProfileAvatar: (data) => api.delete('user-profile/avatar', { data }),
  changePassword: (data) => api.post('change-password', data),
  deleteAccount: (data) => api.delete('delete-account', { data }),
  sendWhatsAppMessage: (data) => api.post('profile/whatsapp/send', data),
  
  // Notificaciones de usuario (contrato propone /user/notifications)
  // Mantenemos compat con el antiguo si el backend lo soporta en otra capa.
  getNotifications: () => api.get('user/notifications'),
  handleNotification: (notificationId) => api.post(`user/notifications/${notificationId}/read`),
  globalNotifications: (data) => api.post('notifications/global', data),
  
  storeDeviceToken: (data) => api.post('device-token', data),
  deleteDeviceToken: (arg) => {
    // Permitir: deleteDeviceToken({ token }) ó deleteDeviceToken(tokenId)
    if (arg && typeof arg === 'object') {
      return api.delete('device-token', { data: arg })
    }
    if (typeof arg === 'string' || typeof arg === 'number') {
      return api.delete(`device-token/${arg}`)
    }
    return api.delete('device-token')
  },
  
  toggleTableNotifications: (tableId) => api.post(`tables/toggle-notifications/${tableId}`),
  
  waiterOnboard: (code) => api.post('waiter/onboard', { code }),
  getWaiterTables: () => api.get('waiter/tables'),
  listWaiterProfiles: () => api.get('waiter/profiles'),
  createWaiterProfile: (data) => api.post('waiter/profiles', data),
  deleteWaiterProfile: (profileId) => api.delete(`waiter/profiles/${profileId}`),
  
  getWaiterNotifications: () => api.get('waiter/notifications'),
  handleWaiterNotification: (notificationId, data) => api.post(`waiter/notifications/handle/${notificationId}`, data),
  waiterGlobalNotifications: (data) => api.post('waiter/notifications/global', data),
  waiterToggleTableNotifications: (tableId) => api.post(`waiter/tables/toggle-notifications/${tableId}`),
  
  // INFO de negocio activo del Admin
  getBusinessInfo: () => api.get('admin/business'),
  // Listar todos los negocios del admin (incluye activo)
  getAdminBusinesses: () => api.get('admin/businesses'),
  removeStaff: (staffId) => api.delete(`admin/staff/${staffId}`),
  handleStaffRequest: (requestId, data) => api.post(`admin/staff/request/${requestId}`, data),
  getStaffRequests: () => api.get('admin/staff/requests'),
  getArchivedStaffRequests: () => api.get('admin/staff/requests/archived'),
  getTables: () => api.get('tables'),
  createTable: (data) => api.post('tables', data),
  updateTable: (tableId, data) => api.put(`tables/${tableId}`, data),
  deleteTable: (tableId) => api.delete(`tables/${tableId}`),
  getMenus: () => api.get('menus'),
  uploadMenu: (formData) => api.post('menus', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  setDefaultMenu: (data) => api.post('menus/default', data),
  // QR Admin
  generateQRCode: (tableId) => api.post(`admin/qr/generate/${tableId}`),
  regenerateQRCode: (tableId) => api.post(`admin/qr/generate/${tableId}`, { regenerate: true }),
  getQrPreview: (tableId) => api.get(`admin/qr/preview/${tableId}`, { responseType: 'text' }),
  exportQR: (data) => api.post('admin/qr/export', data),
  sendQrEmail: (data) => api.post('admin/qr/email', data),
  getSettings: () => api.get('admin/settings'),
  updateSettings: (data) => api.post('admin/settings', data),
  deleteMenu: (menuId) => api.delete(`menus/${menuId}`),
  renameMenu: (menuId, data) => api.put(`menus/${menuId}`, data),
  // Reordenar menús según contrato: { order: [{ menu_id, display_order }] }
  reorderMenus: (order) => api.post('menus/reorder', { order }),
  previewMenu: (menuId) => api.get(`menus/${menuId}/preview`, { responseType: 'blob' }),
  downloadMenu: (menuId) => api.get(`menus/${menuId}/download`, { responseType: 'blob' }),
  cloneTable: (tableId, data) => api.post(`tables/clone/${tableId}`, data),
  getStaff: (page = 1) => api.get(`admin/staff?page=${page}`),
  getStaffMember: (staffId) => api.get(`admin/staff/${staffId}`),
  updateStaffMember: (staffId, data) => {
    if (data instanceof FormData) {
      return api.post(`admin/staff/${staffId}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`admin/staff/${staffId}`, data);
  },
  inviteStaff: (data) => api.post('admin/staff/invite', data),
  addReview: (staffId, data) => api.post(`admin/staff/${staffId}/reviews`, data),
  deleteReview: (staffId, reviewId) => api.delete(`admin/staff/${staffId}/reviews/${reviewId}`),
  changePassword: (data) => api.post('change-password', data),
  deleteAccount: (data) => api.delete('delete-account', { data }),
  getAdminStatistics: () => api.get('admin/statistics'),
  
  getAdminNotifications: () => api.get('admin/notifications'),
  listWorkHistory: () => api.get('profile/work-history'),
  addWorkHistory: (data) => api.post('profile/work-history', data),
  updateWorkHistory: (workExperienceId, data) => api.put(`profile/work-history/${workExperienceId}`, data),
  deleteWorkHistory: (workExperienceId) => api.delete(`profile/work-history/${workExperienceId}`),
  getAdminTables: () => api.get('admin/tables'),
  getAdminTableDetails: (tableId) => api.get(`admin/tables/${tableId}`),
  updateAdminTable: (tableId, data) => api.put(`admin/tables/${tableId}`, data),
  deleteAdminTable: (tableId) => api.delete(`admin/tables/${tableId}`),
  getAdminStaff: () => api.get('admin/staff'),
  getAdminStaffDetails: (staffId) => api.get(`admin/staff/${staffId}`),
  createAdminStaff: (data) => api.post('admin/staff', data),
  updateAdminStaff: (staffId, data) => api.post(`admin/staff/${staffId}`, data),
  deleteAdminStaff: (staffId) => api.delete(`admin/staff/${staffId}`),
  
  // 🔥 NEW STAFF MANAGEMENT APIs with Firebase
  getStaffByBusiness: (businessId) => api.get(`staff?business_id=${businessId}`),
  createStaff: (data) => api.post('staff', data),
  getStaffById: (id) => api.get(`staff/${id}`),
  approveStaff: (id, data) => api.post(`staff/${id}/approve`, data),
  rejectStaff: (id, data) => api.post(`staff/${id}/reject`, data),
  inviteStaffMember: (id) => api.post(`staff/${id}/invite`),
  getStaffWhatsApp: (id) => api.get(`staff/${id}/whatsapp`),
  deleteStaffById: (id) => api.delete(`staff/${id}`),
  joinStaffWithToken: (token, data) => api.post(`staff/join/${token}`, data),
  testStaffNotifications: (data) => api.post('staff/test-notifications', data),
  
  getAdminMenus: () => api.get('admin/menus'),
  getAdminMenuDetails: (menuId) => api.get(`admin/menus/${menuId}`),
  createAdminMenu: (data) => api.post('admin/menus', data),
  updateAdminMenu: (menuId, data) => api.post(`admin/menus/update/${menuId}`, data),
  deleteAdminMenu: (menuId) => api.delete(`admin/menus/${menuId}`),
  getAdminRequests: () => api.get('admin/requests'),
  
  // Notificaciones FCM - Envío
  sendNotificationToAll: (data) => api.post('admin/notifications/send-to-all', data),
  sendNotificationToUser: (data) => api.post('admin/notifications/send-to-user', data),
  sendNotificationToDevice: (data) => api.post('admin/notifications/send-to-device', data),
  sendNotificationToTopic: (data) => api.post('admin/notifications/send-to-topic', data),
  
  // Notificaciones FCM - Gestión de Topics
  subscribeToTopic: (data) => api.post('admin/notifications/subscribe-to-topic', data),
  unsubscribeFromTopic: (data) => api.post('admin/notifications/unsubscribe-from-topic', data),
  
  // Device Tokens - Gestión (mantener helper de listado por compatibilidad)
  getDeviceTokens: (userId) => api.get(`device-tokens/${userId}`),
  
  // Compatibilidad con endpoints existentes
  sendPushToUser: (data) => api.post('admin/notifications/send-to-user', data),
  
  healthCheck: () => api.get('health-check'),

  // ===== ADMIN BUSINESS =====
  getBusinessInfo: () => api.get('admin/business'),
  createBusiness: (data) => api.post('admin/business/create', data),
  joinBusiness: (invitationCode) => api.post('join-business', { invitation_code: invitationCode }),
  regenerateInvitationCode: () => api.post('admin/business/regenerate-invitation-code'),
  deleteBusiness: (businessId) => api.delete(`admin/business/${businessId}`),

  // ===== UNIFIED FIREBASE CONFIG =====
  getFirebaseConfig: () => api.get('firebase/config'),

  // ===== FCM TOKEN (NUEVOS ENDPOINTS UNIFICADOS) =====
  registerWaiterFcm: (data) => api.post('waiter/fcm/register', data),
  refreshWaiterFcm: (data) => api.post('waiter/fcm/refresh', data),
  deleteWaiterFcmToken: (data) => api.delete('waiter/fcm/token', { data }),
  testWaiterFcm: (data) => api.post('waiter/fcm/test', data),

  // ===== WAITER CALLS APIs =====
  
  // Mozo - Gestión de llamadas
  getPendingCalls: () => api.get('waiter/calls/pending'),
  acknowledgeCall: (callId) => api.post(`waiter/calls/${callId}/acknowledge`),
  completeCall: (callId) => api.post(`waiter/calls/${callId}/complete`),
  
  // Historial de llamadas
  getWaiterCallHistory: (params = {}) => api.get('waiter/calls/history', { params }),
  getAdminCallHistory: (params = {}) => api.get('admin/calls/history', { params }),
  
  // ===== WAITER TABLE MANAGEMENT APIs =====
  
  // Gestión individual de mesas
  activateTable: (tableId) => {
    //console.log('🌐 API: POST waiter/tables/' + tableId + '/activate')
    return api.post(`waiter/tables/${tableId}/activate`)
  },
  deactivateTable: (tableId) => {
    //console.log('🌐 API: DELETE waiter/tables/' + tableId + '/activate')
    return api.delete(`waiter/tables/${tableId}/activate`)
  },
  
  // Gestión múltiple de mesas
  activateMultipleTables: (data) => {
    //console.log('🌐 API: POST waiter/tables/activate/multiple', data)
    return api.post('waiter/tables/activate/multiple', data)
  },
  deactivateMultipleTables: (data) => {
    //console.log('🌐 API: POST waiter/tables/deactivate/multiple', data)
    return api.post('waiter/tables/deactivate/multiple', data)
  },
  
  // Silenciado de mesas
  silenceTable: (tableId, data) => {
    //console.log('🌐 API: POST waiter/tables/' + tableId + '/silence', data)
    return api.post(`waiter/tables/${tableId}/silence`, data)
  },
  unsilenceTable: (tableId) => {
    //console.log('🌐 API: DELETE waiter/tables/' + tableId + '/silence')
    return api.delete(`waiter/tables/${tableId}/silence`)
  },
  silenceMultipleTables: (data) => api.post('waiter/tables/silence/multiple', data),
  unsilenceMultipleTables: (data) => api.post('waiter/tables/unsilence/multiple', data),
  getSilencedTables: () => api.get('waiter/tables/silenced'),
  
  // Consulta de mesas  
  getAssignedTables: () => api.get('waiter/tables/assigned'),
  getAvailableTables: () => api.get('waiter/tables/available'),
  
  // Admin - Mesas silenciadas
  getAdminSilencedTables: () => api.get('admin/tables/silenced'),
  adminUnsilenceTable: (tableId) => api.delete(`admin/tables/${tableId}/silence`),
  
  // ===== TABLE PROFILES APIs =====
  
  // Perfiles de mesa para mozos
  getWaiterTableProfiles: () => api.get('waiter/table-profiles'),
  getWaiterTableProfile: (profileId) => api.get(`waiter/table-profiles/${profileId}`),
  createWaiterTableProfile: (data) => api.post('waiter/table-profiles', data),
  updateWaiterTableProfile: (profileId, data) => api.put(`waiter/table-profiles/${profileId}`, data),
  deleteWaiterTableProfile: (profileId) => api.delete(`waiter/table-profiles/${profileId}`),
  activateWaiterTableProfile: (profileId) => api.post(`waiter/table-profiles/${profileId}/activate`),
  deactivateWaiterTableProfile: (profileId) => api.post(`waiter/table-profiles/${profileId}/deactivate`),
  getWaiterTableProfileNotifications: () => api.get('waiter/table-profiles/notifications'),
  
  // Dashboard de mozo - Estado de mesas
  getWaiterDashboard: () => api.get('waiter/dashboard'),
  getWaiterTableStatus: () => api.get('waiter/tables/status'),
  
  // ===== BUSINESS/WORKPLACE MANAGEMENT =====
  
  // Obtener negocios donde el mozo trabaja
  getWaiterBusinesses: () => api.get('waiter/businesses'),
  
  // Seleccionar negocio activo para trabajar
  setActiveWaiterBusiness: (businessId) => api.post('waiter/set-active-business', { business_id: businessId }),
  
  // Obtener negocio actualmente activo
  getActiveWaiterBusiness: () => api.get('waiter/businesses/active'),
  
  // Obtener mesas de un negocio específico
  getWaiterBusinessTables: (businessId) => {
    //console.log('🌐 API: GET waiter/businesses/' + businessId + '/tables')
    return api.get(`waiter/businesses/${businessId}/tables`)
  },
  
  // Unirse a un negocio con código
  joinBusinessWithCode: (code) => api.post('waiter/join-business', { business_code: code }),
  
  // Salir de un negocio
  leaveWaiterBusiness: (businessId) => api.delete(`waiter/businesses/${businessId}/leave`),
  
  // ===== ANTI-SPAM APIs =====
  
  // Bloquear IP por spam
  blockIpForSpam: (data) => api.post('waiter/ip/block', data),
  
  // Desbloquear IP
  unblockIp: (data) => api.post('waiter/ip/unblock', data),
  
  // Listar IPs bloqueadas
  getBlockedIps: (params) => api.get('waiter/ip/blocked', { params }),

  // Debug de estado de IP bloqueada
  debugBlockedIp: (params) => api.get('waiter/ip/debug', { params }),

  // Desbloqueo forzado de una IP
  forceUnblockIp: (data) => api.post('waiter/ip/force-unblock', data),
  
  // ===== WAITER PROFILE APIs =====
  // Obtener negocios activos del waiter para hoy
  getWaiterBusinessesActiveToday: () => api.get('waiter/businesses/active-today'),
  
  // Abandonar un negocio
  leaveBusinessAsWaiter: (data) => api.post('waiter/leave-business', data)
}

export { api, apiService }
export default apiService