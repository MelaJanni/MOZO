<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'
import ProfileAvatar from '@/components/ProfileAvatar.vue'
import EditableField from '@/components/EditableField.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import SendNotificationModal from '@/components/UI/SendNotificationModal.vue'
import apiService from '@/services/api'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const staffId = route.params.id
const isLoading = ref(false)
const error = ref('')
const employee = ref(null)
const showDeleteModal = ref(false)
const showAddReviewModal = ref(false)
const confirmDeleteText = ref('')
const newReview = ref({
  rating: 5,
  comment: ''
})
const isSaving = ref(false)
const showNotificationModal = ref(false)
const isSendingNotification = ref(false)
const fieldMap = {
  experience: 'experience_years',
  seniority: 'seniority_years',
  schedule: 'employment_type',
  currentSchedule: 'current_schedule',
};
onMounted(async () => {
  isLoading.value = true
  error.value = ''
  try {
    const employeeData = await adminStore.fetchStaffMember(staffId)
    employee.value = employeeData
  } catch (err) {
    error.value = err.message || 'Error al cargar datos del empleado'
  } finally {
    isLoading.value = false
  }
})
const deleteStaffMember = async () => {
  if (confirmDeleteText.value !== 'DESVINCULAR') return
  isLoading.value = true
  error.value = ''
  try {
    await adminStore.removeStaff(staffId)
    router.push('/admin/staff')
  } catch (err) {
    error.value = err.message || 'Error al eliminar al miembro del personal'
  } finally {
    isLoading.value = false
    showDeleteModal.value = false
  }
}
const updateEmployeeData = async (field, value) => {
  if (!employee.value) return;
  isSaving.value = true;
  const backendField = fieldMap[field] || field;
  try {
    await adminStore.updateStaffMember(staffId, { [backendField]: value });
    employee.value[backendField] = value;
    employee.value[field] = value;
    if (field === 'birth_date') {
      const dateObj = new Date(value);
      const display = dateObj.toLocaleDateString('es-ES');
      employee.value.birthdate_formatted = display;
    }
    if (field === 'hire_date') {
      const dateObj = new Date(value);
      const display = dateObj.toLocaleDateString('es-ES');
      employee.value.hire_date_formatted = display;
    }
  } catch (err) {
    error.value = err.message || `Error al actualizar ${field}`;
  } finally {
    isSaving.value = false;
  }
};
const handleAvatarUpdate = async (file) => {
  if (!file) return;
  try {
    isSaving.value = true;
    const formData = new FormData();
    formData.append('avatar', file);
    await adminStore.updateStaffMember(staffId, formData, true); // pass flag multipart
    const reader = new FileReader();
    reader.onload = (e) => {
      if (employee.value) employee.value.avatar_url = e.target.result;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    error.value = err.message || 'Error al subir avatar';
  } finally {
    isSaving.value = false;
  }
}
const deleteReview = async (reviewId) => {
  if (!employee.value) return
  try {
    isSaving.value = true
    await adminStore.deleteReview(staffId, reviewId)
    employee.value.reviews = employee.value.reviews.filter(r => r.id !== reviewId)
  } catch (err) {
    error.value = err.message || 'Error al eliminar reseña'
  } finally {
    isSaving.value = false
  }
}
const addReview = async () => {
  if (!employee.value || !newReview.value.comment) return
  try {
    isSaving.value = true
    const addedReview = await adminStore.addReview(staffId, newReview.value)
    employee.value.reviews.push(addedReview)
    newReview.value = { rating: 5, comment: '' }
    showAddReviewModal.value = false
  } catch (err) {
    error.value = err.message || 'Error al agregar reseña'
  } finally {
    isSaving.value = false
  }
}
const openWhatsApp = () => {
  if (employee.value && employee.value.phone) {
    const cleanPhone = employee.value.phone.replace(/[^0-9]/g, '')
    const message = encodeURIComponent('Hola, te contacto desde la app MOZO.')
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }
}
const openEmail = () => {
  if (employee.value && employee.value.email) {
    const subject = encodeURIComponent('Contacto desde app MOZO')
    const body = encodeURIComponent('Hola, te contacto desde la app MOZO.')
    window.open(`mailto:${employee.value.email}?subject=${subject}&body=${body}`, '_blank')
  }
}
const goBack = () => {
  router.push('/admin/staff')
}
const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' }
]
const positionOptions = [
  { value: 'Gerente', label: 'Gerente' },
  { value: 'Mozo', label: 'Mozo' },
  { value: 'Cajero', label: 'Cajero' },
  { value: 'Cocinero', label: 'Cocinero' },
  { value: 'Limpieza', label: 'Limpieza' }
]
const scheduleOptions = [
  { value: 'full-time', label: 'Tiempo completo' },
  { value: 'part-time', label: 'Medio tiempo' },
  { value: 'hourly', label: 'Por horas' },
  { value: 'weekends-only', label: 'Solo fines de semana' }
]
const openAddReviewModal = () => {
  showAddReviewModal.value = true
}
const averageRating = computed(() => {
  if (!employee.value || !employee.value.reviews.length) return 0
  const sum = employee.value.reviews.reduce((total, review) => total + review.rating, 0)
  return (sum / employee.value.reviews.length).toFixed(1)
})
const sortedReviews = computed(() => {
  if (!employee.value || !employee.value.reviews.length) return []
  return [...employee.value.reviews].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })
})
const calculatedAge = computed(() => {
  if (!employee.value || !employee.value.birth_date) return null;
  const birth = new Date(employee.value.birth_date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});
const sendNotification = async (formData) => {
  isSendingNotification.value = true
  try {
    const dataToSend = {
      user_id: employee.value.user.id,
      title: formData.title,
      body: formData.body
    }
    const response = await apiService.sendPushToUser(dataToSend)
    showSuccessToast(response.message || 'Notificación enviada con éxito')
    showNotificationModal.value = false
  } catch (error) {
    showErrorToast(error.response?.data?.message || 'Error al enviar la notificación')
  } finally {
    isSendingNotification.value = false
  }
}
const openConfirmDeleteModal = () => {
  showDeleteModal.value = true
}
const deleteStaff = async () => {
  if (confirmDeleteText.value !== 'DESVINCULAR') return
  isLoading.value = true
  error.value = ''
  try {
    await adminStore.removeStaff(staffId)
    router.push('/admin/staff')
  } catch (err) {
    error.value = err.message || 'Error al eliminar al miembro del personal'
  } finally {
    isLoading.value = false
    showDeleteModal.value = false
  }
}
</script>
<template>
  <div class="staff-detail-container">
    <div class="staff-header">
      <button class="back-button" @click="goBack">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando datos del empleado...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <BaseButton @click="$router.go(0)" variant="primary">
        Reintentar
      </BaseButton>
    </div>
    <div v-else-if="employee" class="staff-detail-content">
      <div class="profile-card">
        <div class="profile-header">
          <ProfileAvatar 
            :src="employee.avatar_url" 
            :alt="`Foto de ${employee.name}`"
            :editable="false"
          />
          <div class="profile-name-container">
            <EditableField
              :value="employee.name"
              @update:value="updateEmployeeData('name', $event)"
              type="text"
              placeholder="Nombre completo"
              :editable="false"
              class="profile-name"
            />
          </div>
        </div>
        <div class="profile-data">
          <div class="data-row">
            <EditableField
              :value="employee.birth_date"
              :display-value="employee.birthdate_formatted"
              label="Fecha de nacimiento"
              @update:value="updateEmployeeData('birth_date', $event)"
              type="date"
              :editable="false"
            />
            <div v-if="calculatedAge" class="text-muted" style="font-size:0.875rem">Edad: {{ calculatedAge }} años</div>
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.height"
              label="Estatura"
              @update:value="updateEmployeeData('height', $event)"
              type="number"
              :min="1"
              :max="2.5"
              :step="0.01"
              unit="mt"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.weight"
              label="Peso"
              @update:value="updateEmployeeData('weight', $event)"
              type="number"
              :min="30"
              :max="200"
              unit="kg"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.gender"
              label="Sexo"
              @update:value="updateEmployeeData('gender', $event)"
              type="select"
              :options="genderOptions"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.experience_years"
              label="Años de experiencia"
              @update:value="updateEmployeeData('experience', $event)"
              type="number"
              :min="0"
              :max="50"
              unit="años"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.seniority_years"
              label="Antigüedad"
              @update:value="updateEmployeeData('seniority', $event)"
              type="number"
              :min="0"
              :max="50"
              unit="años de antigüedad"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.email"
              label="Email"
              @update:value="updateEmployeeData('email', $event)"
              type="text"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.phone"
              label="Teléfono"
              @update:value="updateEmployeeData('phone', $event)"
              type="text"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.hire_date"
              :display-value="employee.hire_date_formatted"
              label="Fecha de contratación"
              @update:value="updateEmployeeData('hire_date', $event)"
              type="date"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.position"
              label="Cargo"
              @update:value="updateEmployeeData('position', $event)"
              type="select"
              :options="positionOptions"
              :editable="true"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.salary"
              label="Salario"
              @update:value="updateEmployeeData('salary', $event)"
              type="number"
              :min="0"
              :step="0.01"
              unit="$"
              :editable="true"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.notes"
              label="Notas"
              @update:value="updateEmployeeData('notes', $event)"
              type="textarea"
              :editable="true"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.education"
              label="Condición"
              @update:value="updateEmployeeData('education', $event)"
              type="text"
              :editable="true"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.employment_type"
              label="Modalidad"
              @update:value="updateEmployeeData('schedule', $event)"
              type="select"
              :options="scheduleOptions"
              :editable="false"
            />
          </div>
          <div class="data-row">
            <EditableField
              :value="employee.current_schedule"
              label="Horario actual"
              @update:value="updateEmployeeData('currentSchedule', $event)"
              type="text"
              :editable="false"
            />
          </div>
        </div>
        <div class="profile-actions">
          <BaseButton 
            variant="primary" 
            @click="$router.push(`/admin/staff/${staffId}/history`)"
            class="action-button d-none"
          >
            Ver historial
          </BaseButton>
          <BaseButton 
            variant="secondary" 
            @click="openWhatsApp"
            class="action-button"
            :disabled="!employee.phone"
          >
            <i class="bi bi-whatsapp"></i> WhatsApp
          </BaseButton>
          <BaseButton 
            v-if="!employee.phone && employee.email"
            variant="secondary" 
            @click="openEmail"
            class="action-button"
          >
            <i class="bi bi-envelope"></i> Enviar Correo
          </BaseButton>
          <BaseButton 
            variant="danger" 
            @click="openConfirmDeleteModal"
            class="action-button"
          >
            <i class="bi bi-person-dash"></i> Desvincular
          </BaseButton>
        </div>
      </div>
      <div class="reviews-section d-none">
        <div class="reviews-header">
          <h2 class="section-title">Reseñas</h2>
          <div class="average-rating">
            <div class="stars-container">
              <i 
                v-for="star in 5" 
                :key="star" 
                class="bi" 
                :class="star <= Math.round(employee.rating) ? 'bi-star-fill' : 'bi-star'"
              ></i>
            </div>
            <span class="rating-text">{{ averageRating }}</span>
          </div>
          <div class="add-review-buttons">
            <BaseButton @click="openAddReviewModal" variant="primary" class="add-review-button">
              <i class="bi bi-plus-lg"></i> Añadir reseña
            </BaseButton>
            <BaseButton @click="openWhatsApp" variant="secondary">
              <i class="bi bi-whatsapp"></i> Contactar
            </BaseButton>
          </div>
        </div>
        <div v-if="!sortedReviews.length" class="empty-reviews">
          <p>No hay reseñas todavía.</p>
        </div>
        <div v-else class="reviews-list">
          <ReviewCard
            v-for="review in sortedReviews"
            :key="review.id"
            :review="review"
            :can-delete="true"
            @delete="deleteReview"
          />
        </div>
      </div>
    </div>
    <BaseModal 
      v-model="showDeleteModal" 
      title="Desvincular empleado" 
      size="md"
    >
      <div class="confirm-content">
        <p>¿Estás seguro de que deseas desvincular a {{ employee?.name }} del personal?</p>
        <p class="confirm-warning">Esta acción no se puede deshacer.</p>
        <div class="confirm-input">
          <label for="confirm-text">Escribe "DESVINCULAR" para confirmar</label>
          <input 
            type="text" 
            id="confirm-text" 
            v-model="confirmDeleteText" 
            class="form-control"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showDeleteModal = false">
          Cancelar
        </button>
        <button 
          class="btn btn-danger" 
          @click="deleteStaffMember" 
          :disabled="confirmDeleteText !== 'DESVINCULAR'"
        >
          Desvincular
        </button>
      </template>
    </BaseModal>
    <BaseModal
      v-model="showAddReviewModal"
      title="Añadir nueva reseña"
      size="md"
    >
      <div class="add-review-form">
        <div class="rating-input">
          <label>Calificación</label>
          <div class="star-rating">
            <button 
              v-for="star in 5" 
              :key="star"
              type="button"
              class="star-button"
              :class="{ active: star <= newReview.rating }"
              @click="newReview.rating = star"
            >
              <i class="bi" :class="star <= newReview.rating ? 'bi-star-fill' : 'bi-star'"></i>
            </button>
          </div>
        </div>
        <div class="comment-input">
          <label for="review-comment">Comentario</label>
          <textarea
            id="review-comment"
            v-model="newReview.comment"
            rows="4"
            placeholder="Escribe tu comentario aquí..."
            class="form-control"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showAddReviewModal = false"
        >
          Cancelar
        </button>
        <button 
          class="btn btn-primary" 
          @click="addReview"
          :disabled="!newReview.comment || isSaving"
        >
          <span v-if="isSaving">Guardando...</span>
          <span v-else>Guardar reseña</span>
        </button>
      </template>
    </BaseModal>
    <SendNotificationModal
      v-model="showNotificationModal"
      :loading="isSendingNotification"
      @submit="sendNotification"
    />
  </div>
</template>
<style scoped>
.staff-detail-container {
  background-color: #f9fafb;
  min-height: 100vh;
  padding: 1rem;
  padding-top: 80px; /* Espacio para el navbar fijo */
}
.staff-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}
.back-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #6A3FEA;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
}
.back-button i {
  margin-right: 0.5rem;
}
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(106, 63, 234, 0.3);
  border-radius: 50%;
  border-top-color: #6A3FEA;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.staff-detail-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
