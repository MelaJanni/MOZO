<script setup>
import { ref, watch, computed } from 'vue';
const props = defineProps({
  value: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: true
  },
  min: {
    type: [Number, String],
    default: null
  },
  max: {
    type: [Number, String],
    default: null
  },
  unit: {
    type: String,
    default: ''
  },
  displayValue: {
    type: String,
    default: ''
  },
  hasError: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['update:value']);
const currentValue = ref(props.value);
const isEditing = ref(false);
const inputRef = ref(null);
watch(() => props.value, (newValue) => {
  if (!isEditing.value) {
    currentValue.value = newValue;
  }
});
const displayValue = computed(() => {
  if (props.displayValue) return props.displayValue;
  if (props.type === 'select' && props.options.length) {
    const option = props.options.find(opt => opt.value === currentValue.value);
    return option ? option.label : currentValue.value;
  }
  return currentValue.value + (props.unit ? ' ' + props.unit : '');
});
const startEditing = () => {
  if (!props.editable) return;
  isEditing.value = true;
  setTimeout(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  }, 100);
};
const saveChanges = () => {
  isEditing.value = false;
  emit('update:value', currentValue.value);
};
const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    saveChanges();
  } else if (e.key === 'Escape') {
    isEditing.value = false;
    currentValue.value = props.value; // Restaurar valor original
  }
};
const cancelEditing = () => {
  isEditing.value = false;
  currentValue.value = props.value; // Restaurar valor original
};
</script>
<template>
  <div class="editable-field" :class="{ 'has-error': hasError }">
    <div class="field-label" v-if="label">{{ label }}</div>
    <div class="field-content" :class="{ 'is-editing': isEditing, 'error': hasError }">
      <div v-if="!isEditing" class="display-value" @click="startEditing">
        {{ displayValue }}
        <button v-if="editable" class="edit-button" @click.stop="startEditing">
          <i class="bi bi-pencil"></i>
        </button>
      </div>
      <div v-else class="edit-container">
        <input
          v-if="type === 'text' || type === 'email' || type === 'tel'"
          ref="inputRef"
          :type="type"
          v-model="currentValue"
          :placeholder="placeholder"
          :class="['edit-input', { 'input-error': hasError }]"
          @keydown="handleKeyDown"
          @change="saveChanges"
          @blur="cancelEditing"
        />
        <input
          v-else-if="type === 'number'"
          ref="inputRef"
          type="number"
          v-model="currentValue"
          :placeholder="placeholder"
          :min="min"
          :max="max"
          :class="['edit-input ', { 'input-error': hasError }]"
          @keydown="handleKeyDown"
          @change="saveChanges"
          @blur="cancelEditing"
        />
        <input
          v-else-if="type === 'date'"
          ref="inputRef"
          type="date"
          v-model="currentValue"
          :class="['edit-input', { 'input-error': hasError }]"
          @keydown="handleKeyDown"
          @change="saveChanges"
          @blur="cancelEditing"
        />
        <textarea
          v-else-if="type === 'textarea'"
          ref="inputRef"
          v-model="currentValue"
          rows="3"
          :class="['edit-input', { 'input-error': hasError }]"
          @keydown="handleKeyDown"
          @change="saveChanges"
          @blur="cancelEditing"
        ></textarea>
        <select
          v-else-if="type === 'select'"
          ref="inputRef"
          v-model="currentValue"
          :class="['edit-select', { 'input-error': hasError }]"
          @change="saveChanges"
          @blur="cancelEditing"
        >
          <option 
            v-for="option in options" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <div class="edit-actions">
          <button type="button" class="action-button save-button" @click="saveChanges">
            <i class="bi bi-check"></i>
          </button>
          <button type="button" class="action-button cancel-button" @click="cancelEditing">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
    <div v-if="hasError && errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>
<style scoped>

.save-button { color: #10b981; }
.cancel-button { color: #ef4444; }

/* Error styles */
.has-error .field-label { color: #dc3545; }
.input-error { box-shadow: inset 0 0 0 1px rgba(220,53,69,0.6) !important; }
.error-message { font-size: 0.875rem; color: #dc3545; margin-top: 6px; padding-left: 8px; }
</style> 