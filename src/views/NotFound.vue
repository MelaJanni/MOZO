<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
      <BaseButton @click="goHome" variant="primary">
        Volver al inicio
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
}

.not-found-content {
  text-align: center;
  max-width: 28rem;
}

h1 {
  font-size: 6rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style> 