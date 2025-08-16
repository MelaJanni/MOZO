import { defineStore } from 'pinia'
import { ref, computed, unref } from 'vue'
import apiService from '../services/api'
import { loginWithFCM, logoutAndUnregister } from '@/utils/notificationClient'

// Función utilitaria para obtener valores seguros de refs
const safeValue = (value) => {
  try {
    return typeof value === 'object' && value !== null && 'value' in value ? unref(value) : value
  } catch (error) {
    console.warn('Error accessing reactive value:', error)
    return null
  }
}

// Función utilitaria para manejar tokens de forma segura
const safeTokenValue = (tokenRef) => {
  try {
    const value = safeValue(tokenRef)
    return value ? String(value) : ''
  } catch (error) {
    console.warn('Error converting token to string:', error)
    return ''
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  // Indica que el store ya intentó restaurar el usuario/token (tryToLogin completado)
  const initialized = ref(false)
  console.log('AuthStore - Inicialización - Token cargado de localStorage:', safeTokenValue(token) ? 'Sí (presente)' : 'No')
  const isAuthenticated = ref(!!safeTokenValue(token))
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
  const resp = await loginWithFCM(credentials)
      const responseData = resp.data || {}
      console.log('AuthStore - Respuesta login:', responseData)

      const receivedToken = responseData.token || responseData.access_token || responseData.plainTextToken
      console.log('AuthStore - Token recibido:', receivedToken ? 'Sí (valor no mostrado)' : 'No')

      user.value = responseData.user
      token.value = receivedToken || null
      isAuthenticated.value = true
      selectedRole.value = responseData.user?.selectedRole || null

      const tokenValue = safeTokenValue(token)
      if (tokenValue) {
        console.log('AuthStore - Guardando token en localStorage')
        localStorage.setItem('token', tokenValue)
        console.log('AuthStore - Token después de guardar:', localStorage.getItem('token') ? 'Existe' : 'No existe')
      }
      localStorage.setItem('user', JSON.stringify(responseData.user))
  // Marca que la inicialización/post-login está completa
  initialized.value = true
      
      // Inicializar notificaciones después del login
      try {
        console.log('AuthStore - Inicializando sistema de notificaciones después del login...')

        const { initializePushNotifications } = await import('@/services/pushNotifications')
        const platform = (await import('@capacitor/core')).Capacitor.getPlatform()

        // Always try to initialize push notifications. On web this will initialize
        // Firebase and obtain/send token. On mobile it will attach listeners and
        // register native push, ensuring the 'registration' listener sends the token
        // to the backend even if the app is backgrounded.
        const pushInit = await initializePushNotifications()
        console.log('AuthStore - initializePushNotifications result:', pushInit)

        // Additionally initialize realtime listeners for notifications store
        const { useNotificationsStore } = await import('@/stores/notifications')
        const notificationsStore = useNotificationsStore()
        notificationsStore.initializeRealTimeNotifications()
        console.log('AuthStore - Listeners de Firestore inicializados')
      } catch (notificationError) {
        console.warn('AuthStore - Error inicializando notificaciones:', notificationError)
      }
      
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
      token.value = data.token || null
      isAuthenticated.value = true
      selectedRole.value = null
      
      const tokenValue = safeTokenValue(token)
      if (tokenValue) {
        localStorage.setItem('token', tokenValue)
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
      selectedRole: safeValue(selectedRole), 
      tokenInState: !!safeTokenValue(token),
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
    // Sincronizar token desde localStorage (caso donde selectRole() devuelve nuevo token
    // y axios interceptor guardó el token en localStorage pero no en el store)
    try {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        token.value = storedToken
        isAuthenticated.value = true
        console.log('AuthStore - Token sincronizado desde localStorage tras setSelectedRole')
      }
    } catch (err) {
      console.warn('AuthStore - Error sincronizando token desde localStorage:', err)
    }

    console.log('AuthStore - Estado después de setSelectedRole:', { 
      selectedRole: safeValue(selectedRole), 
      tokenInState: !!safeTokenValue(token),
      tokenInStorage: !!localStorage.getItem('token')
    })
  }

  const getSelectedRole = () => {
    return safeValue(selectedRole)
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

  const logout = async () => {
    console.log('AuthStore - Cerrando sesión')
    
    // Llamar al helper que intenta borrar el device token y hacer logout en backend
    try {
      await logoutAndUnregister()
      console.log('AuthStore - logoutAndUnregister ejecutado')
    } catch (error) {
      console.warn('AuthStore - Error en logoutAndUnregister:', error)
      // Continuar con logout local aunque falle
    }
    
    user.value = null
    token.value = null
    isAuthenticated.value = false
    selectedRole.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    localStorage.removeItem('fcm_token')
    
    // Limpiar token FCM
    try {
      const { deleteFCMToken } = await import('@/services/firebase')
      await deleteFCMToken()
      console.log('AuthStore - Token FCM eliminado')
    } catch (error) {
      console.warn('Error eliminando token FCM:', error)
    }

    // Desconectar listeners de Firestore
    try {
      const { useNotificationsStore } = await import('@/stores/notifications')
      const notificationsStore = useNotificationsStore()
      notificationsStore.disconnectRealTimeNotifications()
    } catch (error) {
      console.warn('Error desconectando Firestore listeners:', error)
    }
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

  // Función para intentar login automático con token existente
  const tryToLogin = async () => {
    console.log('AuthStore - tryToLogin iniciado');

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken) {
      console.log('AuthStore - No hay token almacenado');
      return false;
    }

    try {
      token.value = storedToken;

      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        user.value = userObj;
        selectedRole.value = userObj.selectedRole || userObj.role;
        console.log('AuthStore - Usuario restaurado desde localStorage:', userObj);
      }

      // Validar el token con el servidor
      const isValidToken = await apiService.getCurrentUser();
      if (!isValidToken) {
        console.warn('AuthStore - Token inválido, cerrando sesión.');
        logout();
        return false;
      }

      isAuthenticated.value = true;
      console.log('AuthStore - Autenticación exitosa con token existente.');
  initialized.value = true
      return true;
    } catch (err) {
      console.error('AuthStore - Error en tryToLogin:', err);
  await logout();
  initialized.value = true
      return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
  initialized,
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
    getSelectedRole,
    tryToLogin
  }
})