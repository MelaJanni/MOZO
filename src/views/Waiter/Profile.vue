<template>
  <div class="profile-container">
    <div class="profile-header">
      <button class="back-button" @click="goBack">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando perfil...</p>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success">
      {{ success }}
    </div>

    <div v-if="!loading" class="profile-content">
      <!-- Profile Completeness Indicator -->
      <div v-if="!profileCompleteness.is_complete" class="d-none profile-card completeness-card">
        <div class="card-header">
          <h3>Completitud del Perfil</h3>
          <span class="completeness-percentage">{{ profileCompleteness.completion_percentage }}%</span>
        </div>
        <div class="completeness-content">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: profileCompleteness.completion_percentage + '%' }"
            ></div>
          </div>
          <p class="completeness-text">
            {{ profileCompleteness.completed_fields }} de {{ profileCompleteness.total_required_fields }} campos completados
          </p>
          <div v-if="profileCompleteness?.missing_fields?.length" class="missing-fields">
            <p><strong>Campos faltantes:</strong></p>
            <ul>
              <li v-for="field in profileCompleteness.missing_fields" :key="field.field">
                {{ field.label }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Información Personal -->
      <div class="profile-card">
        <div class="card-header">
          <h2>Información Personal</h2>
        </div>
        <div class="profile-main">
          <div class="profile-image-section">
            <ProfileAvatar 
              :src="user.avatar" 
              :alt="`Foto de ${user.display_name}`"
              :editable="true"
              @file-selected="handleAvatarUpdate"
            />
          </div>
          
          <div class="profile-data">
            <div class="data-row">
              <EditableField
                :value="user.display_name"
                @update:value="updateField('display_name', $event)"
                type="text"
                label="Nombre para mostrar"
                placeholder="Tu nombre como mozo"
                :editable="true"
                :has-error="!!validationErrors.display_name"
                :error-message="validationErrors.display_name?.[0]"
              />
            </div>
            
            <div class="data-row">
              <EditableField
                :value="user.birth_date"
                @update:value="updateField('birth_date', $event)"
                type="date"
                label="Fecha de nacimiento"
                :editable="true"
                :has-error="!!validationErrors.birth_date"
                :error-message="validationErrors.birth_date?.[0]"
              />
              <div v-if="calculatedAge" class="age-display">
                Edad: {{ calculatedAge }} años
              </div>
            </div>
            
            <div class="data-row">
              <EditableField
                :value="user.height"
                @update:value="updateField('height', $event)"
                type="number"
                label="Estatura"
                :min="1"
                :max="2.5"
                :step="0.01"
                unit="mt"
                :editable="true"
                :has-error="!!validationErrors.height"
                :error-message="validationErrors.height?.[0]"
              />
            </div>
            
            <div class="data-row">
              <EditableField
                :value="user.weight"
                @update:value="updateField('weight', $event)"
                type="number"
                label="Peso"
                :min="30"
                :max="200"
                unit="kg"
                :editable="true"
                :has-error="!!validationErrors.weight"
                :error-message="validationErrors.weight?.[0]"
              />
            </div>
            
            <div class="data-row">
              <EditableField
                :value="user.gender"
                @update:value="updateField('gender', $event)"
                type="select"
                label="Sexo"
                :options="genderOptions"
                :editable="true"
                :has-error="!!validationErrors.gender"
                :error-message="validationErrors.gender?.[0]"
              />
            </div>
            
            <div class="data-row">
              <EditableField
                :value="user.experience_years"
                @update:value="updateField('experience_years', $event)"
                type="number"
                label="Años de experiencia"
                :min="0"
                :max="50"
                unit="años"
                :editable="true"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Información de Contacto -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Información de Contacto</h3>
        </div>
        <div class="profile-data">
          <div class="data-row">
            <EditableField
              :value="user.current_location"
              @update:value="updateField('current_location', $event)"
              type="text"
              label="Ubicación actual"
              :editable="true"
            />
          </div>
          
          <div class="data-row">
            <EditableField
              :value="user.phone"
              @update:value="updateField('phone', $event)"
              type="tel"
              label="Teléfono"
              :editable="true"
              :has-error="!!validationErrors.phone"
              :error-message="validationErrors.phone?.[0]"
            />
          </div>
          
          <div class="data-row">
            <EditableField
              :value="user.bio"
              @update:value="updateField('bio', $event)"
              type="textarea"
              label="Descripción personal"
              :editable="true"
            />
          </div>
        </div>
      </div>

      <!-- Información Laboral -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Información Laboral</h3>
        </div>
        <div class="profile-data">
          <div class="data-row">
            <EditableField
              :value="user.employment_type"
              @update:value="updateField('employment_type', $event)"
              type="select"
              label="Modalidad"
              :options="employmentTypeOptions"
              :editable="true"
              :has-error="!!validationErrors.employment_type"
              :error-message="validationErrors.employment_type?.[0]"
            />
          </div>
          
          <div class="data-row">
            <EditableField
              :value="user.current_schedule"
              @update:value="updateField('current_schedule', $event)"
              type="text"
              label="Horario de trabajo actual"
              :editable="true"
              :has-error="!!validationErrors.current_schedule"
              :error-message="validationErrors.current_schedule?.[0]"
            />
          </div>
          
          <div class="data-row">
            <div class="availability-toggle">
              <label class="form-label">Disponibilidad</label>
              <div class="toggle-container">
                <input 
                  type="checkbox" 
                  id="availability-toggle" 
                  v-model="user.is_available"
                  @change="updateField('is_available', user.is_available)"
                  class="toggle-input"
                />
                <label for="availability-toggle" class="toggle-label">
                  {{ user.is_available ? 'Disponible' : 'No disponible' }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Habilidades -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Habilidades</h3>
        </div>
        <div class="skills-section">
          <div class="skills-list">
            <span 
              v-for="skill in user.skills" 
              :key="skill" 
              class="skill-tag"
            >
              {{ skill }}
              <button @click="removeSkill(skill)" class="skill-remove">
                <i class="bi bi-x"></i>
              </button>
            </span>
          </div>
          <div class="add-skill">
            <input 
              type="text" 
              placeholder="Agregar habilidad" 
              @keyup.enter="addSkill($event.target.value); $event.target.value = ''"
              class="skill-input"
            />
          </div>
        </div>
      </div>

      <!-- Historial Laboral -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Historial Laboral</h3>
          <BaseButton @click="addWorkExperience" variant="primary" size="sm">
            <i class="bi bi-plus"></i> Agregar Experiencia
          </BaseButton>
        </div>
        <div class="work-history">
          <div 
            v-for="item in workHistory" 
            :key="item.id" 
            class="work-item"
          >
            <div class="work-item-header">
              <h4>{{ item.position }} - {{ item.business_name }}</h4>
              <div class="work-actions">
                <button @click="editWorkExperience(item)" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click="deleteWorkExperience(item.id)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div class="work-details">
              <div class="work-dates">
                {{ item.start_date }}{{ item.end_date ? ' - ' + item.end_date : ' - Actualidad' }}
              </div>
              <div v-if="item.description" class="work-description">
                {{ item.description }}
              </div>
            </div>
          </div>
          
          <div v-if="!workHistory.length" class="empty-state">
            No has agregado experiencia laboral aún.
          </div>
        </div>
      </div>

      <!-- Negocios Asociados -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Negocios Asociados Hoy</h3>
        </div>
        <div class="businesses-list">
          <div 
            v-for="business in associatedBusinesses" 
            :key="business.id" 
            class="business-item detailed"
          >
            <div class="business-main-info">
              <div class="business-name">{{ business.name }}</div>
              <div class="business-code" v-if="business.code">Código: {{ business.code }}</div>
              <div class="business-status" :class="business.status">
                {{ business.is_active ? 'Activo hoy' : 'Inactivo' }}
              </div>
            </div>
            
            <div class="business-stats" v-if="business.is_active">
              <div class="stat-item">
                <span class="stat-label">Mesas asignadas:</span>
                <span class="stat-value">{{ business.assigned_tables || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Llamadas hoy:</span>
                <span class="stat-value">{{ business.calls_today || 0 }}</span>
              </div>
              <div class="stat-item" v-if="business.count !== undefined">
                <span class="stat-label">Total:</span>
                <span class="stat-value">{{ business.count }}</span>
              </div>
              <div class="stat-item" v-if="business.date">
                <span class="stat-label">Fecha:</span>
                <span class="stat-value">{{ new Date(business.date).toLocaleDateString() }}</span>
              </div>
            </div>
            
            <div class="business-actions">
              <button 
                @click="leaveBusiness(business.id, business.name)"
                class="btn btn-sm btn-outline-danger"
                :disabled="updating"
              >
                <i class="bi bi-box-arrow-left"></i>
                Abandonar
              </button>
            </div>
          </div>
          
          <div v-if="!associatedBusinesses.length" class="empty-state">
            No estás asociado a ningún negocio actualmente.
          </div>
        </div>
      </div>

      <!-- Cambiar Contraseña -->
      <div class="profile-card">
        <div class="card-header">
          <h3>Cambiar Contraseña</h3>
        </div>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label>Contraseña actual</label>
            <input 
              type="password" 
              v-model="passwords.current" 
              class="form-control"
              :disabled="updating"
            />
          </div>
          
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input 
              type="password" 
              v-model="passwords.new" 
              class="form-control"
              :disabled="updating"
            />
            <div v-if="passwords.new && !isPasswordValid" class="form-text error">
              La contraseña debe tener al menos 8 caracteres
            </div>
          </div>
          
          <div class="form-group">
            <label>Confirmar nueva contraseña</label>
            <input 
              type="password" 
              v-model="passwords.confirm" 
              class="form-control"
              :disabled="updating"
            />
            <div v-if="passwords.confirm && !doPasswordsMatch" class="form-text error">
              Las contraseñas no coinciden
            </div>
          </div>
          
          <BaseButton 
            type="submit" 
            variant="primary"
            :disabled="updating || !passwords.current || !passwords.new || !passwords.confirm || !isPasswordValid || !doPasswordsMatch"
          >
            <span v-if="updating">Actualizando...</span>
            <span v-else>Cambiar Contraseña</span>
          </BaseButton>
        </form>
      </div>

      <!-- Eliminar Cuenta -->
      <div class="profile-card danger-zone">
        <div class="card-header">
          <h3>Zona de Peligro</h3>
        </div>
        <div class="danger-content">
          <p>Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.</p>
          <BaseButton 
            @click="showDeleteModal = true" 
            variant="danger"
            :disabled="updating"
          >
            Eliminar Cuenta
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modal para Historial Laboral -->
    <BaseModal 
      v-model="showWorkHistoryModal"
      :title="editingWorkItem ? 'Editar Experiencia' : 'Agregar Experiencia'"
      size="md"
    >
      <form @submit.prevent="saveWorkExperience">
        <div class="form-group">
          <label>Nombre del local/empresa</label>
          <input 
            type="text" 
            v-model="newWorkItem.business_name" 
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Cargo</label>
          <input 
            type="text" 
            v-model="newWorkItem.position" 
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Descripción del puesto</label>
          <textarea 
            v-model="newWorkItem.description" 
            class="form-control"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Fecha de ingreso</label>
            <input 
              type="date" 
              v-model="newWorkItem.start_date" 
              class="form-control"
              required
            />
          </div>
          
          <div class="form-group">
            <label>Fecha de salida (opcional)</label>
            <input 
              type="date" 
              v-model="newWorkItem.end_date" 
              class="form-control"
            />
          </div>
        </div>
      </form>
      
      <template #footer>
        <BaseButton @click="showWorkHistoryModal = false" variant="secondary">
          Cancelar
        </BaseButton>
        <BaseButton @click="saveWorkExperience" variant="primary" :disabled="updating">
          <span v-if="updating">Guardando...</span>
          <span v-else>Guardar</span>
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Eliminar Cuenta -->
    <BaseModal 
      v-model="showDeleteModal"
      title="Eliminar Cuenta"
      size="md"
    >
      <div class="delete-account-content">
        <p>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
        
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill"></i>
          Al eliminar tu cuenta perderás todo el acceso a tus datos y negocios asociados.
        </div>
        
        <div class="form-group">
          <label>Escribe "ELIMINAR" para confirmar</label>
          <input 
            type="text" 
            v-model="deleteConfirmation" 
            class="form-control"
            :disabled="deleting"
          />
        </div>
      </div>
      
      <template #footer>
        <BaseButton @click="showDeleteModal = false" variant="secondary" :disabled="deleting">
          Cancelar
        </BaseButton>
        <BaseButton 
          @click="deleteAccount" 
          variant="danger"
          :disabled="deleteConfirmation !== 'ELIMINAR' || deleting"
        >
          <span v-if="deleting">Eliminando...</span>
          <span v-else">Eliminar mi cuenta</span>
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import EditableField from '@/components/EditableField.vue'
import ProfileAvatar from '@/components/ProfileAvatar.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'
import apiService from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const user = ref({
  display_name: '',
  bio: '',
  phone: '',
  birth_date: '',
  height: null,
  weight: null,
  gender: '',
  experience_years: null,
  employment_type: '',
  current_schedule: '',
  current_location: '',
  latitude: null,
  longitude: null,
  availability_hours: [],
  skills: [],
  is_available: true,
  avatar: '',
  business_id: null
})

const workHistory = ref([])
const associatedBusinesses = ref([])

const passwords = ref({
  current: '',
  new: '',
  confirm: ''
})

const loading = ref(true)
const updating = ref(false)
const error = ref('')
const success = ref('')
const avatarPreview = ref(null)
const avatarFile = ref(null)
const validationErrors = ref({})

const showDeleteModal = ref(false)
const deleteConfirmation = ref('')
const deleting = ref(false)

const showWorkHistoryModal = ref(false)
const editingWorkItem = ref(null)
const newWorkItem = ref({
  business_name: '',
  position: '',
  description: '',
  start_date: '',
  end_date: ''
})

const profileCompleteness = ref({
  is_complete: false,
  missing_fields: [],
  completed_fields: 0,
  total_required_fields: 0,
  completion_percentage: 0
})

const isPasswordValid = computed(() => {
  if (!passwords.value.new) return true
  return passwords.value.new.length >= 8
})

const doPasswordsMatch = computed(() => {
  if (!passwords.value.new || !passwords.value.confirm) return true
  return passwords.value.new === passwords.value.confirm
})

const calculatedAge = computed(() => {
  if (!user.value.birth_date) return null
  const birth = new Date(user.value.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
})

const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' }
]

const employmentTypeOptions = [
  { value: 'full-time', label: 'Tiempo completo' },
  { value: 'part-time', label: 'Medio tiempo' },
  { value: 'hourly', label: 'Por horas' },
  { value: 'weekends-only', label: 'Solo fines de semana' }
]

const loadUserData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const businessId = adminStore?.activeBusinessId ?? localStorage.getItem('businessId') ?? null
    const response = await apiService.getActiveUserProfile(businessId ? Number(businessId) : null)
    const profileData = response.data.data.profile_data

    if (profileData) {
      user.value = {
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
        birth_date: profileData.birth_date || '',
        height: profileData.height || null,
        weight: profileData.weight || null,
        gender: profileData.gender || '',
        experience_years: profileData.experience_years || null,
        employment_type: profileData.employment_type || '',
        current_schedule: profileData.current_schedule || '',
        current_location: profileData.current_location || '',
        latitude: profileData.latitude || null,
        longitude: profileData.longitude || null,
        availability_hours: profileData.availability_hours || [],
        skills: profileData.skills || [],
        is_available: profileData.is_available !== undefined ? profileData.is_available : true,
        avatar: profileData.avatar || '',
        business_id: profileData.business_id
      }
    } else {
      // Fallback data if no waiter profile found
      user.value = {
        display_name: 'Mozo',
        bio: '',
        phone: '',
        birth_date: '',
        height: null,
        weight: null,
        gender: '',
        experience_years: null,
        employment_type: '',
        current_schedule: '',
        current_location: '',
        latitude: null,
        longitude: null,
        availability_hours: [],
        skills: [],
        is_available: true,
        avatar: '',
        business_id: null
      }
    }
    
    // Cargar historial laboral
    await loadWorkHistory()
    
    // Cargar negocios asociados
    await loadAssociatedBusinesses()
    
  } catch (err) {
    console.error('Error al cargar datos del usuario:', err)
    error.value = 'No se pudieron cargar tus datos. Por favor, inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

const loadWorkHistory = async () => {
  try {
    //console.log('💼 Cargando historial laboral...')
    const response = await apiService.listWorkHistory()
    //console.log('💼 Respuesta de work-history:', response.data)
    
    // La respuesta contiene items ordenados por fecha más reciente
    workHistory.value = response.data.data.items || []
    //console.log('💼 Historial procesado:', workHistory.value)
  } catch (err) {
    console.error('❌ Error al cargar historial laboral:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    workHistory.value = []
  }
}

const loadAssociatedBusinesses = async () => {
  try {
    console.log('🏪 Cargando negocios asociados activos hoy...')
    const response = await apiService.getWaiterBusinessesActiveToday()
    console.log('🏪 Respuesta de businesses/active-today:', response.data)
    
    associatedBusinesses.value = (response.data.businesses || []).map(business => ({
      id: business.id,
      name: business.name,
      code: business.code,
      status: business.is_active ? 'active' : 'inactive',
      assigned_tables: business.assigned_tables || 0,
      calls_today: business.calls_today || 0,
      count: business.count || 0,
      date: business.date,
      is_active: business.is_active
    }))
    
    console.log('🏪 Negocios procesados:', associatedBusinesses.value)
  } catch (err) {
    console.error('❌ Error al cargar negocios asociados:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    associatedBusinesses.value = []
  }
}

const handleAvatarUpdate = async (file) => {
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'La imagen no puede ser mayor a 2MB'
    return
  }
  
  try {
    updating.value = true
    
    const formData = new FormData()
    
    if (user.value.display_name) formData.append('display_name', user.value.display_name)
    if (user.value.bio) formData.append('bio', user.value.bio)
    if (user.value.phone) formData.append('phone', user.value.phone)
    if (user.value.birth_date) formData.append('birth_date', user.value.birth_date)
    if (user.value.height) formData.append('height', user.value.height)
    if (user.value.weight) formData.append('weight', user.value.weight)
    if (user.value.gender) formData.append('gender', user.value.gender)
    if (user.value.experience_years) formData.append('experience_years', user.value.experience_years)
    if (user.value.employment_type) formData.append('employment_type', user.value.employment_type)
    if (user.value.current_schedule) formData.append('current_schedule', user.value.current_schedule)
    if (user.value.current_location) formData.append('current_location', user.value.current_location)
    if (user.value.latitude) formData.append('latitude', user.value.latitude)
    if (user.value.longitude) formData.append('longitude', user.value.longitude)
    
    formData.append('availability_hours', JSON.stringify(user.value.availability_hours || []))
    formData.append('skills', JSON.stringify(user.value.skills || []))
    formData.append('is_available', user.value.is_available ? '1' : '0')
    formData.append('avatar', file)
    
    const response = await apiService.updateWaiterUserProfile(formData)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      user.value.profile_picture = e.target.result
    }
    reader.readAsDataURL(file)
    
    success.value = response.data.message || 'Foto de perfil actualizada'
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      validationErrors.value = err.response.data.errors
      error.value = err.response.data.message || 'Por favor, corrige los errores en el formulario'
    } else {
      error.value = err.response?.data?.message || 'Error al subir la imagen'
    }
  } finally {
    updating.value = false
    
    if (!error.value) {
      await loadUserData()
      await checkProfileCompleteness()
    }
  }
}

const updateField = async (field, value) => {
  try {
    updating.value = true
    validationErrors.value = {}
    error.value = ''
    
    user.value[field] = value
    
    const formData = new FormData()
    formData.append(field, value || '')
    
    const response = await apiService.updateWaiterUserProfile(formData)
    
    if (response.data.data) {
      user.value.avatar = response.data.data.avatar
      user.value.display_name = response.data.data.display_name
    }
    
    success.value = response.data.message || 'Campo actualizado correctamente'
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      validationErrors.value = err.response.data.errors
      error.value = err.response.data.message || 'Por favor, corrige los errores en el formulario'
    } else {
      error.value = err.response?.data?.message || `Error al actualizar ${field}`
    }
  } finally {
    updating.value = false
    
    if (!error.value) {
      await loadUserData()
      await checkProfileCompleteness()
    }
  }
}

const checkProfileCompleteness = async () => {
  try {
    const response = await apiService.getProfileCompleteness()
    profileCompleteness.value = response.data
  } catch (err) {
    console.error('Error checking profile completeness:', err)
  }
}

const changePassword = async () => {
  if (!passwords.value.current || !passwords.value.new || !passwords.value.confirm) {
    error.value = 'Por favor completa todos los campos de contraseña'
    return
  }
  
  if (!isPasswordValid.value || !doPasswordsMatch.value) {
    error.value = 'Verifica que la contraseña sea válida y coincida'
    return
  }
  
  try {
    updating.value = true
    
    await apiService.changePassword({
      current_password: passwords.value.current,
      password: passwords.value.new,
      password_confirmation: passwords.value.confirm
    })
    
    passwords.value.current = ''
    passwords.value.new = ''
    passwords.value.confirm = ''
    
    success.value = 'Contraseña actualizada correctamente'
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    updating.value = false
  }
}

const addWorkExperience = () => {
  editingWorkItem.value = null
  newWorkItem.value = {
    business_name: '',
    position: '',
    description: '',
    start_date: '',
    end_date: ''
  }
  showWorkHistoryModal.value = true
}

const editWorkExperience = (item) => {
  editingWorkItem.value = item
  newWorkItem.value = { ...item }
  showWorkHistoryModal.value = true
}

const saveWorkExperience = async () => {
  try {
    updating.value = true
    
    const workData = {
      business_name: newWorkItem.value.business_name,
      position: newWorkItem.value.position,
      description: newWorkItem.value.description || '',
      start_date: newWorkItem.value.start_date,
      end_date: newWorkItem.value.end_date || null
    }
    
    if (editingWorkItem.value) {
      const response = await apiService.updateWorkHistory(editingWorkItem.value.id, workData)
      
      const index = workHistory.value.findIndex(item => item.id === editingWorkItem.value.id)
      if (index !== -1) {
        workHistory.value[index] = response.data
      }
    } else {
      const response = await apiService.addWorkHistory(workData)
      workHistory.value.push(response.data)
    }
    
    showWorkHistoryModal.value = false
    success.value = editingWorkItem.value ? 'Experiencia actualizada correctamente' : 'Experiencia agregada correctamente'
  } catch (err) {
    console.error('Error al guardar experiencia laboral:', err)
    error.value = err.response?.data?.message || 'Error al guardar experiencia laboral'
  } finally {
    updating.value = false
  }
}

const deleteWorkExperience = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta experiencia laboral?')) {
    return
  }
  
  try {
    updating.value = true
    
    await apiService.deleteWorkHistory(id)
    
    workHistory.value = workHistory.value.filter(item => item.id !== id)
    success.value = 'Experiencia eliminada correctamente'
  } catch (err) {
    console.error('Error al eliminar experiencia:', err)
    error.value = err.response?.data?.message || 'Error al eliminar experiencia'
  } finally {
    updating.value = false
  }
}

