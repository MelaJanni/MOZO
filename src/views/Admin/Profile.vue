<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = ref({
  name: '',
  email: '',
  phone: '',
  avatar: '',
  role: 'admin',
  business: {
    name: '',
    code: ''
  }
})

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

const showDeleteModal = ref(false)
const deleteConfirmation = ref('')
const deleting = ref(false)

const isPasswordValid = computed(() => {
  if (!passwords.value.new) return true
  return passwords.value.new.length >= 8
})

const doPasswordsMatch = computed(() => {
  if (!passwords.value.new || !passwords.value.confirm) return true
  return passwords.value.new === passwords.value.confirm
})

const isFormValid = computed(() => {
  if (!user.value.name || !user.value.email) return false
  
  if (passwords.value.current || passwords.value.new || passwords.value.confirm) {
    return passwords.value.current && isPasswordValid.value && doPasswordsMatch.value
  }
  
  return true
})

const loadUserData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const userData = authStore.getUser() || {
      id: '1',
      name: 'Administrador',
      email: 'admin@ejemplo.com',
      phone: '555-987-6543',
      avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
      role: 'admin',
      business: {
        name: 'Mi Restaurante',
        code: 'FGT-464'
      }
    }
    
    user.value = { ...userData }
  } catch (err) {
    console.error('Error al cargar datos del usuario:', err)
    error.value = 'No se pudieron cargar tus datos. Por favor, inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen no puede ser mayor a 5MB'
    return
  }
  
  avatarFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const updateProfile = async () => {
  if (!isFormValid.value) return
  
  updating.value = true
  error.value = ''
  success.value = ''
  
  try {
    const formData = new FormData()
    formData.append('name', user.value.name)
    formData.append('email', user.value.email)
    formData.append('phone', user.value.phone || '')
    
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }
    
    if (passwords.value.current && passwords.value.new) {
      formData.append('current_password', passwords.value.current)
      formData.append('password', passwords.value.new)
      formData.append('password_confirmation', passwords.value.confirm)
    }
    
    console.log('Perfil actualizado:', {
      name: user.value.name,
      email: user.value.email,
      phone: user.value.phone,
      passwordChanged: !!passwords.value.current,
      avatarChanged: !!avatarFile.value
    })
    
    const currentUser = authStore.getUser()
    if (currentUser) {
      currentUser.name = user.value.name
      currentUser.email = user.value.email
      currentUser.phone = user.value.phone
      if (avatarPreview.value) {
        currentUser.avatar = avatarPreview.value
      }
      authStore.setUser(currentUser)
    }
    
    passwords.value.current = ''
    passwords.value.new = ''
    passwords.value.confirm = ''
    
    avatarFile.value = null
    
    success.value = 'Perfil actualizado correctamente'
  } catch (err) {
    console.error('Error al actualizar perfil:', err)
    error.value = err.response?.data?.message || 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.'
  } finally {
    updating.value = false
  }
}

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'ELIMINAR') return
  
  deleting.value = true
  
  try {
    console.log('Cuenta eliminada')
    
    await authStore.logout()
    
    router.push('/login')
  } catch (err) {
    console.error('Error al eliminar cuenta:', err)
    error.value = err.response?.data?.message || 'No se pudo eliminar la cuenta. Por favor, inténtalo de nuevo.'
    showDeleteModal.value = false
    deleteConfirmation.value = ''
    deleting.value = false
  }
}

