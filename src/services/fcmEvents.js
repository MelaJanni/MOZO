// Manejador central de eventos FCM en ventana (foreground)
// Integra con callsStore para reconciliar rápidamente antes de snapshot RTDB
import { useCallsStore } from '@/stores/calls'
import router from '@/router'

export function initFcmWindowListener(){
  if(typeof window === 'undefined' || !navigator.serviceWorker) return
  navigator.serviceWorker.addEventListener('message', (e) => {
    if(!e.data) return
    // Background push payloads from SW
    if (e.data.type === 'fcm_event') {
      const payload = e.data.payload
      const data = payload.data || {}
      const store = useCallsStore()
      const callId = data.call_id || data.callId

      // Reconciliation for calls
      if (callId) {
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
      }

      // Also add to notifications store so UI shows the push message
      try {
        import('@/stores/notifications').then(({ useNotificationsStore }) => {
          const notificationsStore = useNotificationsStore()
          const id = callId || `fcm-${Date.now()}`
          const note = {
            id,
            type: data.type || 'FCMNotification',
            data: {
              title: payload.notification?.title || data.title || 'Nueva notificación',
              message: payload.notification?.body || data.body || data.message || '',
              route: data.route || data.url,
              ...data
            },
            created_at: new Date().toISOString(),
            read_at: null,
            source: 'fcm-sw'
          }
          notificationsStore.addNewNotification(note)
        }).catch(err => console.error('Error adding FCM message to notifications store', err))
      } catch (err) {
        console.error('Error importing notifications store for fcm_event', err)
      }
      return
    }

    // Click on notification in Service Worker -> navigate if route provided
    if (e.data.type === 'notification_click') {
      try {
        const d = e.data.data || {}
        const route = d.route || d.url
        if (route) {
          // Ensure page is focused then navigate
          window.focus()
          router.push(route).catch(()=>{})
        } else {
          // If no route, emit event to let app decide
          window.dispatchEvent(new CustomEvent('notification_click', { detail: d }))
        }
      } catch (err) {
        console.error('Error handling notification_click message', err)
      }
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
