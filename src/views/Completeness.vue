<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const completenessData = ref(null)
const loading = ref(true)
const error = ref('')

const loadCompletenessData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await apiService.getActiveUserProfile()
    const profileData = response.data
    
    // Transformar los datos del perfil activo a formato de completeness
    const mockCompletenessData = {
      completion_percentage: profileData.is_complete ? 100 : 60,
      message: profileData.is_complete ? 'Tu perfil está completo' : 'Completa tu perfil para aprovechar al máximo la app',
      statistics: {
        completed_required: profileData.is_complete ? 8 : 5,
        missing_required: profileData.is_complete ? 0 : 3,
        total_fields: 8
      },
      categories: {
        basic_info: {
          name: 'Información Básica',
          percentage: profileData.display_name ? 100 : 50,
          completed: profileData.display_name ? 2 : 1,
          total: 2
        },
        contact_info: {
          name: 'Información de Contacto',
          percentage: profileData.profile_data?.corporate_email || profileData.profile_data?.phone ? 80 : 20,
          completed: profileData.profile_data?.corporate_email || profileData.profile_data?.phone ? 4 : 1,
          total: 5
        }
      },
      missing_fields: profileData.is_complete ? [] : [
        {
          field: 'display_name',
          label: 'Nombre a mostrar',
          description: 'El nombre que verán otros usuarios',
          required: true,
          priority: 'high'
        },
        {
          field: 'corporate_email',
          label: 'Email corporativo', 
          description: 'Tu email de trabajo en el negocio',
          required: false,
          priority: 'medium'
        }
      ],
      next_steps: [
        'Completa tu nombre a mostrar',
        'Agrega una foto de perfil',
        'Completa tu información de contacto'
      ],
      profile_tips: [
        'Un perfil completo genera más confianza',
        'Actualiza tu información regularmente',
        'Usa una foto profesional'
      ]
    }
    
    completenessData.value = mockCompletenessData
  } catch (err) {
    console.error('Error al cargar completitud del perfil:', err)
    error.value = 'No se pudieron cargar los datos. Por favor, inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

const goToProfile = () => {
  const role = authStore.currentRole
  if (role === 'admin') {
    router.push({ name: 'admin-profile' })
  } else {
    router.push({ name: 'profile' })
  }
}

const goBack = () => {
  const role = authStore.currentRole
  router.push({ name: role === 'waiter' ? 'waiter-dashboard' : 'admin' })
}

const getCompletionColor = (percentage) => {
  if (percentage >= 80) return '#10b981'
  if (percentage >= 60) return '#f59e0b'
  return '#ef4444'
}

const getCategoryIcon = (categoryKey) => {
  const icons = {
    basic_info: 'bi-person',
    physical_info: 'bi-activity',
    contact_info: 'bi-telephone',
    professional_info: 'bi-briefcase',
    availability: 'bi-calendar'
  }
  return icons[categoryKey] || 'bi-info-circle'
}

const getPriorityColor = (priority) => {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280'
  }
  return colors[priority] || '#6b7280'
}

onMounted(() => {
  loadCompletenessData()
})
</script>

