import { ref, onMounted } from 'vue'

export function useGoogleAuth() {
  const isGoogleLoaded = ref(false)
  const isInitializing = ref(false)
  
  // Tu Google Client ID - CAMBIAR POR EL REAL
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'
  
  // Función para extraer email del JWT token de Google (sin verificar)
  const extractEmailFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email
    } catch (error) {
      console.error('Error extracting email from token:', error)
      return null
    }
  }
  
  const initializeGoogle = () => {
    return new Promise((resolve, reject) => {
      if (isGoogleLoaded.value) {
        resolve()
        return
      }
      
      if (isInitializing.value) {
        // Si ya se está inicializando, esperar a que termine
        const checkInitialized = setInterval(() => {
          if (isGoogleLoaded.value || !isInitializing.value) {
            clearInterval(checkInitialized)
            isGoogleLoaded.value ? resolve() : reject(new Error('Google failed to initialize'))
          }
        }, 100)
        return
      }
      
      isInitializing.value = true
      
      // Verificar que Google Identity Services esté disponible
      if (typeof window.google === 'undefined') {
        console.warn('Google Identity Services not loaded. Please add the script to your HTML.')
        isInitializing.value = false
        reject(new Error('Google Identity Services not available'))
        return
      }
      
      try {
        // Inicializar Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: () => {}, // Callback vacío, manejaremos esto manualmente
          auto_select: false,
          cancel_on_tap_outside: true
        })
        
        isGoogleLoaded.value = true
        isInitializing.value = false
        console.log('✅ Google Identity Services initialized')
        resolve()
      } catch (error) {
        console.error('❌ Error initializing Google Identity Services:', error)
        isInitializing.value = false
        reject(error)
      }
    })
  }
  
  const signInWithGoogle = () => {
    return new Promise(async (resolve, reject) => {
      try {
        await initializeGoogle()
        
        // Usar el método prompt para mostrar el popup de Google
        window.google.accounts.id.prompt((notification) => {
          console.log('Google prompt notification:', notification)
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google prompt not displayed or skipped')
            // Fallback al modal personalizado
            showGoogleModal(resolve, reject)
          }
        })
        
        // También configurar el callback global por si acaso
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              resolve(response.credential) // Este es el id_token
            } else {
              reject(new Error('No credential received from Google'))
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        })
        
      } catch (error) {
        console.error('Error in Google sign-in:', error)
        reject(error)
      }
    })
  }
  
  const showGoogleModal = (resolve, reject) => {
    // Crear overlay modal
    const overlay = document.createElement('div')
    overlay.className = 'google-auth-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `
    
    // Crear modal
    const modal = document.createElement('div')
    modal.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
      position: relative;
    `
    
    // Título
    const title = document.createElement('h3')
    title.textContent = 'Iniciar sesión con Google'
    title.style.cssText = `
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    `
    
    // Descripción
    const description = document.createElement('p')
    description.textContent = 'Serás redirigido a Google para completar la autenticación.'
    description.style.cssText = `
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    `
    
    // Contenedor del botón
    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'google-button-container'
    buttonContainer.style.marginBottom = '1rem'
    
    // Botón cancelar
    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancelar'
    cancelButton.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #6c757d;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    `
    
    const cleanup = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay)
      }
    }
    
    cancelButton.onclick = () => {
      cleanup()
      reject(new Error('Google sign-in cancelled by user'))
    }
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup()
        reject(new Error('Google sign-in cancelled by user'))
      }
    }
    
    // Construir modal
    modal.appendChild(title)
    modal.appendChild(description)
    modal.appendChild(buttonContainer)
    modal.appendChild(cancelButton)
    overlay.appendChild(modal)
    document.body.appendChild(overlay)
    
    // Renderizar el botón nativo de Google
    window.google.accounts.id.renderButton(buttonContainer, {
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      width: 300,
      locale: 'es'
    })
    
    // Configurar callback para cuando se complete el sign-in
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        cleanup()
        if (response.credential) {
          resolve(response.credential)
        } else {
          reject(new Error('No credential received from Google'))
        }
      }
    })
  }
  
  // Inicializar cuando se monta el componente
  onMounted(() => {
    // Dar tiempo a que se cargue el script de Google
    setTimeout(() => {
      initializeGoogle().catch(console.error)
    }, 100)
  })
  
  const signInWithGoogleAndCheckUser = async (isRegistering = false) => {
    const token = await signInWithGoogle()
    const email = extractEmailFromToken(token)
    
    return {
      token,
      email,
      isRegistering
    }
  }
  
  return {
    isGoogleLoaded,
    isInitializing,
    initializeGoogle,
    signInWithGoogle,
    signInWithGoogleAndCheckUser,
    extractEmailFromToken
  }
}