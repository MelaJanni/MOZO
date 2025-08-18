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
  loginWithGoogle: (token) => api.post('login/google', { token }),
  forgotPassword: (email) => api.post('forgot-password', email),
  resetPassword: (data) => api.post('reset-password', data),
  callWaiter: (tableId) => api.post(`tables/${tableId}/call-waiter`),
  register: (data) => api.post('register', data),
  
  getCurrentUser: () => api.get('user'),
  logout: () => api.post('logout'),
  selectRole: (role) => api.post('role/select', { role }),
  updateProfile: (formData) => api.post('profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendWhatsAppMessage: (data) => api.post('profile/whatsapp/send', data),
  
  getNotifications: () => api.get('notifications'),
  handleNotification: (notificationId, data) => api.post(`notifications/handle/${notificationId}`, data),
  globalNotifications: (data) => api.post('notifications/global', data),
  
  storeDeviceToken: (data) => api.post('device-token', data),
  deleteDeviceToken: (data) => api.delete('device-token', { data }),
  
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
  
  getBusinessInfo: () => api.get('admin/business'),
  switchView: (data) => api.post('admin/switch-view', data),
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
  generateQRCode: (tableId) => {
    const qrBaseUrl = import.meta.env.VITE_QR_BASE_URL || window.location.origin;
    console.log('🔍 Generating QR with base URL:', qrBaseUrl);
    console.log('📋 Environment vars:', {
      VITE_QR_BASE_URL: import.meta.env.VITE_QR_BASE_URL,
      VITE_URL_API: import.meta.env.VITE_URL_API,
      window_origin: window.location.origin
    });
    return api.post(`admin/qr/generate/${tableId}`, { 
      base_url: qrBaseUrl 
    });
  },
  exportQR: (data) => api.post('admin/qr/export', data),
  getSettings: () => api.get('admin/settings'),
  updateSettings: (data) => api.post('admin/settings', data),
  deleteMenu: (menuId) => api.delete(`menus/${menuId}`),
  renameMenu: (menuId, data) => api.put(`menus/${menuId}`, data),
  reorderMenus: (menuOrder) => api.post('menus/reorder', { menu_order: menuOrder }),
  previewMenu: (menuId) => api.get(`menus/${menuId}/preview`, { responseType: 'blob' }),
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
  sendQrEmail: (data) => api.post('admin/qr/email', data),
  
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
  
  // Device Tokens - Gestión
  storeDeviceToken: (data) => api.post('device-token', data),
  getDeviceTokens: (userId) => api.get(`device-tokens/${userId}`),
  deleteDeviceToken: (tokenId) => api.delete(`device-token/${tokenId}`),
  
  // Compatibilidad con endpoints existentes
  sendPushToUser: (data) => api.post('admin/notifications/send-to-user', data),
  
  healthCheck: () => api.get('health-check'),

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
  leaveWaiterBusiness: (businessId) => api.delete(`waiter/businesses/${businessId}/leave`)
}

export { api, apiService }
export default apiService