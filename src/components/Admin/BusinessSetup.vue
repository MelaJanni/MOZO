<template>
  <div class="business-setup-container">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow-sm">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <i class="bi bi-building text-primary" style="font-size: 3rem;"></i>
                <h2 class="mt-3">¡Bienvenido!</h2>
                <p class="text-muted">Para comenzar, necesitas configurar tu negocio</p>
              </div>
              
              <!-- Opciones de configuración -->
              <div class="d-grid gap-3">
                <button 
                  class="btn btn-primary btn-lg d-flex align-items-center justify-content-center"
                  @click="showCreateForm = true"
                  :disabled="isLoading"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Negocio
                </button>
                
                <!-- Opción oculta por el momento -->
                <button 
                  class="btn btn-outline-secondary btn-lg d-flex align-items-center justify-content-center"
                  style="display: none;"
                  @click="showJoinForm = true"
                  :disabled="isLoading"
                >
                  <i class="bi bi-people me-2"></i>
                  Unirse a un Negocio Existente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para crear negocio -->
    <div class="modal fade" :class="{ show: showCreateForm }" :style="{ display: showCreateForm ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <form @submit.prevent="handleCreateBusiness">
            <div class="modal-header">
              <h5 class="modal-title">Crear Nuevo Negocio</h5>
              <button type="button" class="btn-close" @click="showCreateForm = false" :disabled="isLoading"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label for="name" class="form-label">Nombre del Negocio *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="name"
                    v-model="createForm.name" 
                    required 
                    maxlength="255"
                    :disabled="isLoading"
                  />
                </div>
                <div class="col-12">
                  <label for="address" class="form-label">Dirección *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="address"
                    v-model="createForm.address" 
                    required 
                    maxlength="255"
                    :disabled="isLoading"
                  />
                </div>
                <div class="col-md-6">
                  <label for="phone" class="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    class="form-control" 
                    id="phone"
                    v-model="createForm.phone" 
                    maxlength="20"
                    :disabled="isLoading"
                  />
                </div>
                <div class="col-md-6">
                  <label for="email" class="form-label">Email</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="email"
                    v-model="createForm.email" 
                    maxlength="255"
                    :disabled="isLoading"
                  />
                </div>
                <div class="col-12">
                  <label for="description" class="form-label">Descripción</label>
                  <textarea 
                    class="form-control" 
                    id="description"
                    v-model="createForm.description" 
                    rows="3" 
                    maxlength="500"
                    :disabled="isLoading"
                  ></textarea>
                </div>
              </div>
              
              <!-- Mostrar errores -->
              <div v-if="error" class="alert alert-danger mt-3">
                {{ error }}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showCreateForm = false" :disabled="isLoading">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Creando...' : 'Crear Negocio' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para unirse a negocio (futuro) -->
    <div class="modal fade" :class="{ show: showJoinForm }" :style="{ display: showJoinForm ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="handleJoinBusiness">
            <div class="modal-header">
              <h5 class="modal-title">Unirse a un Negocio</h5>
              <button type="button" class="btn-close" @click="showJoinForm = false" :disabled="isLoading"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="invitationCode" class="form-label">Código de Invitación *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="invitationCode"
                  v-model="joinForm.invitationCode" 
                  required 
                  :disabled="isLoading"
                  placeholder="Ej: ABC123"
                />
                <div class="form-text">
                  Solicita el código de invitación al propietario del negocio
                </div>
              </div>
              
              <!-- Mostrar errores -->
              <div v-if="error" class="alert alert-danger">
                {{ error }}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showJoinForm = false" :disabled="isLoading">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Uniéndose...' : 'Unirse al Negocio' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Backdrop para modales -->
    <div v-if="showCreateForm || showJoinForm" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useAdminStore } from '@/stores/admin'

export default {
  name: 'BusinessSetup',
  emits: ['business-created'],
  setup(props, { emit }) {
    const adminStore = useAdminStore()
    
    const showCreateForm = ref(false)
    const showJoinForm = ref(false)
    const isLoading = ref(false)
    const error = ref(null)
    
    const createForm = reactive({
      name: '',
      address: '',
      phone: '',
      email: '',
      description: ''
    })
    
    const joinForm = reactive({
      invitationCode: ''
    })
    
    const handleCreateBusiness = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        const result = await adminStore.createBusiness({
          name: createForm.name,
          address: createForm.address,
          phone: createForm.phone || null,
          email: createForm.email || null,
          description: createForm.description || null
        })
        
        showCreateForm.value = false
        emit('business-created', result)
        
        // Limpiar formulario
        Object.keys(createForm).forEach(key => {
          createForm[key] = ''
        })
        
      } catch (err) {
        error.value = err.message || 'Error al crear el negocio'
      } finally {
        isLoading.value = false
      }
    }
    
    const handleJoinBusiness = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        const result = await adminStore.joinBusinessWithCode(joinForm.invitationCode)
        
        showJoinForm.value = false
        emit('business-created', result)
        
        // Limpiar formulario
        joinForm.invitationCode = ''
        
      } catch (err) {
        error.value = err.message || 'Error al unirse al negocio'
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      showCreateForm,
      showJoinForm,
      isLoading,
      error,
      createForm,
      joinForm,
      handleCreateBusiness,
      handleJoinBusiness
    }
  }
}
</script>

<style scoped>
.business-setup-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

.card {
  border: none;
  border-radius: 15px;
}

.text-primary {
  color: #0d6efd !important;
}
</style>