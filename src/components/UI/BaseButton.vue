<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline-primary', 'outline-secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link'].includes(value)
  },
  size: {
    type: String,
    default: '',
    validator: (value) => ['', 'sm', 'lg'].includes(value)
  },
  block: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button'
  }
})

const emit = defineEmits(['click'])

const classes = computed(() => {
  const classList = ['btn']
  
  classList.push(`btn-${props.variant}`)
  
  if (props.size) {
    classList.push(`btn-${props.size}`)
  }
  
  if (props.block) {
    classList.push('w-100')
  }
  
  if (props.loading) {
    classList.push('position-relative')
  }
  
  return classList.join(' ')
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <div v-if="loading" class="spinner-border spinner-border-sm me-2" 
         role="status" aria-hidden="true"></div>
    <span :class="{ 'opacity-0': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
button.btn {
  position: relative;
}

button.position-relative .spinner-border {
  position: absolute;
  left: calc(50% - 0.5rem);
}
</style> 