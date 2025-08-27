// Handler global para capturar tokens OAuth2 antes de que se pierdan por el routing

export function initOAuthHandler() {
  // Solo ejecutar en browser
  if (typeof window === 'undefined') return
  
  console.log('🔍 OAuth Handler: Checking for tokens on page load...')
  console.log('🔍 Current URL:', window.location.href)
  console.log('🔍 Hash:', window.location.hash)
  
  // Verificar si hay un token OAuth2 en el hash
  if (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token=')) {
    console.log('✅ OAuth2 token detected! Storing in sessionStorage...')
    
    // Extraer todos los parámetros del hash
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    
    const tokenData = {
      access_token: params.get('access_token'),
      id_token: params.get('id_token'),
      token_type: params.get('token_type'),
      expires_in: params.get('expires_in'),
      scope: params.get('scope'),
      state: params.get('state'),
      nonce: params.get('nonce'),
      timestamp: Date.now()
    }
    
    console.log('🔍 Storing token data:', {
      ...tokenData,
      access_token: tokenData.access_token ? '***' : null,
      id_token: tokenData.id_token ? '***' : null
    })
    
    // Guardar en sessionStorage para que persista durante la sesión
    sessionStorage.setItem('oauth_token_data', JSON.stringify(tokenData))
    
    // Limpiar la URL removiendo el hash
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
    
    console.log('✅ Token stored and URL cleaned')
  }
}

export function getStoredOAuthToken() {
  const stored = sessionStorage.getItem('oauth_token_data')
  if (stored) {
    try {
      const tokenData = JSON.parse(stored)
      console.log('🔍 Retrieved stored token data')
      return tokenData
    } catch (error) {
      console.error('❌ Error parsing stored token data:', error)
      sessionStorage.removeItem('oauth_token_data')
    }
  }
  return null
}

export function clearStoredOAuthToken() {
  sessionStorage.removeItem('oauth_token_data')
  console.log('🧹 Cleared stored OAuth token')
}