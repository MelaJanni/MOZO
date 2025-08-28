import { getDatabase, ref, onValue, off } from 'firebase/database'
import { initializeFirebaseApp } from '@/services/firebase'

let app = null
let db = null

const ensureInit = async () => {
  console.log('🔍 DEBUG: ensureInit called, current db:', !!db)
  
  if (db) {
    console.log('🔍 DEBUG: Database already initialized, returning existing')
    return { app, db }
  }
  
  try {
    console.log('🔍 DEBUG: Initializing Firebase app...')
    const firebaseInstance = await initializeFirebaseApp()
    if (!firebaseInstance) {
      console.error('🔍 DEBUG: Failed to initialize Firebase app')
      return null
    }
    
    console.log('🔍 DEBUG: Firebase instance obtained:', !!firebaseInstance.app)
    app = firebaseInstance.app
    db = getDatabase(app)
    console.log('🔍 DEBUG: Database created:', !!db)
    
    // Asegurar que Firebase Auth esté completamente inicializado
    if (firebaseInstance.auth) {
      console.log('🔍 DEBUG: Waiting for auth state to stabilize...')
      const { onAuthStateChanged } = await import('firebase/auth')
      
      // Esperar a que el estado de autenticación se estabilice
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseInstance.auth, (user) => {
          console.log('🔍 DEBUG: Auth state changed:', user ? 'authenticated' : 'not authenticated')
          unsubscribe()
          resolve()
        })
      })
    }
    
    console.log('🔍 DEBUG: Firebase initialized successfully')
    return { app, db }
  } catch (err) {
    console.error('🔍 DEBUG: Firebase init error', err)
    return null
  }
}

const listeners = new Map()

export async function startStaffRealtimeForAdmin(businessId, onChange) {
  console.log('🔍 DEBUG: startStaffRealtimeForAdmin called with businessId:', businessId)
  
  if (!businessId) {
    console.log('🔍 DEBUG: No businessId provided, returning early')
    return
  }
  
  console.log('🔍 DEBUG: Ensuring Firebase init...')
  const init = await ensureInit()
  if (!init) {
    console.log('🔍 DEBUG: Firebase init failed, returning early')
    return
  }

  const path = `businesses_staff/${businessId}`
  console.log('🔍 DEBUG: Setting up listener for path:', path)
  const nodeRef = ref(db, path)

  const callback = (snapshot) => {
    const val = snapshot.val()
    console.log('🚨🚨🚨 FIREBASE LISTENER TRIGGERED! 🚨🚨🚨')
    console.log('🔍 DEBUG: Admin listener received data for path', path, ':', val)
    console.log('🔍 DEBUG: Snapshot exists:', snapshot.exists())
    console.log('🔍 DEBUG: Snapshot key:', snapshot.key)
    
    // Always log even if no data
    if (val === null) {
      console.log('🔍 DEBUG: Received NULL data - this might be normal for initial empty state')
    }
    
    try {
      if (onChange && typeof onChange === 'function') {
        console.log('🔍 DEBUG: Calling onChange callback with data:', val)
        onChange(val)
      } else {
        console.log('🔍 DEBUG: onChange is not a valid function:', onChange)
      }
    } catch (err) {
      console.error('🔍 DEBUG: startStaffRealtimeForAdmin onChange error', err)
    }
  }

  const unsubscribe = onValue(nodeRef, callback, (err) => {
    console.error('🔍 DEBUG: startStaffRealtimeForAdmin listener error for path:', path, 'error:', err)
  })

  listeners.set(`admin:${businessId}`, { ref: nodeRef, unsubscribe })
  console.log('🔍 DEBUG: Admin listener successfully started for businessId:', businessId, 'path:', path)
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

export async function writeStaffRequest(businessId, requestData) {
  console.log('🔔 writeStaffRequest called with businessId:', businessId, 'data:', requestData)
  
  if (!businessId) {
    console.error('🔔 writeStaffRequest: No businessId provided')
    throw new Error('Business ID is required')
  }
  
  const init = await ensureInit()
  if (!init) {
    console.error('🔔 writeStaffRequest: Firebase init failed')
    throw new Error('Failed to initialize Firebase')
  }

  try {
    const { set, push, ref: dbRef, serverTimestamp } = await import('firebase/database')
    
    const path = `businesses_staff/${businessId}`
    console.log('🔔 writeStaffRequest: Writing to path:', path)
    
    // Structure the data to include both stats and recent_activity
    const updateData = {
      stats: {
        pending_count: 1,
        total_requests: 1,
        last_updated: serverTimestamp()
      },
      recent_activity: {
        last_request_id: requestData.last_request_id || requestData.id,
        last_request_name: requestData.last_request_name || requestData.name,
        last_request_status: requestData.last_request_status || requestData.status,
        last_update: serverTimestamp(),
        request_details: {
          id: requestData.id,
          name: requestData.name,
          user_id: requestData.user_id,
          status: requestData.status,
          created_at: requestData.created_at
        }
      }
    }
    
    const nodeRef = dbRef(db, path)
    await set(nodeRef, updateData)
    
    console.log('🔔 writeStaffRequest: Successfully wrote to Firebase:', updateData)
    return updateData
  } catch (error) {
    console.error('🔔 writeStaffRequest: Error writing to Firebase:', error)
    throw error
  }
}
