<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  name: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const inputValue = ref(props.modelValue)
const isFocused = ref(false)

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

const updateValue = (event) => {
  const value = event.target.value
  inputValue.value = value
  emit('update:modelValue', value)
}

const onFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const inputClasses = computed(() => {
  return [
    'base-input',
    { 'base-input-disabled': props.disabled },
    { 'base-input-error': props.error },
    { 'base-input-focused': isFocused.value }
  ]
})
</script>

<template>
  <div class="base-input-wrapper">
    <label v-if="label" class="base-input-label">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>
    
    <input
      :type="type"
      :value="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :name="name"
      :class="inputClasses"
      @input="updateValue"
      @focus="onFocus"
      @blur="onBlur"
    />
    
    <p v-if="error" class="base-input-error-message">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: 100%;
}

.base-input-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #4b5563;
}

.base-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.base-input:hover:not(.base-input-disabled) {
  border-color: #a3a3a3;
}

.base-input-focused {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.base-input-disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.base-input-error {
  border-color: var(--error-color);
}

.base-input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.base-input-error-message {
  font-size: 0.75rem;
  color: var(--error-color);
  margin-top: 0.25rem;
}

.required-indicator {
  color: var(--error-color);
  margin-left: 0.125rem;
}
</style> 