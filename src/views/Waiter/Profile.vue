<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import authService from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import EditableField from '@/components/EditableField.vue'

export default {
  name: 'WaiterProfileView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const user = ref({
      name: '',
      email: '',
      phone: '',
      avatar: ''
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
        const userData = authService.getUser() || {
          id: '1',
          name: 'Juan Pérez',
          email: 'juan@ejemplo.com',
          phone: '555-123-4567',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
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
        
        const currentUser = authService.getUser()
        if (currentUser) {
          currentUser.name = user.value.name
          currentUser.email = user.value.email
          currentUser.phone = user.value.phone
          if (avatarPreview.value) {
            currentUser.avatar = avatarPreview.value
          }
          authService.setUser(currentUser)
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
        
        await authService.logout()
        
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
      router.push('/waiter')
    }
    
    onMounted(() => {
      loadUserData()
    })
    
    const isEditing = ref(false)
    const skills = ref([
      'Atención al cliente',
      'Trabajo en equipo',
      'Resolución de problemas',
      'Manejo de bandeja',
      'Conocimiento de vinos'
    ])

    const handleUpdate = async (field, value) => {
      console.log(`Actualizando ${field} a ${value}`)
      const formData = new FormData()
      formData.append(field, value)
      
      try {
        await authStore.updateProfile(formData)
      } catch (error) {
        console.error("Fallo al actualizar, la tienda necesita ser corregida.", error)
      }
    }

    return {
      user,
      passwords,
      loading,
      updating,
      error,
      success,
      avatarPreview,
      showDeleteModal,
      deleteConfirmation,
      deleting,
      isPasswordValid,
      doPasswordsMatch,
      isFormValid,
      handleAvatarChange,
      updateProfile,
      deleteAccount,
      goBack,
      isEditing,
      skills,
      handleUpdate
    }
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="card">
            <div class="card-body">
              <h1 class="h3 mb-4">Mi perfil</h1>
              
              <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>
      
              <div v-if="error" class="alert alert-danger">
                {{ error }}
              </div>
        
              <div v-if="loading && !user.name" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            
              <form v-else @submit.prevent="updateProfile">
                <div class="mb-4 text-center">
                  <div class="avatar-container">
                    <img 
                      :src="user.avatar || '/placeholder-avatar.png'" 
                      alt="Avatar" 
                      class="avatar-img"
                    >
                    <div class="avatar-overlay">
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
                  </div>
          </div>
          
                <div class="mb-3">
                  <label for="name" class="form-label">Nombre completo</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="name" 
                    v-model="user.name" 
            required
                    :disabled="updating"
                  >
                </div>
          
                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <input 
            type="email"
                    class="form-control" 
                    id="email" 
                    v-model="user.email" 
            required
                    :disabled="updating"
                  >
                </div>
          
                <div class="mb-3">
                  <label for="phone" class="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    class="form-control" 
                    id="phone" 
                    v-model="user.phone" 
                    :disabled="updating"
          >
      </div>
      
                <hr class="my-4">
                
                <h4 class="h5 mb-3">Cambiar contraseña</h4>
        
                <div class="mb-3">
                  <label for="current-password" class="form-label">Contraseña actual</label>
                  <input 
            type="password"
                    class="form-control" 
                    id="current-password" 
                    v-model="passwords.current" 
                    :disabled="updating"
                  >
                </div>
                
                <div class="mb-3">
                  <label for="new-password" class="form-label">Nueva contraseña</label>
                  <input 
            type="password"
                    class="form-control" 
                    id="new-password" 
                    v-model="passwords.new" 
                    :disabled="updating"
                  >
                  <div class="form-text" v-if="passwords.new && !isPasswordValid">
                    La contraseña debe tener al menos 8 caracteres
                  </div>
                </div>
                
                <div class="mb-4">
                  <label for="confirm-password" class="form-label">Confirmar nueva contraseña</label>
                  <input 
            type="password"
                    class="form-control" 
                    id="confirm-password" 
                    v-model="passwords.confirm" 
                    :disabled="updating"
                  >
                  <div class="form-text" v-if="passwords.confirm && !doPasswordsMatch">
                    Las contraseñas no coinciden
                  </div>
                </div>
          
                <div class="d-flex gap-2 mt-4">
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
                    class="btn btn-outline-secondary"
                    @click="goBack"
                    :disabled="updating"
                  >
                    Cancelar
                  </button>
                </div>
          
                <hr class="my-4">
                
                <div class="text-end">
                  <button 
                    type="button" 
                    class="btn btn-outline-danger"
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
    </div>
      
    <div class="modal" tabindex="-1" :class="{'show d-block': showDeleteModal}">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Eliminar cuenta</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
            
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Al eliminar tu cuenta perderás todo el acceso a tus datos y negocios asociados.
            </div>
            
            <div class="mb-3">
              <label for="confirm-delete" class="form-label">Escribe "ELIMINAR" para confirmar</label>
              <input 
                type="text" 
                class="form-control" 
                id="confirm-delete" 
                v-model="deleteConfirmation"
                :disabled="deleting"
              >
            </div>
          </div>
          <div class="modal-footer">
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
          </div>
        </div>
      </div>
    </div>
    
    <div class="modal-backdrop fade show" v-if="showDeleteModal"></div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: var(--bs-light);
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-edit-btn {
  color: white;
  cursor: pointer;
  font-size: 1.25rem;
}
</style> 