<template>
  <Teleport to="body">
    <div class="pm-overlay" @click.self="$emit('close')">
      <div class="pm-modal row justify-content-center align-items-center">
        <!-- Header -->
        <div class="pm-header col-12">
          <div class="pm-title">
            <i class="bi bi-grid-3x3-gap-fill pm-icon"></i>
            <span>Todas las Mesas<span v-if="title"> - {{ title }}</span></span>
          </div>
          <button class="pm-close" @click="$emit('close')" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Search -->
        <div class="pm-search mt-2 col-11">
          <i class="bi bi-search"></i>
          <input
            v-model="q"
            class="pm-input"
            type="text"
            placeholder="Buscar mesa..."
          />
        </div>

        <!-- Stats simplified -->
        <div class="pm-stats col-12">
          <span class="pm-stat">{{ stats.total }} mesas</span>
          <span class="pm-stat danger" v-if="stats.calling">{{ stats.calling }} notificando</span>
          <button class="pm-clear" v-if="hasFilters" @click="clearFilters">
            <i class="bi bi-x"></i> Limpiar
          </button>
        </div>

        <!-- List -->
        <div class="at-list mt-2 col-12">
          <div v-for="t in filtered" :key="t.id" class="at-item" :class="rowClass(t)">
            <div class="left">
              <div class="at-title">Mesa {{ t.number || t.name || t.id }}</div>
              <div class="at-meta">
                <span v-if="statusOf(t)!=='Disponible'" class="at-badge" :class="badgeClass(t)">{{ statusOf(t) }}</span>
              </div>
            </div>
            <div class="right">
              <button v-if="isAssigned(t)" class="pm-btn primary" @click="$emit('unassign', t.id)">Desasignar</button>
              <button v-else class="pm-btn outline" @click="$emit('assign', t.id)">Asignar</button>
              <button v-if="isSilenced(t)" class="pm-btn-link" @click="$emit('unsilence', t.id)">Activar</button>
              <button v-else class="pm-btn-link" @click="$emit('silence', t.id)">Silenciar</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  tables: { type: Array, default: () => [] },
  assignedIds: { type: Array, default: () => [] },
  silencedIds: { type: Array, default: () => [] },
  pendingByTableId: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'assign', 'unassign', 'silence', 'unsilence'])

const q = ref('')
const view = ref('list')

// Filters
const open = reactive({ status: false, zone: false, sort: false })
const status = ref('all')
const zone = ref('all')
const sort = ref('number')

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'available', label: 'Disponibles' },
  { value: 'assigned', label: 'Asignadas' },
  { value: 'calling', label: 'Llamando' },
  { value: 'silenced', label: 'Silenciadas' },
]
const sortOptions = [
  { value: 'number', label: 'Número' },
  { value: 'zone', label: 'Zona' },
]

const zonesSet = computed(() => {
  const set = new Set()
  props.tables.forEach(t => set.add(zoneOf(t)))
  return Array.from(set).filter(Boolean)
})
const zoneOptions = computed(() => [{ value: 'all', label: 'Todas' }, ...zonesSet.value.map(z => ({ value: z, label: z }))])

const statusLabel = computed(() => statusOptions.find(o => o.value === status.value)?.label || 'Estados')
const sortLabel = computed(() => sortOptions.find(o => o.value === sort.value)?.label || 'Orden')
const zoneLabel = computed(() => zoneOptions.value.find(o => o.value === zone.value)?.label || 'Zonas')

const assignedSet = computed(() => new Set(props.assignedIds))
const silencedSet = computed(() => new Set(props.silencedIds))

function isAssigned(t) { return assignedSet.value.has(t.id) }
function isSilenced(t) { return silencedSet.value.has(t.id) }
function isCalling(t) { return (props.pendingByTableId?.[t.id] || 0) > 0 }

function statusOf(t) {
  if (isCalling(t)) return 'Llamando'
  if (isSilenced(t)) return 'Silenciada'
  if (isAssigned(t)) return 'Asignada'
  return 'Disponible'
}
function badgeClass(t) {
  const s = statusOf(t)
  return {
    'warning': s === 'Llamando',
    'danger': s === 'Urgente',
    'muted': s === 'Silenciada',
    'primary': s === 'Asignada',
  }
}
function rowClass(t) {
  const s = statusOf(t)
  return {
    'is-calling': s === 'Llamando',
    'is-silenced': s === 'Silenciada',
  }
}

function zoneOf(t) { return t.zone_name || t.section || t.zone || 'Zona Principal' }
function capacityOf(t) { return t.capacity || t.seats || t.people || 4 }

const filtered = computed(() => {
  let list = props.tables
  // search
  const qq = q.value.trim().toLowerCase()
  if (qq) {
    list = list.filter(t => {
      const num = String(t.number || t.name || t.id).toLowerCase()
      const z = String(zoneOf(t)).toLowerCase()
      return num.includes(qq) || z.includes(qq)
    })
  }
  // status
  if (status.value !== 'all') {
    list = list.filter(t => {
      const s = statusOf(t)
      return (
        (status.value === 'available' && s === 'Disponible') ||
        (status.value === 'assigned' && s === 'Asignada') ||
        (status.value === 'calling' && s === 'Llamando') ||
        (status.value === 'silenced' && s === 'Silenciada')
      )
    })
  }
  // zone
  if (zone.value !== 'all') list = list.filter(t => zoneOf(t) === zone.value)
  // sort
  list = [...list]
  if (sort.value === 'number') list.sort((a,b) => (a.number||0) - (b.number||0))
  else if (sort.value === 'zone') list.sort((a,b) => zoneOf(a).localeCompare(zoneOf(b)))
  return list
})

const stats = computed(() => ({
  total: props.tables.length,
  calling: filtered.value.filter(t => isCalling(t)).length,
  assigned: filtered.value.filter(t => isAssigned(t)).length,
  silenced: filtered.value.filter(t => isSilenced(t)).length,
}))

const hasFilters = computed(() => q.value || status.value !== 'all' || zone.value !== 'all' || sort.value !== 'number')

function clearFilters() {
  q.value = ''
  status.value = 'all'
  zone.value = 'all'
  sort.value = 'number'
}

function toggleOpen(key) { open[key] = !open[key] }
function setStatus(v) { status.value = v; open.status = false }
function setZone(v) { zone.value = v; open.zone = false }
function setSort(v) { sort.value = v; open.sort = false }
</script>
