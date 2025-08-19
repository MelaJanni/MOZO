// Delegado a firebase.js para evitar doble inicialización de la app.
// Mantiene API previa (getFirebaseApp, getRealtimeDB) para retrocompatibilidad.

import firebaseService from './firebase'

let _app
let _db

export function getFirebaseApp() {
  if (_app) return _app
  // Use initializeFirebaseApp que siempre funciona (no depende de Firebase Messaging)
  return firebaseService.initializeFirebaseApp().then(res => {
    _app = res?.app
    return _app
  })
}

export async function getRealtimeDB() {
  if (_db) return _db
  // Carga dinámica database sólo cuando se solicita
  const { getDatabase } = await import('firebase/database')
  const app = _app || await getFirebaseApp()
  if (!app) throw new Error('Firebase app no inicializada')
  _db = getDatabase(app)
  return _db
}

export default { getFirebaseApp, getRealtimeDB }
