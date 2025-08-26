// Servicio: OAuth de Google en ventana in-app (Capacitor Browser) con PKCE
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

// Utilidades PKCE
async function sha256(base) {
  const encoder = new TextEncoder()
  const data = encoder.encode(base)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))
  // Base64 URL-safe
  return hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array).map(x => charset[x % charset.length]).join('')
}

function parseQuery(url) {
  try {
    const u = new URL(url)
    const params = Object.fromEntries(u.searchParams.entries())
    // Algunos proveedores envían el code en el fragmento
    if (u.hash && u.hash.startsWith('#')) {
      const frag = new URLSearchParams(u.hash.substring(1))
      for (const [k, v] of frag.entries()) params[k] = v
    }
    return { params, url: u }
  } catch (e) {
    return { params: {}, url: null }
  }
}

function jwtDecode(idToken) {
  try {
    const [_h, p] = idToken.split('.')
    return JSON.parse(atob(p))
  } catch (_) { return {} }
}

// Obtiene el clientId Android y su esquema de retorno recomendado por Google
function getAndroidClientIds() {
  const androidClientId = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID
  if (!androidClientId) throw new Error('VITE_GOOGLE_ANDROID_CLIENT_ID no configurado')
  const idNoSuffix = androidClientId.replace('.apps.googleusercontent.com', '')
  const redirectScheme = `com.googleusercontent.apps.${idNoSuffix}`
  const redirectUri = `${redirectScheme}:/oauth2redirect`
  return { androidClientId, redirectUri, redirectScheme }
}

export async function googleInAppLogin() {
  if (!Capacitor.isNativePlatform()) throw new Error('googleInAppLogin solo para plataformas nativas')

  const { androidClientId, redirectUri } = getAndroidClientIds()

  // PKCE
  const codeVerifier = randomString(64)
  const codeChallenge = await sha256(codeVerifier)
  const state = randomString(32)

  const scope = encodeURIComponent('openid email profile')
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(androidClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}&prompt=select_account`

  let urlListener
  try {
    const waitForCallback = new Promise((resolve, reject) => {
      urlListener = App.addListener('appUrlOpen', async (data) => {
        try {
          const { params } = parseQuery(data.url)
          if (params.state && params.state !== state) return // ignorar estados que no coinciden
          if (params.code || params.error) {
            await Browser.close()
            resolve(params)
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    await Browser.open({ url: authUrl, presentationStyle: 'popover' })

    const { code, error, error_description } = await waitForCallback
    if (error) throw new Error(error_description || error)
    if (!code) throw new Error('No se recibió código de autorización')

    // Intercambio del code por tokens con PKCE (sin client_secret)
    const body = new URLSearchParams({
      code,
      client_id: androidClientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    })

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
    if (!resp.ok) throw new Error(`Fallo al canjear code: ${resp.status}`)
    const tokenSet = await resp.json()

    const id_token = tokenSet.id_token
    const access_token = tokenSet.access_token
    if (!id_token) throw new Error('No se recibió id_token')

    const payload = jwtDecode(id_token)
    return {
      id_token,
      access_token,
      email: payload.email,
      name: payload.name,
      imageUrl: payload.picture,
      sub: payload.sub
    }
  } finally {
    if (urlListener && typeof urlListener.remove === 'function') {
      urlListener.remove()
    }
  }
}