const addSkill = (skill) => {
  if (skill && !user.value.skills.includes(skill)) {
    user.value.skills.push(skill)
    updateField('skills', user.value.skills)
  }
}

const removeSkill = (skill) => {
  user.value.skills = user.value.skills.filter(s => s !== skill)
  updateField('skills', user.value.skills)
}

const leaveBusiness = async (businessId, businessName) => {
  if (!confirm(`¿Estás seguro de que deseas abandonar el negocio "${businessName}"?`)) {
    return
  }
  
  try {
    updating.value = true
    console.log('🚪 Abandonando negocio:', { businessId, businessName })
    
    const response = await apiService.leaveBusinessAsWaiter({
      business_id: businessId
    })
    
    console.log('🚪 Respuesta de leave-business:', response.data)
    
    await loadAssociatedBusinesses()
    success.value = `Has abandonado el negocio "${businessName}" correctamente`
  } catch (err) {
    console.error('❌ Error al abandonar negocio:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    error.value = err.response?.data?.message || 'Error al abandonar el negocio'
  } finally {
    updating.value = false
  }
}

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'ELIMINAR') return
  
  deleting.value = true
  
  try {
    await apiService.deleteAccount({ password: passwords.value.current })
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (err) {
    console.error('Error al eliminar cuenta:', err)
    error.value = err.response?.data?.message || 'No se pudo eliminar la cuenta. Por favor, inténtalo de nuevo.'
    showDeleteModal.value = false
    deleteConfirmation.value = ''
    deleting.value = false
  }
}

