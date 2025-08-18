import { defineStore } from 'pinia'

// Store centralizado de llamadas activas (Realtime + FCM)
export const useCallsStore = defineStore('calls', {
  state: () => ({
    calls: {}, // id -> objeto llamada
    waiterActiveIds: [],
    businessActiveIds: [],
    stats: { pending_count: 0, total_active_calls: 0 },
    initialized: false,
    loading: false,
    lastSync: null
  }),
  getters: {
    list: (s) => Object.values(s.calls).sort((a,b)=> (b.called_at||0)-(a.called_at||0)),
    pending: (s) => Object.values(s.calls).filter(c=>c.status==='pending'),
    acknowledged: (s) => Object.values(s.calls).filter(c=>c.status==='acknowledged'),
    active: (s) => Object.values(s.calls).filter(c=>c.status!=='completed'),
    has: (s) => (id) => !!s.calls[id]
  },
  actions: {
    upsert(call){
      if(!call || !call.id) return
      const existing = this.calls[call.id]
      // Evitar retrocesos de estado (completed no debe volver a pending)
      if(existing){
        const order = { pending:1, acknowledged:2, completed:3 }
        if(order[call.status] < order[existing.status]) return
      }
      this.calls[call.id] = { ...(existing||{}), ...call }
      this.lastSync = Date.now()
    },
    remove(id){
      if(this.calls[id]) delete this.calls[id]
    },
    setWaiterActive(ids){
      this.waiterActiveIds = ids||[]
    },
    updateStats(partial){
      this.stats = { ...this.stats, ...(partial||{}) }
    },
    markInitialized(){ this.initialized = true }
  }
})
