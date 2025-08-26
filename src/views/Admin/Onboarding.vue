<template>
  <div class="onboarding-container">
    <div class="content-wrapper">
      <div class="header">
        <h1>Configura tu negocio</h1>
        <p class="subtitle">Eres admin y aún no tienes un negocio configurado.</p>
      </div>

      <div class="options">
        <button class="tab-btn" :class="{ active: activeTab === 'create' }" @click="activeTab = 'create'">
          Crear negocio
        </button>
        <!-- Botón oculto por ahora (funcionalidad futura) -->
        <button class="tab-btn hidden" :class="{ active: activeTab === 'join' }" @click="activeTab = 'join'" disabled>
          Unirse a negocio (próximamente)
        </button>
      </div>

      <div v-if="activeTab === 'create'" class="card">
        <form @submit.prevent="submitCreate">
          <div class="form-group">
            <label>Nombre del negocio<span class="req">*</span></label>
            <input v-model.trim="form.name" type="text" maxlength="255" required placeholder="Ej: Café Central" />
          </div>

          <div class="form-group">
            <label>Dirección<span class="req">*</span></label>
            <input v-model.trim="form.address" type="text" maxlength="255" required placeholder="Calle 123, Ciudad" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input v-model.trim="form.phone" type="text" maxlength="20" placeholder="Opcional" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model.trim="form.email" type="email" maxlength="255" placeholder="Opcional" />
            </div>
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model.trim="form.description" maxlength="500" rows="3" placeholder="Opcional"></textarea>
          </div>

          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="isLoading">
              <span v-if="isLoading" class="spinner"></span>
              <span v-else>Crear negocio</span>
            </button>
            <button type="button" class="btn-secondary" @click="goBack" :disabled="isLoading">Cancelar</button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
        </form>
      </div>

      <div v-else class="card">
        <!-- Oculto por ahora: Unirse a negocio con código de invitación -->
        <form @submit.prevent="submitJoin">
          <div class="form-group">
            <label>Código de invitación</label>
            <input v-model.trim="invitationCode" type="text" maxlength="32" placeholder="Ej: ABCD1234" disabled />
          </div>
          <div class="actions">
            <button type="submit" class="btn-primary" disabled>Unirse</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const activeTab = ref('create')
const isLoading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  address: '',
  phone: '',
  email: '',
  description: ''
})

const invitationCode = ref('')

onMounted(async () => {
  // Si ya no requiere setup, redirigir al dashboard admin
  if (!adminStore.requiresBusinessSetup && adminStore.activeBusinessId) {
    router.replace({ name: 'admin' })
  }
})

const submitCreate = async () => {
  error.value = ''
  // Validación simple
  if (!form.name || !form.address) {
    error.value = 'Nombre y dirección son obligatorios.'
    return
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    error.value = 'El email no es válido.'
    return
  }

  isLoading.value = true
  try {
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone || undefined,
      email: form.email || undefined,
      description: form.description || undefined
    }
    await adminStore.createBusiness(payload)
    // Tras crear, ir al dashboard admin
    router.replace({ name: 'admin' })
  } catch (e) {
    error.value = e.message || 'No se pudo crear el negocio.'
  } finally {
    isLoading.value = false
  }
}

const submitJoin = async () => {
  // Funcionalidad futura: unirse con código
  return
}

const goBack = () => {
  router.replace({ name: 'admin' })
}
</script>

<style scoped>
.onboarding-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
.content-wrapper {
  width: 100%;
  max-width: 720px;
}
.header {
  margin-bottom: 1rem;
}
.subtitle { color: #6c757d; }

.options { display: flex; gap: .5rem; margin-bottom: 1rem; }
.tab-btn {
  padding: .5rem 1rem;
  border: 1px solid #dee2e6;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}
.tab-btn.active { border-color: #6A3FEA; color: #6A3FEA; font-weight: 600; }
.tab-btn.hidden { display: none; }

.card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 1rem; }
.form-group { display: flex; flex-direction: column; margin-bottom: .75rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
label { font-weight: 600; margin-bottom: .25rem; }
.req { color: #dc3545; margin-left: .25rem; }
input, textarea { border: 1px solid #ced4da; border-radius: 8px; padding: .6rem .75rem; }

.actions { display: flex; gap: .5rem; margin-top: .5rem; }
.btn-primary { background: #6A3FEA; color: #fff; border: none; padding: .6rem 1rem; border-radius: 8px; cursor: pointer; }
.btn-primary:disabled { opacity: .7; cursor: not-allowed; }
.btn-secondary { background: #f1f3f5; color: #212529; border: 1px solid #dee2e6; padding: .6rem 1rem; border-radius: 8px; cursor: pointer; }

.error { color: #dc3545; margin-top: .5rem; }
.spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

@media (max-width: 640px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
