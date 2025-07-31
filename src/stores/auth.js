import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  console.log('AuthStore - Inicialización - Token cargado de localStorage:', token.value)
  const isAuthenticated = ref(!!token.value)
  const isLoading = ref(false)
  const error = ref(null)
  const selectedRole = ref(null)

  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser)
      console.log('AuthStore - Usuario cargado de localStorage:', userObj)
      if (userObj.selectedRole) {
        selectedRole.value = userObj.selectedRole
        userObj.role = userObj.selectedRole
        console.log('AuthStore - Rol seleccionado del usuario:', userObj.role)
      }
      user.value = userObj
    } catch (err) {
      console.error('AuthStore - Error al parsear usuario de localStorage:', err)
    }
  }

  const currentRole = computed(() => {
    return selectedRole.value || user.value?.role || null
  })

  const login = async (credentials) => {
    console.log('AuthStore - Iniciando login')
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.login(credentials)
      const responseData = resp.data || {}
      console.log('AuthStore - Respuesta login:', responseData)

      const receivedToken = responseData.token || responseData.access_token || responseData.plainTextToken
      console.log('AuthStore - Token recibido:', receivedToken ? 'Sí (valor no mostrado)' : 'No')

      user.value = responseData.user
      token.value = receivedToken
      isAuthenticated.value = true
      selectedRole.value = responseData.user?.selectedRole || null

      if (token.value) {
        console.log('AuthStore - Guardando token en localStorage')
        localStorage.setItem('token', token.value)
        console.log('AuthStore - Token después de guardar:', localStorage.getItem('token') ? 'Existe' : 'No existe')
      }
      localStorage.setItem('user', JSON.stringify(responseData.user))
      
      return responseData.user
    } catch (err) {
      console.error('AuthStore - Error en login:', err)
      error.value = err.message || 'Error al iniciar sesión'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const register = async (userData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.register(userData)
      const data = resp.data || {}

      user.value = data.user
      token.value = data.token
      isAuthenticated.value = true
      selectedRole.value = null
      
      if (token.value) {
        localStorage.setItem('token', token.value)
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return data.user
    } catch (err) {
      error.value = err.message || 'Error al registrarse'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const setSelectedRole = (role) => {
    console.log('AuthStore - setSelectedRole:', role)
    console.log('AuthStore - Estado previo:', { 
      selectedRole: selectedRole.value, 
      tokenInState: !!token.value,
      tokenInStorage: !!localStorage.getItem('token')
    })
    
    selectedRole.value = role
    
    if (user.value) {
      user.value = { ...user.value, role }
    }
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser)
        userObj.selectedRole = role
        userObj.role = role
        localStorage.setItem('user', JSON.stringify(userObj))
        console.log('AuthStore - Usuario actualizado en localStorage con rol:', role)
      } catch (err) {
        console.error('AuthStore - Error actualizando usuario en localStorage:', err)
      }
    }
    
    console.log('AuthStore - Estado después de setSelectedRole:', { 
      selectedRole: selectedRole.value, 
      tokenInState: !!token.value,
      tokenInStorage: !!localStorage.getItem('token')
    })
  }

  const getSelectedRole = () => {
    return selectedRole.value
  }

  const fetchUser = async () => {
    console.log('AuthStore - fetchUser iniciado')
    if (user.value) {
      console.log('AuthStore - Usuario ya existe en el estado:', user.value)
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
        console.log('AuthStore - Usuario cargado de localStorage en fetchUser:', user.value)
      } catch (err) {
        console.error('AuthStore - Error al parsear usuario en fetchUser:', err)
      }
    } else if (isAuthenticated.value) {
      console.log('AuthStore - Autenticado pero sin usuario en localStorage. Cerrando sesión.')
      logout();
    }
  }
  
  const updateProfile = async (formData) => {
    try {
      console.log("Actualizando perfil con:", Object.fromEntries(formData.entries()));
      
      const updatedData = Object.fromEntries(formData.entries());
      user.value = { ...user.value, ...updatedData };
      localStorage.setItem('user', JSON.stringify(user.value));

      return { data: { user: user.value } };
    } catch (error) {
      console.error('Error actualizando el perfil:', error);
      throw error;
    }
  }

  const logout = () => {
    console.log('AuthStore - Cerrando sesión')
    user.value = null
    token.value = null
    isAuthenticated.value = false
    selectedRole.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    console.log('AuthStore - Sesión cerrada, token eliminado de localStorage')
    return true
  }
  
  const forgotPassword = async (email) => {
    isLoading.value = true
    error.value = null
    
    try {
      return true
    } catch (err) {
      error.value = err.message || 'Error al enviar email de recuperación'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const resetPassword = async (token, newPassword) => {
    isLoading.value = true
    error.value = null
    
    try {
      return true
    } catch (err) {
      error.value = err.message || 'Error al restablecer contraseña'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    selectedRole,
    currentRole,
    
      login,
    register,
    logout,
    fetchUser,
    updateProfile,
    forgotPassword,
    resetPassword,
    setSelectedRole,
    getSelectedRole
  }
}) 