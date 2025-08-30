<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="modelValue" class="sheet-overlay" @click.self="close" />
    </Transition>

    <Transition name="sheet" @after-leave="onAfterLeave">
      <div v-if="modelValue" class="bottom-sheet" :class="props.sheetClass" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <div>
            <div v-if="title" class="sheet-title">{{ title }}</div>
            <div v-if="subtitle" class="sheet-subtitle">{{ subtitle }}</div>
          </div>
          <button class="sheet-close" @click="close" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="sheet-body">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  sheetClass: { type: [String, Array, Object], default: '' }
})
const emit = defineEmits(['update:modelValue', 'close', 'after-leave'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onKey = (e) => {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// Emitir cuando termina la animación de salida del sheet
const onAfterLeave = () => {
  emit('after-leave')
}
</script>