<template>
  <div class="completeness-container">
    <div class="completeness-header">
      <button class="back-button" @click="goBack">
        ← Volver
      </button>
      <h1>Completitud del Perfil</h1>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando información del perfil...</p>
    </div>
    
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-if="completenessData && !loading" class="completeness-content">
      <!-- Resumen general -->
      <div class="completion-summary">
        <div class="completion-circle">
          <svg viewBox="0 0 100 100" class="progress-ring">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              stroke-width="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              :stroke="getCompletionColor(completenessData.completion_percentage)"
              stroke-width="8"
              fill="none"
              stroke-linecap="round"
              :stroke-dasharray="`${2.83 * completenessData.completion_percentage} 283`"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="completion-text">
            <span class="percentage">{{ completenessData.completion_percentage }}%</span>
            <span class="label">Completado</span>
          </div>
        </div>
        
        <div class="completion-info">
          <h2>{{ completenessData.message }}</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-number">{{ completenessData.statistics.completed_required }}</span>
              <span class="stat-label">Campos completados</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ completenessData.statistics.missing_required }}</span>
              <span class="stat-label">Campos faltantes</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ completenessData.statistics.total_fields }}</span>
              <span class="stat-label">Total de campos</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Categorías -->
      <div v-if="completenessData.categories" class="categories-section">
        <h3>Progreso por categorías</h3>
        <div class="categories-grid">
          <div 
            v-for="(category, key) in completenessData.categories" 
            :key="key"
            class="category-card"
          >
            <div class="category-header">
              <i :class="getCategoryIcon(key)"></i>
              <span class="category-name">{{ category.name }}</span>
            </div>
            <div class="category-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ 
                    width: category.percentage + '%',
                    backgroundColor: getCompletionColor(category.percentage)
                  }"
                ></div>
              </div>
              <span class="progress-text">
                {{ category.completed }}/{{ category.total }} ({{ category.percentage }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Campos faltantes -->
      <div v-if="completenessData.missing_fields?.length" class="missing-fields-section">
        <h3>Campos por completar</h3>
        <div class="missing-fields-list">
          <div 
            v-for="field in completenessData.missing_fields" 
            :key="field.field"
            class="missing-field-item"
          >
            <div class="field-info">
              <div class="field-header">
                <span class="field-label">{{ field.label }}</span>
                <span 
                  class="field-priority"
                  :style="{ color: getPriorityColor(field.priority) }"
                >
                  {{ field.required ? 'Requerido' : 'Opcional' }}
                </span>
              </div>
              <p class="field-description">{{ field.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Próximos pasos -->
      <div v-if="completenessData.next_steps?.length" class="next-steps-section">
        <h3>Próximos pasos</h3>
        <ul class="next-steps-list">
          <li v-for="step in completenessData.next_steps" :key="step">
            {{ step }}
          </li>
        </ul>
      </div>
      
      <!-- Consejos -->
      <div v-if="completenessData.profile_tips?.length" class="tips-section">
        <h3>Consejos para tu perfil</h3>
        <div class="tips-list">
          <div v-for="tip in completenessData.profile_tips" :key="tip" class="tip-item">
            <i class="bi bi-lightbulb"></i>
            <span>{{ tip }}</span>
          </div>
        </div>
      </div>
      
      <!-- Acciones -->
      <div class="actions-section">
        <button class="btn btn-primary" @click="goToProfile">
          Completar perfil
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.completeness-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.completeness-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 500;
  padding: 0.5rem 0;
  cursor: pointer;
}

.completeness-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.completeness-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.completion-summary {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 2rem;
  align-items: center;
}

.completion-circle {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
}

.completion-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.label {
  font-size: 0.875rem;
  color: #6b7280;
}

.completion-info h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.categories-section,
.missing-fields-section,
.next-steps-section,
.tips-section,
.actions-section {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.categories-section h3,
.missing-fields-section h3,
.next-steps-section h3,
.tips-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.category-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.category-header i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.category-name {
  font-weight: 500;
  color: #1e293b;
}

.category-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.missing-fields-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.missing-field-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: #1e293b;
}

.field-priority {
  font-size: 0.875rem;
  font-weight: 500;
}

.field-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.next-steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.next-steps-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.next-steps-list li::before {
  content: '→';
  color: var(--primary-color);
  font-weight: 600;
  margin-top: 0.125rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f0f9ff;
  border-radius: 0.5rem;
  border-left: 4px solid #0ea5e9;
}

.tip-item i {
  color: #0ea5e9;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.actions-section {
  text-align: center;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--dark-color);
  border-color: var(--dark-color);
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.alert-danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 768px) {
  .completion-summary {
    flex-direction: column;
    text-align: center;
  }
  
  .stats {
    justify-content: center;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>