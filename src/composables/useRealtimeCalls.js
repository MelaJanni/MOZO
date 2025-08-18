import { onMounted, onUnmounted, ref } from 'vue'
import { useCallsStore } from '@/stores/calls'
import firebaseCore from '@/services/firebaseCore'

// Estrategia listeners incremental segun plan unificado
export function useRealtimeCalls(waiterId, businessId){
  const store = useCallsStore()
  const attachedCallRefs = new Map()
  const dbRefMod = ref(null)

  async function attachCall(id){
    if(attachedCallRefs.has(id)) return
    const { getDatabase, ref:dbRef, onValue, off } = await import('firebase/database')
    const app = await firebaseCore.getFirebaseApp()
    const db = getDatabase(app)
    const r = dbRef(db, `active_calls/${id}`)
    const unsub = onValue(r, snap => {
      if(!snap.exists()){
        store.remove(id)
        off(r)
        attachedCallRefs.delete(id)
      } else {
        store.upsert(snap.val())
      }
    })
    attachedCallRefs.set(id, { ref:r, unsub })
  }

  async function init(){
    if(store.initialized) return
    store.loading = true
    const { getDatabase, ref:dbRef, onValue } = await import('firebase/database')
    const app = await firebaseCore.getFirebaseApp()
    const db = getDatabase(app)

    // Listener principal waiter/{id}
    const waiterRef = dbRef(db, `waiters/${waiterId}`)
    onValue(waiterRef, snap => {
      if(!snap.exists()) return
      const data = snap.val()
      const active = data.active_calls || []
      store.setWaiterActive(active)
      store.updateStats(data.stats || {})
      // Adjuntar nuevos
      active.forEach(id => attachCall(id))
      // Detach los que ya no están
      for(const id of Array.from(attachedCallRefs.keys())){
        if(!active.includes(id)){
          const obj = attachedCallRefs.get(id)
          if(obj?.unsub) obj.unsub()
          attachedCallRefs.delete(id)
          store.remove(id)
        }
      }
    })

    // Listener opcional negocio
    if(businessId){
      const businessRef = dbRef(db, `businesses/${businessId}`)
      onValue(businessRef, snap => {
        if(!snap.exists()) return
        const data = snap.val()
        if(data.stats) store.updateStats(data.stats)
      })
    }

    store.markInitialized()
    store.loading = false
  }

  onMounted(()=>{ init() })
  onUnmounted(()=>{
    // Limpieza básica
    attachedCallRefs.forEach(obj => obj.unsub && obj.unsub())
    attachedCallRefs.clear()
  })

  return { callsStore: store }
}

export default useRealtimeCalls