const goBack = () => {
  router.push('/admin')
}

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-header">
      <button class="back-button" @click="goBack">
        ← Volver
      </button>
    </div>
    
    <div v-if="loading && !user.name" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando datos del perfil...</p>
    </div>
    
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <div v-if="success" class="alert alert-success">
      {{ success }}
    </div>
    
    <div v-if="!loading || user.name" class="profile-content">
      <div class="profile-card">
        <div class="profile-main">
          <div class="profile-image-container">
            <img 
              :src="avatarPreview || user.avatar || '/placeholder-avatar.png'" 
              alt="Foto de perfil"
              class="profile-image"
            />
            <label for="avatar-upload" class="avatar-edit-btn">
              <i class="bi bi-camera"></i>
            </label>
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              class="visually-hidden"
              @change="handleAvatarChange"
            >
          </div>
          
          <div class="profile-info">
            <form @submit.prevent="updateProfile">
              <div class="form-group">
                <label for="name">Nombre completo</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="user.name" 
                  class="form-control"
                  required
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="email">Correo electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="user.email" 
                  class="form-control"
                  required
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="phone">Teléfono</label>
                <input 
                  type="tel" 
                  id="phone" 
                  v-model="user.phone" 
                  class="form-control"
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="business-name">Nombre del negocio</label>
                <input 
                  type="text" 
                  id="business-name" 
                  v-model="user.business.name" 
                  class="form-control"
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="business-code">Código del negocio</label>
                <input 
                  type="text" 
                  id="business-code" 
                  v-model="user.business.code" 
                  class="form-control"
                  disabled
                />
              </div>
              
              <div class="profile-divider">
                <h3>Cambiar contraseña</h3>
              </div>
              
              <div class="form-group">
                <label for="current-password">Contraseña actual</label>
                <input 
                  type="password" 
                  id="current-password" 
                  v-model="passwords.current" 
                  class="form-control"
                  :disabled="updating"
                />
              </div>
              
              <div class="form-group">
                <label for="new-password">Nueva contraseña</label>
                <input 
                  type="password" 
                  id="new-password" 
                  v-model="passwords.new" 
                  class="form-control"
                  :disabled="updating"
                />
                <div class="form-text" v-if="passwords.new && !isPasswordValid">
                  La contraseña debe tener al menos 8 caracteres
                </div>
              </div>
              
              <div class="form-group">
                <label for="confirm-password">Confirmar nueva contraseña</label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  v-model="passwords.confirm" 
                  class="form-control"
                  :disabled="updating"
                />
                <div class="form-text" v-if="passwords.confirm && !doPasswordsMatch">
                  Las contraseñas no coinciden
                </div>
              </div>
              
              <div class="profile-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="updating || !isFormValid"
                >
                  <span v-if="updating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardar cambios
                </button>
                
                <button 
                  type="button" 
                  class="btn btn-danger"
                  @click="showDeleteModal = true"
                  :disabled="updating"
                >
                  Eliminar cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <BaseModal 
      v-model="showDeleteModal" 
      title="Eliminar cuenta" 
      size="md"
    >
      <div class="confirm-content">
        <p>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
        
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Al eliminar tu cuenta perderás todo el acceso a tus datos y negocios asociados.
        </div>
        
        <div class="confirm-input">
          <label for="confirm-delete">Escribe "ELIMINAR" para confirmar</label>
          <input 
            type="text" 
            class="form-control" 
            id="confirm-delete" 
            v-model="deleteConfirmation"
            :disabled="deleting"
          >
        </div>
      </div>
      
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showDeleteModal = false" :disabled="deleting">
          Cancelar
        </button>
        <button 
          type="button" 
          class="btn btn-danger" 
          @click="deleteAccount"
          :disabled="deleteConfirmation !== 'ELIMINAR' || deleting"
        >
          <span v-if="deleting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Eliminar mi cuenta
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
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
  to {
    transform: rotate(360deg);
  }
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.profile-main {
  display: flex;
  gap: 2rem;
}

.profile-image-container {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: var(--primary-color);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.profile-info {
  flex-grow: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4b5563;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.25);
}

.form-text {
  font-size: 0.875rem;
  color: var(--danger-color);
  margin-top: 0.25rem;
}

.profile-divider {
  margin: 2rem 0;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.profile-divider h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.profile-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--dark-color);
  border-color: var(--dark-color);
}

.btn-danger {
  background-color: white;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--danger-color);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.alert-success {
  background-color: #dcfce7;
  color: #15803d;
}

.confirm-content {
  padding: 1rem 0;
}

.confirm-input {
  margin-top: 1.5rem;
}

.confirm-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .profile-main {
    flex-direction: column;
    align-items: center;
  }
  
  .profile-image-container {
    margin-bottom: 2rem;
  }
  
  .profile-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .profile-actions button {
    width: 100%;
  }
}
</style> 