<script setup>
import { ref } from 'vue'
import BaseModal from './UI/BaseModal.vue'
import BaseButton from './UI/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmar acción'
  },
  message: {
    type: String,
    default: '¿Estás seguro de que quieres realizar esta acción?'
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  confirmVariant: {
    type: String,
    default: 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleCancel = () => {
  closeModal()
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <BaseModal 
    :modelValue="modelValue"
    :title="title"
    size="sm"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <div class="confirm-modal-content">
      <p>{{ message }}</p>
    </div>
    
    <template #footer>
      <BaseButton
        variant="outline"
        @click="handleCancel"
        :disabled="loading"
      >
        {{ cancelText }}
      </BaseButton>
      
      <BaseButton
        :variant="confirmVariant"
        @click="handleConfirm"
        :loading="loading"
      >
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-modal-content {
  padding: 0.5rem 0;
}
</style> 