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
  // console.log('AuthStore - Inicialización - Token cargado de localStorage:', safeTokenValue(token) ? 'Sí (presente)' : 'No')
  const isAuthenticated = ref(!!safeTokenValue(token))
  const isLoading = ref(false)
  const error = ref(null)
  const selectedRole = ref(null)
  
  // Cache para evitar peticiones duplicadas
  const cache = ref({
    userFetch: null,
    userFetchTimestamp: 0,
    cacheDuration: 2 * 60 * 1000, // 2 minutos
    pendingUserRequest: null // Promise pendiente
  })

  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser)
      // console.log('AuthStore - Usuario cargado de localStorage:', userObj)
      if (userObj.selectedRole) {
        selectedRole.value = userObj.selectedRole
        userObj.role = userObj.selectedRole
        // console.log('AuthStore - Rol seleccionado del usuario:', userObj.role)
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
    // console.log('AuthStore - Iniciando login')
    isLoading.value = true
    error.value = null
    
    try {
  const resp = await loginWithFCM(credentials)
      const responseData = resp.data || {}
      // console.log('AuthStore - Respuesta login:', responseData)

      const receivedToken = responseData.token || responseData.access_token || responseData.plainTextToken
      // console.log('AuthStore - Token recibido:', receivedToken ? 'Sí (valor no mostrado)' : 'No')

      user.value = responseData.user
      token.value = receivedToken || null
      isAuthenticated.value = true
      selectedRole.value = responseData.user?.selectedRole || null

      const tokenValue = safeTokenValue(token)
      if (tokenValue) {
        // console.log('AuthStore - Guardando token en localStorage')
        localStorage.setItem('token', tokenValue)
        // console.log('AuthStore - Token después de guardar:', localStorage.getItem('token') ? 'Existe' : 'No existe')
      }
      localStorage.setItem('user', JSON.stringify(responseData.user))
  // Marca que la inicialización/post-login está completa
  initialized.value = true
      
      // Inicializar notificaciones después del login
      try {
        // console.log('AuthStore - Inicializando sistema de notificaciones después del login...')

        const { initializePushNotifications } = await import('@/services/pushNotifications')
        const platform = (await import('@capacitor/core')).Capacitor.getPlatform()

        // Always try to initialize push notifications. On web this will initialize
        // Firebase and obtain/send token. On mobile it will attach listeners and
        // register native push, ensuring the 'registration' listener sends the token
        // to the backend even if the app is backgrounded.
        const pushInit = await initializePushNotifications()
        // console.log('AuthStore - initializePushNotifications result:', pushInit)

        // Additionally initialize realtime listeners for notifications store
        const { useNotificationsStore } = await import('@/stores/notifications')
        const notificationsStore = useNotificationsStore()
        notificationsStore.initializeRealTimeNotifications()
        // console.log('AuthStore - Listeners de Firestore inicializados')
      } catch (notificationError) {
        // console.warn('AuthStore - Error inicializando notificaciones:', notificationError)
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

      // Algunos backends devuelven token en el registro; si no, haremos login automático
      const receivedToken = data.token || data.access_token || data.plainTextToken
      if (receivedToken && data.user) {
        user.value = data.user
        token.value = receivedToken
        isAuthenticated.value = true
        selectedRole.value = data.user?.selectedRole || null

        const tokenValue = safeTokenValue(token)
        if (tokenValue) localStorage.setItem('token', tokenValue)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Inicializar notificaciones igual que en login
        try {
          const { initializePushNotifications } = await import('@/services/pushNotifications')
          await initializePushNotifications()
          const { useNotificationsStore } = await import('@/stores/notifications')
          const notificationsStore = useNotificationsStore()
          notificationsStore.initializeRealTimeNotifications()
        } catch (notificationError) { /* noop */ }

        initialized.value = true
        return data.user
      }

      // Si no hubo token en el registro, realizar login automático con email/contraseña
      if (userData?.email && userData?.password) {
        await login({ email: userData.email, password: userData.password })
        initialized.value = true
        return user.value
      }

      // Fallback: si no hay token ni credenciales, marcar autenticado en falso
      isAuthenticated.value = false
      throw new Error('Registro exitoso pero no se pudo iniciar sesión automáticamente')
    } catch (err) {
      error.value = err.message || 'Error al registrarse'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const setSelectedRole = (role) => {
    // console.log('AuthStore - setSelectedRole:', role)
    // console.log('AuthStore - Estado previo:', { 
    //   selectedRole: safeValue(selectedRole), 
    //   tokenInState: !!safeTokenValue(token),
    //   tokenInStorage: !!localStorage.getItem('token')
    // })
    
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
        // console.log('AuthStore - Usuario actualizado en localStorage con rol:', role)
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
        // console.log('AuthStore - Token sincronizado desde localStorage tras setSelectedRole')
      }
    } catch (err) {
      console.warn('AuthStore - Error sincronizando token desde localStorage:', err)
    }

    // console.log('AuthStore - Estado después de setSelectedRole:', { 
    //   selectedRole: safeValue(selectedRole), 
    //   tokenInState: !!safeTokenValue(token),
    //   tokenInStorage: !!localStorage.getItem('token')
    // })
  }

  const getSelectedRole = () => {
    return safeValue(selectedRole)
  }

  const fetchUser = async (force = false) => {
    // Si hay una petición pendiente, esperarla en lugar de crear una nueva
    if (cache.value.pendingUserRequest) {
      console.log('📦 fetchUser: Esperando petición pendiente...')
      return await cache.value.pendingUserRequest
    }
    
    // Si ya tenemos usuario y no forzamos la recarga, retornar sin hacer nada
    if (!force && user.value) {
      console.log('📦 fetchUser: Usuario ya existe en memoria')
      return user.value
    }
    
    // Verificar cache de tiempo
    const now = Date.now()
    if (!force && cache.value.userFetch && (now - cache.value.userFetchTimestamp < cache.value.cacheDuration)) {
      console.log('📦 fetchUser: Usando datos del cache')
      if (cache.value.userFetch) {
        user.value = cache.value.userFetch
        return user.value
      }
    }
    
    // Primero intentar cargar desde localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser && !force) {
      try {
        const userObj = JSON.parse(storedUser)
        user.value = userObj
        cache.value.userFetch = userObj
        cache.value.userFetchTimestamp = now
        console.log('📦 fetchUser: Usuario cargado desde localStorage')
        return user.value
      } catch (err) {
        console.error('Error parsing stored user:', err)
      }
    }
    
    // Si tenemos token pero no usuario, hacer petición al servidor
    if (isAuthenticated.value && safeTokenValue(token)) {
      console.log('📦 fetchUser: Obteniendo usuario del servidor...')
      
      // Crear promesa para evitar peticiones duplicadas
      cache.value.pendingUserRequest = (async () => {
        try {
          const userData = await apiService.getCurrentUser()
          if (userData) {
            user.value = userData
            cache.value.userFetch = userData
            cache.value.userFetchTimestamp = now
            
            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(userData))
            console.log('✅ fetchUser: Usuario obtenido y guardado')
            return userData
          } else {
            console.warn('fetchUser: Token inválido, cerrando sesión')
            await logout()
            return null
          }
        } catch (err) {
          console.error('Error fetching user:', err)
          if (err.response?.status === 401) {
            await logout()
          }
          throw err
        } finally {
          cache.value.pendingUserRequest = null
        }
      })()
      
      return await cache.value.pendingUserRequest
    } else {
      console.log('📦 fetchUser: No hay token de autenticación')
      return null
    }
  }
  
  const updateProfile = async (formData) => {
    try {
      // console.log("Actualizando perfil con:", Object.fromEntries(formData.entries()));
      
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
    // console.log('AuthStore - Cerrando sesión')
    
    // Limpiar cache
    cache.value.userFetch = null
    cache.value.userFetchTimestamp = 0
    cache.value.pendingUserRequest = null
    
    // Llamar al helper que intenta borrar el device token y hacer logout en backend
    try {
      await logoutAndUnregister()
      // console.log('AuthStore - logoutAndUnregister ejecutado')
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
      // console.log('AuthStore - Token FCM eliminado')
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
    // console.log('AuthStore - Sesión cerrada, token eliminado de localStorage')
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
    if (initialized.value) {
      console.log('📦 tryToLogin: Ya inicializado, retornando estado actual');
      return isAuthenticated.value;
    }
    
    // console.log('AuthStore - tryToLogin iniciado');

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken) {
      // console.log('AuthStore - No hay token almacenado');
      // Asegurar que el flujo de inicialización termine incluso sin token
      initialized.value = true
      return false;
    }

    try {
      token.value = storedToken;

      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        user.value = userObj;
        selectedRole.value = userObj.selectedRole || userObj.role;
        // Actualizar cache con datos del localStorage
        cache.value.userFetch = userObj;
        cache.value.userFetchTimestamp = Date.now();
        // console.log('AuthStore - Usuario restaurado desde localStorage:', userObj);
      }

      // Validar el token con el servidor usando fetchUser optimizado
      const userData = await fetchUser(false); // No forzar, usar cache si es posible
      if (!userData) {
        // console.warn('AuthStore - Token inválido, cerrando sesión.');
        await logout();
        return false;
      }

      isAuthenticated.value = true;
      // console.log('AuthStore - Autenticación exitosa con token existente.');
  initialized.value = true
      return true;
    } catch (err) {
      // console.error('AuthStore - Error en tryToLogin:', err);
  await logout();
  initialized.value = true
      return false;
    }
  };

  const loginWithGoogle = async (googleData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.loginWithGoogle(googleData)
      const responseData = resp.data || {}
      
      const receivedToken = responseData.token || responseData.access_token || responseData.plainTextToken
      user.value = responseData.user
      token.value = receivedToken || null
      isAuthenticated.value = true
      selectedRole.value = responseData.user?.selectedRole || null
      
      const tokenValue = safeTokenValue(token)
      if (tokenValue) {
        localStorage.setItem('token', tokenValue)
      }
      
      if (user.value) {
        // Completar datos de perfil con información de Google si falta
        try {
          const patchedUser = { ...user.value }
          const googleName = googleData?.name || googleData?.display_name
          const googleAvatar = googleData?.avatar || googleData?.imageUrl || googleData?.picture
          const googleEmail = googleData?.email

          // Preferir no sobreescribir si ya existen, salvo que estén vacíos
          if ((!patchedUser.display_name || patchedUser.display_name === '') && googleName) {
            patchedUser.display_name = googleName
          }
          if ((!patchedUser.name || patchedUser.name === '') && googleName) {
            patchedUser.name = googleName
          }
          if ((!patchedUser.avatar || patchedUser.avatar === '') && googleAvatar) {
            patchedUser.avatar = googleAvatar
          }
          if ((!patchedUser.email || patchedUser.email === '') && googleEmail) {
            patchedUser.email = googleEmail
          }
          user.value = patchedUser
        } catch (_) { /* noop */ }

        localStorage.setItem('user', JSON.stringify(user.value))
      }

      // Intento best-effort: si falta display_name y tenemos nombre de Google, actualizar perfil en backend
      try {
        const googleName = googleData?.name || googleData?.display_name
        if (googleName && (!user.value?.display_name || user.value.display_name === '')) {
          const formData = new FormData()
          formData.append('display_name', googleName)
          const upd = await apiService.updateProfile(formData)
          const updatedUser = upd?.data?.user || upd?.data?.data || null
          if (updatedUser) {
            user.value = { ...user.value, ...updatedUser }
            localStorage.setItem('user', JSON.stringify(user.value))
          }
        }
      } catch (e) {
        // Silencioso: si falla, no bloquear flujo
      }

      // Inicializar notificaciones y listeners en login vía Google (igual que login normal)
      try {
        const { initializePushNotifications } = await import('@/services/pushNotifications')
        await initializePushNotifications()

        const { useNotificationsStore } = await import('@/stores/notifications')
        const notificationsStore = useNotificationsStore()
        notificationsStore.initializeRealTimeNotifications()
      } catch (notificationError) {
        // console.warn('AuthStore - Error inicializando notificaciones (Google):', notificationError)
      }

      // Marcar flujo de inicialización completo tras login con Google
      initialized.value = true

  return responseData
    } catch (err) {
      error.value = err.response?.data?.message || 'Error en login con Google'
      token.value = null
      user.value = null
      isAuthenticated.value = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw err
    } finally {
      isLoading.value = false
    }
  }

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
    loginWithGoogle,
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