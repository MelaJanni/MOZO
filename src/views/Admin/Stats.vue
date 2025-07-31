<template>
  <div class="stats-container">
    <div class="coming-soon-container">
      <i class="bi bi-bar-chart-line-fill icon"></i>
      <h1>Estadísticas</h1>
      <p>Esta sección estará disponible próximamente.</p>
      <p>Estamos trabajando para ofrecerte los mejores análisis para tu negocio.</p>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background-color: #f9fafb;
}

.coming-soon-container {
  text-align: center;
  background-color: white;
  padding: 3rem 4rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 500px;
}

.icon {
  font-size: 3rem;
  color: #6A3FEA;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

p {
  color: #666;
  font-size: 1rem;
}
</style>
