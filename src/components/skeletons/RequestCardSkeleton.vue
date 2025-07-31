<template>
  <div class="request-card-skeleton">
    <div class="info-skeleton">
      <SkeletonLoader width="50%" height="1.1rem" borderRadius="4px" />
      <SkeletonLoader width="30%" height="0.9rem" borderRadius="4px" style="margin-top: 8px;" />
    </div>
    <div class="actions-skeleton">
      <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
      <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
    </div>
  </div>
</template>

<script setup>
import SkeletonLoader from '../UI/SkeletonLoader.vue';
</script>

<style scoped>
.request-card-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.info-skeleton {
  flex: 1;
  margin-right: 1rem;
}

.actions-skeleton {
  display: flex;
  gap: 1rem;
}
</style> 