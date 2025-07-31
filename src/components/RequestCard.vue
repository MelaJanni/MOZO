<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'archive', 'reject', 'unarchive']);
</script>

<template>
  <div class="request-card">
    <button v-if="!isArchived" class="close-button" @click.stop="$emit('reject', request)">
      <i class="bi bi-x"></i>
    </button>
    <div class="requester-info">
      <img :src="request.avatar" :alt="`Avatar de ${request.name}`" class="avatar" />
      <div class="text-info">
        <h4 class="name">{{ request.name }}</h4>
        <p class="position">{{ request.position }}</p>
      </div>
    </div>
    
    <div class="actions">
      <template v-if="!isArchived">
        <button class="btn btn-primary" @click.stop="$emit('confirm', request)">
          <i class="bi bi-check-lg"></i> Confirmar
        </button>
        <button class="btn btn-secondary" @click.stop="$emit('archive', request)">
          <i class="bi bi-archive"></i> Archivar
        </button>
        <button class="btn btn-danger" @click.stop="$emit('reject', request)">
          <i class="bi bi-x-lg"></i> Rechazar
        </button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click.stop="$emit('unarchive', request)">
          <i class="bi bi-arrow-counterclockwise"></i> Desarchivar
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.request-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.request-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.requester-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 12px;
  object-fit: cover;
}

.text-info {
  line-height: 1.3;
}

.name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.position {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #6A3FEA;
  color: white;
}
.btn-primary:hover {
  background-color: #5933C3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}
.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #fce8e8;
  color: #dc3545;
}
.btn-danger:hover {
  background-color: #f8d7da;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #666;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.close-button:hover {
  background-color: #f8f8f8;
  color: #dc3545;
}
</style>