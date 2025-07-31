<template>
  <div class="menu-card-skeleton">
    <SkeletonLoader height="150px" borderRadius="12px 12px 0 0" />
    <div class="skeleton-info">
      <SkeletonLoader width="70%" height="1.25rem" borderRadius="4px" />
      <SkeletonLoader width="40%" height="1rem" borderRadius="4px" style="margin-top: 8px;" />
    </div>
  </div>
</template>

<script setup>
import SkeletonLoader from '../UI/SkeletonLoader.vue'
</script>

<style scoped>
.menu-card-skeleton {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.skeleton-info {
  padding: 1rem;
}
</style> 