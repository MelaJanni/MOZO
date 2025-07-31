<template>
  <BaseModal :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" :title="title" size="sm">
    <div class="mb-3">
      <label class="form-label">{{ label }}</label>
      <input :type="inputType" class="form-control" v-model="input" :placeholder="placeholder" />
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('update:modelValue', false)">Cancelar</button>
      <button class="btn btn-primary" :disabled="!input.toString().trim()" @click="confirm">Aceptar</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Ingresar dato' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  defaultValue: { type: [String, Number], default: '' },
  inputType: { type: String, default: 'text' }
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const input = ref(props.defaultValue)

watch(() => props.modelValue, (val) => {
  if (val) input.value = props.defaultValue
})

const confirm = () => {
  const value = props.inputType === 'number' ? input.value : input.value.trim()
  emit('confirm', value)
  emit('update:modelValue', false)
}
</script> 