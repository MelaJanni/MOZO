<template>
  <div class="table-item-skeleton">
    <SkeletonLoader width="80%" height="24px" borderRadius="6px" />
  </div>
</template>

<script setup>
import SkeletonLoader from '../UI/SkeletonLoader.vue';
</script>

<style scoped>
.table-item-skeleton {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}
</style> 