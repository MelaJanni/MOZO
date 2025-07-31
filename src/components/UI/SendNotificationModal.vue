<template>
  <BaseModal
    :model-value="modelValue"
    title="Enviar Notificación"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #body>
      <form @submit.prevent="submit" class="send-notification-form">
        <div class="form-group">
          <label for="title">Título</label>
          <BaseInput
            id="title"
            v-model="form.title"
            placeholder="Ej: Recordatorio de reunión"
            required
          />
        </div>
        <div class="form-group">
          <label for="body">Mensaje</label>
          <textarea
            id="body"
            v-model="form.body"
            rows="4"
            placeholder="Escribe aquí el mensaje de la notificación..."
            required
            class="textarea-input"
          ></textarea>
        </div>
      </form>
    </template>
    <template #footer>
      <BaseButton @click="$emit('update:modelValue', false)" variant="secondary">
        Cancelar
      </BaseButton>
      <BaseButton @click="submit" :loading="loading" :disabled="!isFormValid">
        Enviar
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
  title: '',
  body: ''
})

const isFormValid = computed(() => {
  return form.value.title.trim() !== '' && form.value.body.trim() !== ''
})

const submit = () => {
  if (isFormValid.value) {
    emit('submit', { ...form.value })
  }
}
</script>

<style scoped>
.send-notification-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.textarea-input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}
</style> 