import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { initializeEcho, disconnectEcho } from '../services/echo'
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
    
    // WebSocket/Echo para notificaciones en tiempo real
    echo: null,
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

    // ===== NOTIFICACIONES EN TIEMPO REAL =====
    
    initializeRealTimeNotifications() {
      const authStore = useAuthStore()
      console.log('🔍 Inicializando notificaciones en tiempo real...')
      console.log('🔍 Usuario autenticado:', authStore.user)
      
      if (!authStore.user) {
        console.error('No se puede inicializar Echo sin un usuario autenticado.')
        return
      }

      try {
        console.log('🔍 Creando instancia de Echo...')
        this.echo = initializeEcho()
        console.log('🔍 Echo creado:', !!this.echo)

        this.echo.connector.pusher.connection.bind('connected', () => {
          this.isConnected = true
          console.log('🔍 WebSocket Conectado!');
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
          this.isConnected = false;
          console.log('🔍 WebSocket Desconectado!');
        });

        this.echo.connector.pusher.connection.bind('error', (error) => {
          console.error('🔍 Error en WebSocket:', error);
        });

        this.echo.connector.pusher.connection.bind('connecting', () => {
          console.log('🔍 WebSocket conectando...');
        });

        console.log('🔍 Suscribiendo al canal privado del usuario:', authStore.user.id);
        this.echo.private(`App.Models.User.${authStore.user.id}`)
          .notification((notification) => {
            console.log('🔍 Notificación en tiempo real recibida:', notification);
            this.addNewNotification(notification)
          });
          
        console.log('🔍 Notificaciones en tiempo real inicializadas correctamente');
      } catch (error) {
        console.error('🔍 Error inicializando notificaciones en tiempo real:', error);
        throw error;
      }
    },

    disconnectRealTimeNotifications() {
      disconnectEcho()
      this.isConnected = false
    },
    
    /**
     * Agregar nueva notificación (para WebSocket/Echo)
     */
    addNewNotification(notification) {
      // Determinar el tipo de notificación y agregarla a la lista correspondiente
      if (notification.type === 'table_call') {
        this.waiterUnreadNotifications.unshift(notification)
        this.waiterUnreadCount++
      } else {
        this.unreadNotifications.unshift(notification)
        this.unreadCount++
      }
      
      // Mostrar notificación toast
      showSuccessToast(`Nueva notificación: ${notification.message || 'Tienes una nueva notificación'}`)
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