.profile-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  text-align: center;
}
.profile-name-container {
  margin-top: 1rem;
  width: 100%;
}
.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}
.profile-data {
  margin-bottom: 1.5rem;
}
.data-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.data-row:last-child {
  border-bottom: none;
}
.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.action-button {
  width: 100%;
}
.reviews-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}
.reviews-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.average-rating {
  display: flex;
  align-items: center;
}
.stars-container {
  display: flex;
  margin-right: 0.5rem;
}
.stars-container i {
  color: #FFD700;
  margin-right: 2px;
}
.rating-text {
  font-weight: 600;
  font-size: 1.125rem;
}
.empty-reviews {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}
.add-review-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.rating-input, .comment-input {
  margin-bottom: 1rem;
}
.rating-input label, .comment-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.star-rating {
  display: flex;
  gap: 0.25rem;
}
.star-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ccc;
  cursor: pointer;
  padding: 0.25rem;
}
.star-button.active, .star-button:hover {
  color: #FFD700;
}
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
}
.form-control:focus {
  border-color: #6A3FEA;
  box-shadow: 0 0 0 2px rgba(106, 63, 234, 0.2);
  outline: none;
}
.add-review-buttons {
  display: flex;
  gap: 0.75rem;
}
@media (min-width: 768px) {
  .staff-detail-container {
    padding: 2rem;
    padding-top: 80px;
  }
  .profile-header {
    flex-direction: row;
    text-align: left;
    gap: 1.5rem;
  }
  .profile-name-container {
    margin-top: 0;
  }
  .profile-actions {
    flex-direction: row;
  }
  .action-button {
    width: auto;
  }
  .reviews-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
@media (min-width: 992px) {
  .staff-detail-content {
    grid-template-columns: 1fr 1fr;
  }
  .profile-card {
    height: fit-content;
  }
}
</style> 