const goBack = () => {
  router.push({ name: 'waiter-dashboard' })
}

onMounted(() => {
  loadUserData()
  checkProfileCompleteness()
})

const route = useRoute()
onBeforeRouteUpdate((to, from) => {
  loadUserData()
  checkProfileCompleteness()
})

// Clear alerts after 5 seconds
watch(success, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      success.value = ''
    }, 5000)
  }
})

watch(error, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      error.value = ''
    }, 8000)
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1rem;
  padding-top: 80px;
}

.profile-header {
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

.loading-container {
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

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.alert-danger {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.alert-success {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.profile-card.danger-zone {
  border: 1px solid #fee2e2;
}

.profile-card.completeness-card {
  border: 1px solid #fef3c7;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.completeness-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.completeness-percentage {
  font-size: 1.25rem;
  font-weight: 700;
  color: #92400e;
  background: #fbbf24;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  transition: width 0.3s ease;
}

.completeness-text {
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
}

.missing-fields {
  background: rgba(251, 191, 36, 0.1);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fcd34d;
}

.missing-fields ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: #92400e;
}

.missing-fields li {
  margin-bottom: 0.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
}

.card-header h2, .card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.profile-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-image-section {
  display: flex;
  justify-content: center;
}

.profile-data {
  display: flex;
  flex-direction: column;
}

.data-row {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.data-row:last-child {
  border-bottom: none;
}

.age-display {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.skills-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  background-color: #6A3FEA;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.skill-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.skill-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
}

.skill-input:focus {
  outline: none;
  border-color: #6A3FEA;
  box-shadow: 0 0 0 2px rgba(106, 63, 234, 0.2);
}

.work-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.work-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.work-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.work-item-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.work-actions {
  display: flex;
  gap: 0.5rem;
}

.work-dates {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.work-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.work-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.employment-status {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.employment-type {
  background-color: #f3e8ff;
  color: #7c3aed;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.hourly-rate {
  background-color: #dcfce7;
  color: #16a34a;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.last-activity {
  font-size: 0.8rem;
  color: #9ca3af;
}

.work-description {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
  margin-top: 0.5rem;
}

.businesses-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.business-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.business-item:last-child {
  margin-bottom: 0;
}

.business-item.detailed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.business-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.business-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1e293b;
}

.business-code {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.business-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  width: fit-content;
}

.business-status.active {
  background-color: #dcfce7;
  color: #15803d;
}

.business-status.inactive {
  background-color: #fee2e2;
  color: #dc2626;
}

.business-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.business-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-style: italic;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #6A3FEA;
  box-shadow: 0 0 0 2px rgba(106, 63, 234, 0.2);
}

.form-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-text.error {
  color: #dc2626;
}

.danger-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.danger-content p {
  color: #6b7280;
  margin: 0;
}

.delete-account-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s, border-color 0.2s;
  border: 1px solid transparent;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn-outline-primary {
  background-color: transparent;
  border-color: #6A3FEA;
  color: #6A3FEA;
}

.btn-outline-primary:hover {
  background-color: #6A3FEA;
  color: white;
}

.btn-outline-danger {
  background-color: transparent;
  border-color: #dc2626;
  color: #dc2626;
}

.btn-outline-danger:hover {
  background-color: #dc2626;
  color: white;
}

.availability-toggle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.availability-toggle .form-label {
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-input {
  width: 1rem;
  height: 1rem;
  accent-color: #6A3FEA;
  cursor: pointer;
}

.toggle-label {
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  margin: 0;
}

@media (min-width: 768px) {
  .profile-container {
    padding: 2rem;
    padding-top: 80px;
  }
  
  .profile-main {
    flex-direction: row;
    align-items: flex-start;
    gap: 2rem;
  }
  
  .profile-image-section {
    flex-shrink: 0;
  }
  
  .profile-data {
    flex: 1;
  }
  
  .form-row {
    flex-direction: row;
  }
}

@media (min-width: 992px) {
  .profile-content {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>