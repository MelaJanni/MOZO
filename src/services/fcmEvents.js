// Manejador central de eventos FCM en ventana (foreground)
// Integra con callsStore para reconciliar rápidamente antes de snapshot RTDB
import { useCallsStore } from '@/stores/calls'

export function initFcmWindowListener(){
  if(typeof window === 'undefined' || !navigator.serviceWorker) return
  navigator.serviceWorker.addEventListener('message', (e) => {
    if(!e.data || e.data.type !== 'fcm_event') return
    const payload = e.data.payload
    const data = payload.data || {}
    const store = useCallsStore()
    const callId = data.call_id || data.callId
    if(!callId) return

    // Solo actuar si aún no tenemos la llamada (optimistic) o status mejora
    if(!store.has(callId)){
      store.upsert({
        id: callId,
        table_id: data.table_id,
        table_number: data.table_number,
        status: data.status || inferStatus(data.type),
        urgency: data.urgency,
        called_at: data.timestamp || Date.now(),
        last_updated: Date.now(),
        event_type: data.type || 'event'
      })
    }
  })
}

function inferStatus(type){
  if(type==='new_call') return 'pending'
  if(type==='acknowledged') return 'acknowledged'
  if(type==='completed') return 'completed'
  return 'pending'
}

export default { initFcmWindowListener }
