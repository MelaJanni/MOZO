<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  employee: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'remove']);

const viewEmployee = () => {
  emit('view', props.employee);
};

const removeEmployee = (event) => {
  event.stopPropagation();
  emit('remove', props.employee);
};
</script>

<template>
  <div class="staff-card" @click="viewEmployee">
    <button class="remove-button" @click="removeEmployee">
      <i class="bi bi-x"></i>
    </button>
    
    <div class="staff-avatar">
      <img 
        :src="employee.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'" 
        :alt="employee.name" 
        class="avatar-image"
      />
    </div>
    
    <h3 class="employee-name">{{ employee.name }}</h3>
    
    <div class="staff-info">
      <div class="rating-container">
        <div class="stars">
          <i 
            v-for="star in 5" 
            :key="star" 
            class="bi" 
            :class="star <= Math.round(employee.rating || 0) ? 'bi-star-fill' : 'bi-star'"
          ></i>
        </div>
        <div class="comments-count">
          <i class="bi bi-chat-left-text"></i>
          <span>{{ employee.reviewsCount || 0 }} comentarios</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-card {
  position: relative;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.staff-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.remove-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #666;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: #f8f8f8;
  color: #dc3545;
}

.staff-avatar {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.staff-info {
  width: 100%;
}

.rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stars {
  display: flex;
  color: #FFD700;
}

.stars i {
  margin-right: 2px;
}

.comments-count {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style> 