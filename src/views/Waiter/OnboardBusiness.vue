<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWaiterStore } from '@/stores/waiter'
import { businessCodeValidator } from '@/utils/validators'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const waiterStore = useWaiterStore()

const businessCode = ref('')
const error = ref('')
const isLoading = ref(false)

onMounted(async () => {
  if (waiterStore.isAssociated) {
    router.replace({ name: 'waiter-dashboard' })
  }
})

const validateForm = () => {
  const validation = businessCodeValidator(businessCode.value)
  if (validation !== true) {
    error.value = validation
    return false
  }
  
  error.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const success = await waiterStore.associateBusiness(businessCode.value)
    
    if (success) {
      router.push({ name: 'waiter-dashboard' })
    } else {
      error.value = 'No se pudo asociar con el negocio. Por favor, verifica el código e inténtalo de nuevo.'
    }
  } catch (err) {
    error.value = err.message || 'Error al asociar negocio'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="onboard-container">
    <div class="onboard-card">
      <div class="onboard-header">
        <img src="@/assets/mozo-logo.svg" alt="MOZO" class="logo" />
        <h1>Asociar con negocio</h1>
        <p>Ingresa el código proporcionado por el administrador del local</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="onboard-form">
        <BaseInput
          v-model="businessCode"
          label="Código de negocio"
          placeholder="XXXX-XXXX-XXXX"
          :error="error"
          required
          autocomplete="off"
          name="businessCode"
        />
        
        <BaseButton
          type="submit"
          :loading="isLoading"
          block
        >
          Asociarme
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.onboard-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: #f9fafb;
}

.onboard-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
}

.onboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.onboard-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.onboard-form {
  display: flex;
  flex-direction: column;
}
</style> 