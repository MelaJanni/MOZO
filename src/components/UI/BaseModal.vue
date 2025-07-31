<script setup>
import { watch, onMounted, onBeforeUnmount, ref, computed } from 'vue'
import * as bootstrap from 'bootstrap'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: '',
    validator: (value) => ['', 'sm', 'lg', 'xl'].includes(value)
  },
  centered: {
    type: Boolean,
    default: true
  },
  scrollable: {
    type: Boolean,
    default: false
  },
  staticBackdrop: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const modalElement = ref(null)
let bsModal = null

onMounted(() => {
  if (modalElement.value) {
    bsModal = new bootstrap.Modal(modalElement.value, {
      backdrop: props.staticBackdrop ? 'static' : true,
      keyboard: !props.staticBackdrop
    })
    
    modalElement.value.addEventListener('hidden.bs.modal', () => {
      emit('update:modelValue', false)
    })
    
    if (props.modelValue) {
      bsModal.show()
    }
  }
})

onBeforeUnmount(() => {
  if (bsModal) {
    bsModal.dispose()
  }
})

watch(() => props.modelValue, (newValue) => {
  if (!bsModal && modalElement.value) {
    bsModal = new bootstrap.Modal(modalElement.value, {
      backdrop: props.staticBackdrop ? 'static' : true,
      keyboard: !props.staticBackdrop
    })
  }

  if (newValue && bsModal) {
    bsModal.show()
  } else if (!newValue && bsModal) {
    bsModal.hide()
  }
})

const modalClasses = computed(() => {
  const classes = ['modal-dialog']
  
  if (props.centered) {
    classes.push('modal-dialog-centered')
  }
  
  if (props.scrollable) {
    classes.push('modal-dialog-scrollable')
  }
  
  if (props.size) {
    classes.push(`modal-${props.size}`)
  }
  
  return classes.join(' ')
})
</script>

<template>
  <div ref="modalElement" class="modal fade" tabindex="-1" aria-hidden="true">
    <div :class="modalClasses">
      <div class="modal-content rounded-4">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="emit('update:modelValue', false)" 
            aria-label="Close"
          ></button>
        </div>
        
        <div class="modal-body">
          <slot></slot>
        </div>
        
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  overflow-y: auto;
  padding: 1rem;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  width: 100%;
}

.size-sm {
  max-width: 24rem;
}

.size-md {
  max-width: 32rem;
}

.size-lg {
  max-width: 48rem;
}

.modal-content {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  color: #6b7280;
}

.close-button:hover {
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>