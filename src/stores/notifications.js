import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import notificationsService from '../services/notifications'
import { showSuccessToast, showErrorToast } from '../utils/notifications'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    // Notificaciones del usuario
    unreadNotifications: [],
    readNotifications: [],
    unreadCount: 0,
    
    // Notificaciones de mozo
    waiterUnreadNotifications: [],
    waiterReadNotifications: [],
    waiterUnreadCount: 0,
    
    // Notificaciones de administrador
    adminNotifications: [],
    
    // Estado de carga
    loading: false,
    loadingWaiter: false,
    loadingAdmin: false,
    
    // Configuración de notificaciones
    globalNotificationsEnabled: true,
    tableNotificationsEnabled: {},
    
    // Firestore para notificaciones en tiempo real
    isConnected: false
  }),

  getters: {
    /**
     * Obtener todas las notificaciones no leídas
     */
    allUnreadNotifications: (state) => {
      return [...state.unreadNotifications, ...state.waiterUnreadNotifications]
    },

    /**
     * Obtener todas las notificaciones leídas
     */
    allReadNotifications: (state) => {
      return [...state.readNotifications, ...state.waiterReadNotifications]
    },

    /**
     * Contador total de notificaciones no leídas
     */
    totalUnreadCount: (state) => {
      return state.unreadCount + state.waiterUnreadCount
    },

    /**
     * Verificar si hay notificaciones no leídas
     */
    hasUnreadNotifications: (state) => {
      return state.unreadCount > 0 || state.waiterUnreadCount > 0
    },

    /**
     * Obtener notificaciones por tipo
     */
    getNotificationsByType: (state) => (type) => {
      const allNotifications = [
        ...state.unreadNotifications,
        ...state.readNotifications,
        ...state.waiterUnreadNotifications,
        ...state.waiterReadNotifications
      ]
      return allNotifications.filter(notification => notification.type === type)
    }
  },

  actions: {
    // ===== NOTIFICACIONES GENERALES =====
    
    /**
     * Cargar notificaciones del usuario
     */
    async loadNotifications() {
      try {
        this.loading = true
        const data = await notificationsService.getNotifications()
        
        this.unreadNotifications = data.unread_notifications || []
        this.readNotifications = data.read_notifications || []
        this.unreadCount = data.unread_count || 0
        
        return data
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
        showErrorToast('Error al cargar las notificaciones')
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Manejar notificación (marcar como leída o eliminar)
     */
    async handleNotification(notificationId, action) {
      try {
        const response = await notificationsService.handleNotification(notificationId, action)
        
        if (action === 'mark_as_read') {
          // Mover de no leídas a leídas
          const notification = this.unreadNotifications.find(n => n.id === notificationId)
          if (notification) {
            this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notificationId)
            this.readNotifications.unshift(notification)
            this.unreadCount = Math.max(0, this.unreadCount - 1)
          }
        } else if (action === 'delete') {
          // Eliminar de ambas listas
          this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notificationId)
          this.readNotifications = this.readNotifications.filter(n => n.id !== notificationId)
        }
        
        showSuccessToast(response.message || 'Notificación procesada correctamente')
        return response
      } catch (error) {
        console.error('Error manejando notificación:', error)
        showErrorToast('Error al procesar la notificación')
        throw error
      }
    },

    /**
     * Marcar todas las notificaciones como leídas
     */
    async markAllAsRead() {
      try {
        if (this.unreadNotifications.length === 0) return
        
        await notificationsService.markAllAsRead(this.unreadNotifications)
        
        // Mover todas las no leídas a leídas
        this.readNotifications.unshift(...this.unreadNotifications)
        this.unreadNotifications = []
        this.unreadCount = 0
        
        showSuccessToast('Todas las notificaciones marcadas como leídas')
      } catch (error) {
        console.error('Error marcando todas como leídas:', error)
        showErrorToast('Error al marcar como leídas')
        throw error
      }
    },

    /**
     * Eliminar todas las notificaciones leídas
     */
    async deleteAllRead() {
      try {
        if (this.readNotifications.length === 0) return
        
        await notificationsService.deleteAllRead(this.readNotifications)
        this.readNotifications = []
        
        showSuccessToast('Notificaciones leídas eliminadas')
      } catch (error) {
        console.error('Error eliminando notificaciones leídas:', error)
        showErrorToast('Error al eliminar notificaciones')
        throw error
      }
    },

    // ===== NOTIFICACIONES DE MOZO =====
    
    /**
     * Cargar notificaciones del mozo
     */
    async loadWaiterNotifications() {
      try {
        this.loadingWaiter = true
        const data = await notificationsService.getWaiterNotifications()
        
        this.waiterUnreadNotifications = data.unread_notifications || []
        this.waiterReadNotifications = data.read_notifications || []
        this.waiterUnreadCount = data.unread_count || 0
        
        return data
      } catch (error) {
        console.error('Error cargando notificaciones de mozo:', error)
        showErrorToast('Error al cargar las notificaciones')
        throw error
      } finally {
        this.loadingWaiter = false
      }
    },

    /**
     * Manejar notificación del mozo
     */
    async handleWaiterNotification(notificationId, action) {
      try {
        const response = await notificationsService.handleWaiterNotification(notificationId, action)
        
        if (action === 'mark_as_read') {
          const notification = this.waiterUnreadNotifications.find(n => n.id === notificationId)
          if (notification) {
            this.waiterUnreadNotifications = this.waiterUnreadNotifications.filter(n => n.id !== notificationId)
            this.waiterReadNotifications.unshift(notification)
            this.waiterUnreadCount = Math.max(0, this.waiterUnreadCount - 1)
          }
        } else if (action === 'delete') {
          this.waiterUnreadNotifications = this.waiterUnreadNotifications.filter(n => n.id !== notificationId)
          this.waiterReadNotifications = this.waiterReadNotifications.filter(n => n.id !== notificationId)
        }
        
        showSuccessToast(response.message || 'Notificación procesada correctamente')
        return response
      } catch (error) {
        console.error('Error manejando notificación de mozo:', error)
        showErrorToast('Error al procesar la notificación')
        throw error
      }
    },

    /**
     * Configurar notificaciones globales del mozo
     */
    async setWaiterGlobalNotifications(enabled) {
      try {
        const response = await notificationsService.waiterGlobalNotifications(enabled)
        this.globalNotificationsEnabled = enabled
        
        showSuccessToast(response.message || 'Configuración actualizada')
        return response
      } catch (error) {
        console.error('Error configurando notificaciones globales:', error)
        showErrorToast('Error al actualizar la configuración')
        throw error
      }
    },

    // ===== NOTIFICACIONES DE ADMINISTRADOR =====
    
    /**
     * Cargar notificaciones del administrador
     */
    async loadAdminNotifications() {
      try {
        this.loadingAdmin = true
        const data = await notificationsService.getAdminNotifications()
        
        this.adminNotifications = data.notifications || []
        
        return data
      } catch (error) {
        console.error('Error cargando notificaciones de administrador:', error)
        showErrorToast('Error al cargar las notificaciones')
        throw error
      } finally {
        this.loadingAdmin = false
      }
    },

    // ===== TOKENS DE DISPOSITIVO =====
    
    /**
     * Guardar token de dispositivo
     */
    async storeDeviceToken(token, platform = 'web') {
      try {
        const response = await notificationsService.storeDeviceToken(token, platform)
        showSuccessToast('Token de dispositivo guardado')
        return response
      } catch (error) {
        console.error('Error guardando token de dispositivo:', error)
        showErrorToast('Error al guardar el token')
        throw error
      }
    },

    /**
     * Eliminar token de dispositivo
     */
    async deleteDeviceToken(token) {
      try {
        const response = await notificationsService.deleteDeviceToken(token)
        showSuccessToast('Token de dispositivo eliminado')
        return response
      } catch (error) {
        console.error('Error eliminando token de dispositivo:', error)
        showErrorToast('Error al eliminar el token')
        throw error
      }
    },

    // ===== NOTIFICACIONES DE MESA =====
    
    /**
     * Alternar notificaciones de mesa
     */
    async toggleTableNotifications(tableId) {
      try {
        const response = await notificationsService.toggleTableNotifications(tableId)
        
        // Actualizar el estado local
        this.tableNotificationsEnabled[tableId] = response.notifications_enabled
        
        showSuccessToast(response.message || 'Estado de notificaciones actualizado')
        return response
      } catch (error) {
        console.error('Error alternando notificaciones de mesa:', error)
        showErrorToast('Error al actualizar notificaciones de mesa')
        throw error
      }
    },

    // ===== NOTIFICACIONES EN TIEMPO REAL (FIREBASE) =====
    
    async initializeRealTimeNotifications() {
      const authStore = useAuthStore()
      console.log('🔥 Notificaciones en tiempo real delegadas a Firebase Realtime')
      console.log('ℹ️ Las notificaciones de mozo se manejan directamente con Firebase')
      
      // Las notificaciones en tiempo real ahora se manejan por:
      // - Firebase Realtime Notifications para mozos
      // - Firebase Cloud Messaging para notificaciones generales
      
      this.isConnected = true
      return true
    },

    async disconnectRealTimeNotifications() {
      console.log('🔥 Desconectando notificaciones en tiempo real...')
      this.isConnected = false
      console.log('✅ Notificaciones desconectadas')
    },
    
    /**
     * Agregar nueva notificación (para Firestore y FCM)
     */
    addNewNotification(notification) {
      // Verificar si ya existe para evitar duplicados
      const existsInUnread = this.unreadNotifications.find(n => n.id === notification.id)
      const existsInWaiterUnread = this.waiterUnreadNotifications.find(n => n.id === notification.id)
      
      if (existsInUnread || existsInWaiterUnread) {
        console.log('🔍 Notificación ya existe, actualizando...', notification.id)
        this.updateExistingNotification(notification)
        return
      }

      // Determinar el tipo de notificación y agregarla a la lista correspondiente
      if (notification.type === 'waiter_call' || notification.type === 'table_call') {
        this.waiterUnreadNotifications.unshift(notification)
        this.waiterUnreadCount++
        console.log('🍽️ Nueva notificación de mozo agregada:', notification.title || notification.body)
      } else {
        this.unreadNotifications.unshift(notification)
        this.unreadCount++
        console.log('🔔 Nueva notificación general agregada:', notification.title || notification.body)
      }
      
      // Mostrar notificación toast
      const message = notification.title || notification.body || notification.message || 'Tienes una nueva notificación'
      showSuccessToast(`Nueva notificación: ${message}`)
    },

    /**
     * Actualizar notificación existente
     */
    updateExistingNotification(notification) {
      // Buscar en notificaciones no leídas
      const unreadIndex = this.unreadNotifications.findIndex(n => n.id === notification.id)
      if (unreadIndex !== -1) {
        this.unreadNotifications[unreadIndex] = notification
        
        // Si fue marcada como leída, moverla
        if (notification.read_at) {
          const movedNotification = this.unreadNotifications.splice(unreadIndex, 1)[0]
          this.readNotifications.unshift(movedNotification)
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
        return
      }

      // Buscar en notificaciones de mozo no leídas
      const waiterUnreadIndex = this.waiterUnreadNotifications.findIndex(n => n.id === notification.id)
      if (waiterUnreadIndex !== -1) {
        this.waiterUnreadNotifications[waiterUnreadIndex] = notification
        
        // Si fue marcada como leída, moverla
        if (notification.read_at) {
          const movedNotification = this.waiterUnreadNotifications.splice(waiterUnreadIndex, 1)[0]
          this.waiterReadNotifications.unshift(movedNotification)
          this.waiterUnreadCount = Math.max(0, this.waiterUnreadCount - 1)
        }
        return
      }

      console.log('⚠️ No se encontró la notificación para actualizar:', notification.id)
    },

    /**
     * Eliminar notificación
     */
    removeNotification(notificationId) {
      // Eliminar de todas las listas
      this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notificationId)
      this.readNotifications = this.readNotifications.filter(n => n.id !== notificationId)
      this.waiterUnreadNotifications = this.waiterUnreadNotifications.filter(n => n.id !== notificationId)
      this.waiterReadNotifications = this.waiterReadNotifications.filter(n => n.id !== notificationId)
      
      // Recalcular contadores
      this.unreadCount = this.unreadNotifications.length
      this.waiterUnreadCount = this.waiterUnreadNotifications.length
      
      console.log('🗑️ Notificación eliminada:', notificationId)
    },

    /**
     * Limpiar estado
     */
    clearState() {
      this.unreadNotifications = []
      this.readNotifications = []
      this.unreadCount = 0
      this.waiterUnreadNotifications = []
      this.waiterReadNotifications = []
      this.waiterUnreadCount = 0
      this.adminNotifications = []
      this.loading = false
      this.loadingWaiter = false
      this.loadingAdmin = false
      this.globalNotificationsEnabled = true
      this.tableNotificationsEnabled = {}
    }
  }
}) 