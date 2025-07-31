<template>
  <div class="skeleton" :style="{ width, height, borderRadius }"></div>
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  borderRadius: {
    type: String,
    default: '4px'
  }
})
</script>

<style scoped>
.skeleton {
  background-color: #e0e0e0;
  background-image: linear-gradient(
    90deg,
    #e0e0e0 0px,
    #f5f5f5 40px,
    #e0e0e0 80px
  );
  background-size: 600px;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
</style> 