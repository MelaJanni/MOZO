import { getDatabase, ref, onValue, off } from 'firebase/database'
import { initializeFirebaseApp } from '@/services/firebase'

let app = null
let db = null

const ensureInit = async () => {
  if (db) return { app, db }
  try {
    const firebaseInstance = await initializeFirebaseApp()
    if (!firebaseInstance) {
      console.error('staffRealtime: Failed to initialize Firebase app')
      return null
    }
    
    app = firebaseInstance.app
    db = getDatabase(app)
    
    // Asegurar que Firebase Auth esté completamente inicializado
    if (firebaseInstance.auth) {
      const { onAuthStateChanged } = await import('firebase/auth')
      
      // Esperar a que el estado de autenticación se estabilice
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseInstance.auth, (user) => {
          console.log('🔥 staffRealtime: Auth state changed:', user ? 'authenticated' : 'not authenticated')
          unsubscribe()
          resolve()
        })
      })
    }
    
    console.log('🔥 staffRealtime: Firebase initialized successfully')
    return { app, db }
  } catch (err) {
    console.error('staffRealtime: Firebase init error', err)
    return null
  }
}

const listeners = new Map()

export async function startStaffRealtimeForAdmin(businessId, onChange) {
  if (!businessId) return
  const init = await ensureInit()
  if (!init) return

  const path = `businesses_staff/${businessId}`
  const nodeRef = ref(db, path)

  const callback = (snapshot) => {
    const val = snapshot.val()
    try {
      if (onChange && typeof onChange === 'function') onChange(val)
    } catch (err) {
      console.error('startStaffRealtimeForAdmin onChange error', err)
    }
  }

  const unsubscribe = onValue(nodeRef, callback, (err) => {
    console.error('startStaffRealtimeForAdmin listener error', err)
  })

  listeners.set(`admin:${businessId}`, { ref: nodeRef, unsubscribe })
  console.log('staffRealtime: admin listener started for', businessId)
}

export function stopStaffRealtimeForAdmin(businessId) {
  const key = `admin:${businessId}`
  const entry = listeners.get(key)
  if (!entry) return
  try {
    off(entry.ref)
  } catch (err) {
    console.warn('stopStaffRealtimeForAdmin off error', err)
  }
  listeners.delete(key)
  console.log('staffRealtime: admin listener stopped for', businessId)
}

export async function startStaffRealtimeForUser(userId, onChange) {
  if (!userId) {
    console.warn('staffRealtime: No userId provided')
    return
  }
  
  console.log('🔥 staffRealtime: Starting user listener for userId:', userId)
  const init = await ensureInit()
  if (!init) {
    console.error('staffRealtime: Failed to initialize Firebase')
    return
  }

  const path = `users_staff/${userId}`
  console.log('🔥 staffRealtime: Setting up listener for path:', path)
  
  // Verificar el estado de autenticación antes de crear el listener
  try {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth(app)
    const currentUser = auth.currentUser
    console.log('🔥 staffRealtime: Current user before listener setup:', currentUser ? currentUser.uid : 'null')
    
    if (!currentUser) {
      console.warn('🔥 staffRealtime: No authenticated user found, this may cause permission errors')
    }
  } catch (authCheckError) {
    console.error('🔥 staffRealtime: Error checking auth state:', authCheckError)
  }
  
  const nodeRef = ref(db, path)

  const callback = (snapshot) => {
    const val = snapshot.val()
    try {
      if (onChange && typeof onChange === 'function') onChange(val)
    } catch (err) {
      console.error('startStaffRealtimeForUser onChange error', err)
    }
  }

  const unsubscribe = onValue(nodeRef, callback, (err) => {
    console.error('🔥 startStaffRealtimeForUser listener error for path:', path, err)
    console.error('🔥 Error details:', {
      code: err?.code,
      message: err?.message,
      details: err?.details || err?.toString()
    })
  })

  listeners.set(`user:${userId}`, { ref: nodeRef, unsubscribe })
  console.log('staffRealtime: user listener started for', userId)
}

export function stopStaffRealtimeForUser(userId) {
  const key = `user:${userId}`
  const entry = listeners.get(key)
  if (!entry) return
  try {
    off(entry.ref)
  } catch (err) {
    console.warn('stopStaffRealtimeForUser off error', err)
  }
  listeners.delete(key)
  console.log('staffRealtime: user listener stopped for', userId)
}

export function stopAllStaffRealtime() {
  listeners.forEach((entry, key) => {
    try { off(entry.ref) } catch (e) { /* noop */ }
  })
  listeners.clear()
  console.log('staffRealtime: all listeners stopped')
}
