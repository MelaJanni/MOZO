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
    soundEnabled: true,
    tableNotificationsEnabled: {},
    
    // Real-time notifications
    isConnected: false,
    realtimeListener: null,
    lastNotificationSound: 0
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
    },
    /**
     * Verificar si existe una notificación por id (para dedupe externo)
     */
    hasNotification: (state) => (id) => {
      return !!(
        state.unreadNotifications.find(n => n.id === id) ||
        state.readNotifications.find(n => n.id === id) ||
        state.waiterUnreadNotifications.find(n => n.id === id) ||
        state.waiterReadNotifications.find(n => n.id === id)
      )
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
      console.log('🚨🚨🚨 ADMIN DEBUG: initializeRealTimeNotifications CALLED - NEW CODE LOADED! 🚨🚨🚨')
      const authStore = useAuthStore()
      // Inicializar listeners de staff en Realtime Database
      try {
        const user = authStore.user
        console.log('🔍 DEBUG: initializeRealTimeNotifications called with user:', user)
        
        if (!user) {
          console.log('🔍 DEBUG: No user found, marking as connected and returning')
          this.isConnected = true
          return true
        }

        console.log('🔍 DEBUG: Importing staffRealtime services...')
        const { startStaffRealtimeForAdmin, startStaffRealtimeForUser } = await import('@/services/staffRealtime')

        // Si el usuario es admin con business_id, escuchar businesses_staff
        const role = user.role || user.selectedRole
        console.log('🔍 DEBUG: User role determined as:', role)
        
        // Try to get business_id from multiple sources for admin users
        let businessId = user.business_id
        console.log('🔍 DEBUG: Initial business_id from user:', businessId)
        
        if (role === 'admin' && !businessId) {
          try {
            console.log('🔍 DEBUG: Trying to get business_id from adminStore...')
            const { useAdminStore } = await import('@/stores/admin')
            const adminStore = useAdminStore()
            businessId = adminStore.businessData?.id
            console.log('🔍 DEBUG: business_id from adminStore:', businessId)
            console.log('🔍 DEBUG: Full adminStore.businessData:', adminStore.businessData)
          } catch (adminStoreError) {
            console.error('🔍 DEBUG: Error loading admin store for business_id:', adminStoreError)
          }
        }
        
        console.log('🔍 DEBUG: Final values - role:', role, 'user.business_id:', user.business_id, 'final businessId:', businessId)
        
        if (role === 'admin' && businessId) {
          console.log('🔔 Admin notifications: Starting realtime listener for businessId:', businessId)
          
          // Track last seen update time to detect new requests
          let lastSeenUpdate = Date.now()
          
          await startStaffRealtimeForAdmin(businessId, (val) => {
            try {
              console.log('🔔 Admin notifications: Received data:', val)
              if (val && val.stats) {
                window.dispatchEvent(new CustomEvent('businessStaffStatsUpdate', { detail: { businessId: businessId, stats: val.stats, recent_activity: val.recent_activity } }))
              }

              if (val && val.recent_activity) {
                const activity = val.recent_activity
                const status = activity.last_request_status
                const requesterName = activity.last_request_name || 'Usuario'
                const updateTime = activity.last_update || 0
                
                console.log('🔔 Admin notifications: Processing activity:', activity, 'status:', status)
                console.log('🔔 Admin notifications: Update time:', updateTime, 'Last seen:', lastSeenUpdate)
                
                // Check if this is a new request (updated after our tracking started)
                const isNewRequest = updateTime > lastSeenUpdate
                
                console.log('🔔 Admin notifications: Is new request?', isNewRequest)
                
                // Only create notifications for new pending requests
                // Do NOT notify admin about their own actions (confirmed/rejected requests)
                if (status === 'pending' && isNewRequest) {
                  console.log('🔔 Admin notifications: Creating notification for NEW PENDING REQUEST')
                  const note = {
                    id: `staff_req_${activity.last_request_id}_${updateTime}`,
                    type: 'staff_request',
                    data: {
                      title: '👥 Nueva solicitud de personal',
                      message: `${requesterName} quiere unirse a tu negocio`,
                      route: '/admin/staff/requests',
                      business_id: businessId,
                      staff_request_id: activity.last_request_id,
                      requester_name: requesterName
                    },
                    created_at: new Date().toISOString()
                  }
                  this.addNewNotification(note)
                } else if (status !== 'pending') {
                  console.log('🔔 Admin notifications: Skipping notification - request already processed (status:', status, ')')
                } else if (!isNewRequest) {
                  console.log('🔔 Admin notifications: Skipping notification - not a new request')
                }
                
                // Update our tracking time for future comparisons
                if (updateTime > lastSeenUpdate) {
                  lastSeenUpdate = updateTime
                }
              }
            } catch (err) {
              console.error('Error handling admin realtime staff update', err)
            }
          })
        }

        // Para usuarios staff, escuchar users_staff/{userId}
        if (user.id) {
          await startStaffRealtimeForUser(user.id, (val) => {
            try {
              if (!val) return
              const current = val.current_request
              if (current && current.status) {
                const status = current.status
                const businessName = current.business_name || 'el negocio'
                
                if (status === 'confirmed') {
                  const note = {
                    id: `user_staff_${current.id || Date.now()}`,
                    type: 'staff_request_approved',
                    data: {
                      title: '✅ ¡Solicitud aprobada!',
                      message: `${businessName} te ha aceptado como parte del equipo`,
                      route: '/waiter/dashboard',
                      user_id: user.id,
                      request: current,
                      business_name: businessName
                    },
                    created_at: new Date().toISOString()
                  }
                  this.addNewNotification(note)
                  
                  // Dispatch event for waiter dashboard to reload data
                  window.dispatchEvent(new CustomEvent('staffRequestApproved', {
                    detail: { request: current, businessName }
                  }))
                } else if (status === 'rejected') {
                  const note = {
                    id: `user_staff_${current.id || Date.now()}`,
                    type: 'staff_request_rejected',
                    data: {
                      title: '❌ Solicitud rechazada',
                      message: `${businessName} ha rechazado tu solicitud`,
                      route: '/waiter/dashboard',
                      user_id: user.id,
                      request: current,
                      business_name: businessName
                    },
                    created_at: new Date().toISOString()
                  }
                  this.addNewNotification(note)
                } else if (status === 'invited') {
                  const note = {
                    id: `user_staff_${current.id || Date.now()}`,
                    type: 'staff_invitation',
                    data: {
                      title: '📩 Invitación de trabajo',
                      message: `${businessName} te ha invitado a trabajar con ellos`,
                      route: '/staff/invitations',
                      user_id: user.id,
                      request: current,
                      business_name: businessName
                    },
                    created_at: new Date().toISOString()
                  }
                  this.addNewNotification(note)
                }
              }
            } catch (err) {
              console.error('Error handling user realtime staff update', err)
            }
          })
        }

        this.isConnected = true
        return true
      } catch (error) {
        console.error('Error inicializando realtime staff listeners:', error)
        this.isConnected = false
        return false
      }
    },

    async disconnectRealTimeNotifications() {
      // Desconectar listeners de staff en Realtime Database
      try {
        const authStore = useAuthStore()
        const user = authStore.user
        if (user) {
          const { stopStaffRealtimeForAdmin, stopStaffRealtimeForUser } = await import('@/services/staffRealtime')
          
          // Try to get business_id from multiple sources for admin users
          let businessId = user.business_id
          if (!businessId && (user.role === 'admin' || user.selectedRole === 'admin')) {
            try {
              const { useAdminStore } = await import('@/stores/admin')
              const adminStore = useAdminStore()
              businessId = adminStore.businessData?.id
            } catch (adminStoreError) {
              console.warn('Could not load admin store for disconnecting:', adminStoreError)
            }
          }
          
          if (businessId) stopStaffRealtimeForAdmin(businessId)
          if (user.id) stopStaffRealtimeForUser(user.id)
        }
      } catch (err) {
        console.warn('Error desconectando staff realtime listeners:', err)
      }

      this.isConnected = false
    },
    
    /**
     * Agregar nueva notificación (para Firestore y FCM)
     */
    addNewNotification(notification) {
      // Verificar si ya existe para evitar duplicados
      const existsInUnread = this.unreadNotifications.find(n => n.id === notification.id)
      const existsInWaiterUnread = this.waiterUnreadNotifications.find(n => n.id === notification.id)
      
      if (existsInUnread || existsInWaiterUnread) {
        //console.log('🔍 Notificación ya existe, actualizando...', notification.id)
        this.updateExistingNotification(notification)
        return
      }

      // Determinar el tipo de notificación y agregarla a la lista correspondiente
      if (notification.type === 'waiter_call' || notification.type === 'table_call') {
        this.waiterUnreadNotifications.unshift(notification)
        this.waiterUnreadCount++
        //console.log('🍽️ Nueva notificación de mozo agregada:', notification.title || notification.body)
      } else {
        this.unreadNotifications.unshift(notification)
        this.unreadCount++
        //console.log('🔔 Nueva notificación general agregada:', notification.title || notification.body)
      }
      
      // Check for special notification types that require custom events
      const unlinkKey = notification.data?.key || notification.data?.notification_key || notification.notification_key
      if (unlinkKey && unlinkKey.startsWith('waiter_unlinked_')) {
        console.log('🚫 Waiter unlinked notification detected:', notification)
        // Dispatch event for waiter dashboard to show banner and reload data
        const businessId = unlinkKey.replace('waiter_unlinked_', '')
        window.dispatchEvent(new CustomEvent('waiterUnlinked', {
          detail: { notification, businessId }
        }))
      }
      
      // Play sound for new notification
      this.playNotificationSound(notification.type || 'default')
      
      // Show enhanced browser notification
      this.showEnhancedBrowserNotification(notification)
      
      // Toast disabled - using badges and sound instead
      // const message = notification.title || notification.body || notification.message || 'Tienes una nueva notificación'
      // showSuccessToast(`Nueva notificación: ${message}`)
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

      //console.log('⚠️ No se encontró la notificación para actualizar:', notification.id)
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
      
      //console.log('🗑️ Notificación eliminada:', notificationId)
    },

    /**
     * Play notification sound
     */
    playNotificationSound(type = 'default') {
      if (!this.soundEnabled || !this.globalNotificationsEnabled) return
      
      // Throttle sounds to prevent spam (2 seconds minimum between sounds)
      const now = Date.now()
      if (now - this.lastNotificationSound < 2000) return
      this.lastNotificationSound = now

      try {
        // Create Web Audio API sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different sounds for different types
        let frequency1 = 800
        let frequency2 = 600
        let duration = 0.4
        let volume = 0.5
        
        switch (type) {
          case 'staff_request':
          case 'staff_join_success':
            frequency1 = 1200
            frequency2 = 900
            duration = 0.6
            volume = 0.7
            break
          case 'waiter_call':
          case 'table_call':
          case 'call_waiter':
            frequency1 = 1000
            frequency2 = 800
            duration = 0.5
            volume = 0.8
            break
          case 'system':
          case 'info':
            frequency1 = 700
            frequency2 = 500
            duration = 0.3
            volume = 0.4
            break
          case 'warning':
            frequency1 = 600
            frequency2 = 400
            duration = 0.7
            volume = 0.6
            break
        }
        
        oscillator.frequency.setValueAtTime(frequency1, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(frequency2, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
        
      } catch (error) {
        // Fallback to simple beep
        console.warn('Web Audio API failed, using fallback sound:', error)
        try {
          const audio = new Audio()
          audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+nfvnUjBjd+zO/eizEIDGKw5+mqWRMJRZzp4b5+JgU2jdXzzX4tBSF1xe/ejzQIElyx6OyrYRYJSKXi67RiHAY8k9nyyXkpBSR+zO/ijDEIDWOz6OyrXRQIR6Hn4L55KAU5jNTx0IAvBh1qtOnnqlkSCUig5OqyYhsGPJHY8sp7KgUle8vt3o4yBxFYr+ftrWIaBjeL0/LNfjAGIn3M7+CNMA=="
          audio.volume = 0.5
          audio.play().catch(() => {})
        } catch (fallbackError) {
          console.warn('Could not play notification sound:', fallbackError)
        }
      }
    },

    /**
     * Show enhanced browser notification
     */
    showEnhancedBrowserNotification(notification) {
      try {
        if (typeof Notification === 'undefined') return
        if (Notification.permission !== 'granted') return

        const browserNotification = new Notification(
          notification.data?.title || notification.title || 'Notificación', 
          {
            body: notification.data?.message || notification.message || '',
            icon: '/favicon.ico',
            tag: `notification-${notification.id}`,
            requireInteraction: true,
            badge: '/favicon.ico'
          }
        )

        browserNotification.onclick = () => {
          window.focus()
          browserNotification.close()
          
          // Navigate to route if specified
          if (notification.data?.route) {
            window.dispatchEvent(new CustomEvent('notificationClick', {
              detail: { route: notification.data.route }
            }))
          }
        }

        // Auto-close after 8 seconds for non-critical notifications
        if (!['staff_request', 'waiter_call'].includes(notification.type)) {
          setTimeout(() => {
            browserNotification.close()
          }, 8000)
        }
      } catch (error) {
        console.warn('Could not show browser notification:', error)
      }
    },

    /**
     * Toggle sound on/off
     */
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      const message = this.soundEnabled ? '🔊 Sonido de notificaciones activado' : '🔇 Sonido de notificaciones desactivado'
      showSuccessToast(message)
      
      // Save to localStorage
      localStorage.setItem('notifications_sound_enabled', this.soundEnabled ? '1' : '0')
    },

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
      try {
        if (typeof Notification === 'undefined') {
          console.warn('Browser does not support notifications')
          showErrorToast('Tu navegador no soporta notificaciones')
          return false
        }

        if (Notification.permission === 'granted') {
          return true
        }

        if (Notification.permission === 'denied') {
          showErrorToast('Las notificaciones están bloqueadas. Actívalas en la configuración del navegador.')
          return false
        }

        const permission = await Notification.requestPermission()
        
        if (permission === 'granted') {
          showSuccessToast('✅ Notificaciones del navegador activadas')
          return true
        } else {
          showErrorToast('❌ Notificaciones del navegador denegadas')
          return false
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
        showErrorToast('Error al solicitar permisos de notificación')
        return false
      }
    },

    /**
     * Initialize notification settings from localStorage
     */
    initializeSettings() {
      // Load sound setting
      const soundSetting = localStorage.getItem('notifications_sound_enabled')
      if (soundSetting !== null) {
        this.soundEnabled = soundSetting === '1'
      }
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
      this.soundEnabled = true
      this.tableNotificationsEnabled = {}
      this.lastNotificationSound = 0
    }
  }
}) 