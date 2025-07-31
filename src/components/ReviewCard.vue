<script setup>
import { ref } from 'vue';
import BaseModal from '@/components/UI/BaseModal.vue';

const props = defineProps({
  review: {
    type: Object,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete']);

const showConfirmModal = ref(false);

const openConfirmModal = () => {
  showConfirmModal.value = true;
};

const confirmDelete = () => {
  emit('delete', props.review.id);
  showConfirmModal.value = false;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="review-card">
    <div class="review-header">
      <div class="reviewer-info">
        <img 
          :src="review.reviewer?.avatar" 
          :alt="review.reviewer?.name" 
          class="reviewer-avatar"
        />
        <h3 class="reviewer-name">{{ review.reviewer?.name }}</h3>
      </div>
      
      <div class="review-rating">
        <div class="stars-container">
          <i 
            v-for="star in 5" 
            :key="star" 
            class="bi" 
            :class="star <= review.rating ? 'bi-star-fill' : 'bi-star'"
          ></i>
        </div>
        <span class="rating-value">{{ review.rating }}</span>
      </div>
      
      <button 
        v-if="canDelete" 
        class="delete-button" 
        @click="openConfirmModal"
        aria-label="Eliminar reseña"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>
    
    <p class="review-text">{{ review.comment }}</p>
    
    <div class="review-footer">
      <span class="review-date" v-if="review.date">{{ formatDate(review.date) }}</span>
    </div>
    

    <BaseModal
      v-if="showConfirmModal"
      v-model="showConfirmModal"
      title="Eliminar reseña"
      size="sm"
    >
      <p>¿Estás seguro de que deseas eliminar esta reseña?</p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
      
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showConfirmModal = false"
        >
          Cancelar
        </button>
        <button 
          class="btn btn-danger" 
          @click="confirmDelete"
        >
          Eliminar
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.review-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.review-rating {
  display: flex;
  align-items: center;
}

.stars-container {
  display: flex;
  margin-right: 0.5rem;
}

.stars-container i {
  color: #FFD700;
  margin-right: 2px;
}

.rating-value {
  font-weight: 600;
  font-size: 1.125rem;
}

.delete-button {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-button:hover {
  opacity: 1;
}

.review-text {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
}

.review-date {
  font-size: 0.875rem;
  color: #777;
}

.warning-text {
  color: #dc3545;
  font-size: 0.875rem;
}
</style> 