<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'Foto de perfil'
  },
  editable: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['update:src', 'file-selected']);
const imageUrl = ref(props.src);
const isUploading = ref(false);
const fileInput = ref(null);
watch(() => props.src, (newSrc) => {
  imageUrl.value = newSrc;
});
const handleClick = () => {
  if (props.editable && fileInput.value) {
    fileInput.value.click();
  }
};
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  isUploading.value = true;
  const reader = new FileReader();
  reader.onload = (event) => {
    imageUrl.value = event.target.result;
    emit('update:src', imageUrl.value);
    emit('file-selected', file);
    isUploading.value = false;
  };
  reader.readAsDataURL(file);
};
</script>
<template>
  <div class="profile-avatar" :class="{ editable: editable }" @click="handleClick">
    <img v-if="imageUrl" :src="imageUrl" :alt="alt" class="avatar-image" />
    <i v-else class="bi bi-person-fill avatar-icon"></i>
    <div v-if="editable" class="avatar-overlay">
      <i class="bi bi-camera"></i>
    </div>
    <div v-if="isUploading" class="avatar-loading">
      <div class="spinner"></div>
    </div>
    <input
      v-if="editable"
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFileChange"
    />
  </div>
</template>
<style scoped>
.profile-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--violet-300) 100%);
  box-shadow: 0 4px 12px rgba(159, 84, 253, 0.2);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 48px;
  color: white;
}

.editable {
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 24px;
}

.editable:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay i {
  color: white;
  font-size: 1.5rem;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.file-input {
  display: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 768px) {
  .profile-avatar {
    width: 150px;
    height: 150px;
  }
  
  .avatar-icon {
    font-size: 60px;
  }
}
</style> 