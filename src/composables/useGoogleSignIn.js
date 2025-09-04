import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useGoogleSignIn() {
  const loading = ref(false)
  const error = ref('')
  const isReady = ref(false)
  
  const authStore = useAuthStore()
  const router = useRouter()

  // Configuración de Google Client ID (debes configurar esto en tu proyecto)
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.googleusercontent.com'

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-identity-script')) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.id = 'google-identity-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log('✅ Google Identity Services cargado')
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error('Error al cargar Google Identity Services'))
      }
      
      document.head.appendChild(script)
    })
  }

  const initializeGoogle = async () => {
    try {
      await loadGoogleScript()
      
      // Esperar a que google esté disponible
      let attempts = 0
      while (typeof google === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (typeof google === 'undefined') {
        throw new Error('Google Identity Services no se pudo cargar')
      }

      console.log('✅ Google Identity Services inicializado')
      isReady.value = true
      
    } catch (err) {
      console.error('❌ Error inicializando Google:', err)
      error.value = 'No se pudo inicializar Google Sign-In'
    }
  }

  const signInWithGoogle = async (mode = 'login') => {
    if (!isReady.value) {
      throw new Error('Google Sign-In no está listo')
    }

    loading.value = true
    error.value = ''

    try {
      const result = await new Promise((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              console.log('✅ Token de Google recibido')
              
              const loginData = {
                google_token: response.credential,
                fcm_token: localStorage.getItem('fcm_token') || undefined,
                platform: 'web'
              }

              // Verificar código de invitación
              const urlParams = new URLSearchParams(window.location.search)
              const invitationCode = urlParams.get('invitation_code') || urlParams.get('code')
              if (invitationCode) {
                loginData.business_invitation_code = invitationCode
                console.log('🏢 Código de invitación detectado:', invitationCode)
              }

              console.log('🚀 Enviando datos al servidor...')
              const authResult = await authStore.loginWithGoogle(loginData)
              
              if (authResult.staff_request_created) {
                console.log(`✅ Solicitud de staff creada para: ${authResult.business_name}`)
              }

              resolve(authResult)
              
            } catch (error) {
              console.error('❌ Error procesando token de Google:', error)
              reject(error)
            }
          },
          cancel_on_tap_outside: false
        })

        // Mostrar el popup de Google con One Tap
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Si One Tap no se puede mostrar, crear botón manual
            console.log('ℹ️ One Tap no disponible, usando botón manual')
            
            // Crear contenedor temporal para el botón
            const buttonContainer = document.createElement('div')
            buttonContainer.style.position = 'absolute'
            buttonContainer.style.top = '-1000px'
            buttonContainer.style.left = '-1000px'
            document.body.appendChild(buttonContainer)

            google.accounts.id.renderButton(buttonContainer, {
              theme: 'outline',
              size: 'large',
              text: mode === 'register' ? 'signup_with' : 'signin_with',
              shape: 'rectangular',
              click_listener: () => {
                // El callback se ejecutará automáticamente
              }
            })

            // Simular click en el botón
            setTimeout(() => {
              const button = buttonContainer.querySelector('[role="button"]')
              if (button) {
                button.click()
              } else {
                reject(new Error('No se pudo crear el botón de Google'))
              }
            }, 100)
            
            // Limpiar después de un tiempo
            setTimeout(() => {
              if (buttonContainer.parentNode) {
                buttonContainer.parentNode.removeChild(buttonContainer)
              }
            }, 5000)
          }
        })

        // Timeout de seguridad
        setTimeout(() => {
          reject(new Error('Tiempo de espera agotado para Google Sign-In'))
        }, 30000)
      })

      // Redirigir después del éxito
      const redirectUrl = localStorage.getItem('redirectAfterLogin')
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin')
        router.push(redirectUrl)
      } else {
        router.push({ name: 'role-selection' })
      }

      return result

    } catch (err) {
      console.error('❌ Error en Google Sign-In:', err)
      error.value = err.message || 'Error al iniciar sesión con Google'
      throw err
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    initializeGoogle()
  })

  return {
    loading,
    error,
    isReady,
    signInWithGoogle,
    initializeGoogle
  }
}