<template>
  <div class="staff-card-skeleton">
    <div class="avatar-skeleton">
      <SkeletonLoader width="64px" height="64px" borderRadius="50%" />
    </div>
    <div class="info-skeleton">
      <SkeletonLoader width="60%" height="1.2rem" borderRadius="4px" />
      <SkeletonLoader width="40%" height="1rem" borderRadius="4px" style="margin-top: 8px;" />
    </div>
  </div>
</template>

<script setup>
import SkeletonLoader from '../UI/SkeletonLoader.vue';
</script>

<style scoped>
.staff-card-skeleton {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.avatar-skeleton {
  margin-right: 1.5rem;
}

.info-skeleton {
  flex: 1;
}
</style> 