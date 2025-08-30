<template>
  <div class="table-card" :class="stateClass">
    <div class="d-flex justify-content-between align-items-start">
      <div class="table-number">{{ table.number }}</div>
      <i v-if="isUrgent" class="bi bi-exclamation-triangle-fill"></i>
      <i v-else-if="table.is_silenced" class="bi bi-volume-mute"></i>
      <i v-else class="bi bi-check2"></i>
    </div>
    <div class="table-state">{{ stateLabel }}</div>
    <div class="actions">
      <button v-if="table.actions_available?.can_activate" class="btn-ghost" @click="$emit('activate', table.id)">
        <i class="bi bi-check"></i> OK
      </button>
      <button v-if="table.actions_available?.can_silence" class="btn-ghost" @click="$emit('silence', table.id)">
        <i class="bi bi-volume-mute"></i> Silenciar
      </button>
      <button v-if="table.actions_available?.can_unsilence" class="btn-ghost" @click="$emit('unsilence', table.id)">
        <i class="bi bi-volume-up"></i> Quitar
      </button>
      <button v-if="table.actions_available?.can_deactivate" class="btn-ghost" @click="$emit('deactivate', table.id)">
        <i class="bi bi-x"></i> Salir
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  table: { type: Object, required: true },
  urgent: { type: Boolean, default: false }
})

const isUrgent = computed(() => props.urgent || props.table.pending_calls_count > 0)

const stateClass = computed(() => {
  if (isUrgent.value) return 'state-calling'
  if (props.table.is_silenced) return 'state-muted'
  return 'state-assigned'
})

const stateLabel = computed(() => {
  if (isUrgent.value) return 'Llamando'
  if (props.table.is_silenced) return 'Silenciada'
  return 'Asignada'
})
</script>
