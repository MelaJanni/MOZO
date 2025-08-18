import apiService from './api'
import { useNotificationsStore } from '../stores/notifications'

export default {
  setToken(token) {
    // console.log('Guardando token en localStorage:', token)
    if (token) {
      localStorage.setItem('token', token)
      // console.log('Token después de guardar:', localStorage.getItem('token'))
    } else {
      console.error('Intento de guardar un token inválido:', token)
    }
  },
  
  getToken() {
    const token = localStorage.getItem('token')
    // console.log('Obteniendo token de localStorage:', token)
    return token
  },
  
  removeToken() {
    // console.log('Eliminando token de localStorage')
    localStorage.removeItem('token')
  },
  
  setUser(user) {
    // console.log('Guardando usuario en localStorage:', user)
    localStorage.setItem('user', JSON.stringify(user))
  },
  
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
  
  removeUser() {
    localStorage.removeItem('user')
  },
  
  isAuthenticated() {
    const isAuth = !!this.getToken()
    // console.log('¿Está autenticado?', isAuth)
    return isAuth
  },
  
  async login(email, password) {
    try {
      // console.log('Iniciando login con:', { email })
      const response = await apiService.login({ email, password })
      // console.log('Respuesta login COMPLETA:', JSON.stringify(response))
      
      const token = response.data.token || 
                   response.data.access_token || 
                   response.data.plainTextToken || 
                   (response.data.user && response.data.user.token) || 
                   (response.data.user && response.data.user.access_token) ||
                   response.headers?.authorization?.replace('Bearer ', '');
      
      // console.log('Token encontrado:', token ? 'Sí (valor no mostrado)' : 'No')
      
      if (!token) {
        console.error('No se encontró un token válido en la respuesta:', response.data);
        throw new Error('No se recibió un token válido del servidor');
      }
      
      this.setToken(token)
      this.setUser(response.data.user)
      return response.data
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },
  
  async loginWithGoogle(token) {
    try {
      const response = await apiService.loginWithGoogle(token)
      // console.log('Respuesta loginWithGoogle COMPLETA:', JSON.stringify(response))
      
      const authToken = response.data.token || 
                        response.data.access_token || 
                        response.data.plainTextToken || 
                        (response.data.user && response.data.user.token) ||
                        (response.data.user && response.data.user.access_token);
      
      if (!authToken) {
        throw new Error('No se recibió un token válido del servidor');
      }
      
      this.setToken(authToken)
      this.setUser(response.data.user)
      return response.data
    } catch (error) {
      console.error('Error en loginWithGoogle:', error)
      throw error
    }
  },
  
  async register(name, email, password, passwordConfirmation) {
    try {
      const response = await apiService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async forgotPassword(email) {
    try {
      const response = await apiService.forgotPassword({ email })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async resetPassword(token, email, password, passwordConfirmation) {
    try {
      const response = await apiService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async logout() {
    try {
      const fcmToken = localStorage.getItem('fcm_token')
      if (this.isAuthenticated() && fcmToken) {
        await apiService.deleteDeviceToken({ token: fcmToken })
      }
      if (this.isAuthenticated()) {
        await apiService.logout()
      }
    } catch (error) {
      console.error('Error durante el logout en el servidor:', error)
    } finally {
      const notificationsStore = useNotificationsStore()
      notificationsStore.disconnectRealTimeNotifications()
      
      this.removeToken()
      this.removeUser()
      localStorage.removeItem('fcm_token')
    }
  },
  
  async getCurrentUser() {
    try {
      const response = await apiService.getCurrentUser()
      this.setUser(response.data)
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async selectRole(role) {
    try {
      // console.log('Seleccionando rol:', role)
      // console.log('Token antes de seleccionar rol:', this.getToken())
      const response = await apiService.selectRole(role)
      // console.log('Respuesta selectRole COMPLETA:', JSON.stringify(response))
      const data = response.data || {}
      
      const newToken = data.token || 
                      data.access_token || 
                      data.plainTextToken || 
                      (data.user && data.user.token) ||
                      (data.user && data.user.access_token);
      
      // console.log('Nuevo token recibido:', newToken ? 'Sí (valor no mostrado)' : 'No')
      
      if (newToken) {
        this.setToken(newToken)
      } else {
        // console.warn('No se recibió un nuevo token al seleccionar el rol')
      }

      const user = this.getUser()
      if (user) {
        user.role = role
        this.setUser(user)
      }
      
      // console.log('Token después de seleccionar rol:', this.getToken())
      return data
    } catch (error) {
      console.error('Error en selectRole:', error)
      throw error
    }
  }
} 