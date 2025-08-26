<template>
  <div class="onboarding-container">
    <div class="content-wrapper">
      <div class="user-header" @click="goToProfile" title="Editar perfil">
        <img 
          :src="authStore.user?.avatar || '/src/assets/default-avatar.png'" 
          alt="Avatar"
          class="user-avatar"
        />
        <div class="business-selector-wrapper" title="Vincúlate introduciendo un código">
          <span>Negocio:</span>
          <select disabled>
            <option>Ninguno</option>
          </select>
        </div>
      </div>
      
      <div class="form-container">
        <form @submit.prevent="handleSubmit">
          <button type="submit" class="btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>AGREGAR NEGOCIO</span>
          </button>
          
          <h2 class="code-prompt">Código</h2>
          <div class="otp-inputs" @paste="handlePaste">
            <input
              v-for="i in 4"
              :key="i"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="otp-box"
              :ref="el => otpInputs[i-1] = el"
              @input="handleInput($event, i)"
              @keydown="handleKeyDown($event, i)"
            />
          </div>
        </form>
        <p v-if="error" class="error-feedback">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWaiterStore } from '@/stores/waiter';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const waiterStore = useWaiterStore();
const authStore = useAuthStore();

const code = ref(['', '', '', '']);
const isLoading = ref(false);
const error = ref('');
const otpInputs = ref([]);

const handleInput = (e, index) => {
  const input = e.target;
  let value = input.value;
  
  if (!/^\d*$/.test(value)) {
    input.value = '';
    return;
  }

  code.value[index - 1] = value;

  if (value && input.nextElementSibling) {
    input.nextElementSibling.focus();
  }
};

const handleKeyDown = (e, index) => {
  if (e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) {
    e.target.previousElementSibling.focus();
  }
};

const handlePaste = (e) => {
  e.preventDefault();
  const pasteData = e.clipboardData.getData('text').trim().slice(0, 4);
  if (/^\d{4}$/.test(pasteData)) {
    pasteData.split('').forEach((char, i) => {
      code.value[i] = char;
      otpInputs.value[i].value = char;
    });
    otpInputs.value[3].focus();
    handleSubmit();
  }
};

const handleSubmit = async () => {
  const fullCode = code.value.join('');
  if (fullCode.length !== 4) {
    error.value = 'El código debe tener 4 dígitos.';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await waiterStore.associateBusiness(fullCode);
    await authStore.fetchUser(); // Recargar datos de usuario para obtener la asociación
  router.push({ name: 'waiter-dashboard' });
  } catch (err) {
    error.value = err.message || 'El código es incorrecto o ha expirado.';
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  } finally {
    isLoading.value = false;
  }
};

const goToProfile = () => {
  router.push({ name: 'profile' }); 
};
</script>

<style scoped>
.onboarding-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
}
.content-wrapper {
  width: 100%;
  max-width: 400px;
}
.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}
.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.business-selector-wrapper {
  flex-grow: 1;
  margin-left: 1rem;
}
.business-selector-wrapper span {
  font-size: 0.8rem;
  color: #6c757d;
  display: block;
}
.business-selector-wrapper select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: #e9ecef;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  font-weight: 500;
  cursor: not-allowed;
}
.form-container {
  background-color: #fff;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.btn-primary {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #6A3FEA;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}
.btn-primary:disabled {
  background-color: #a084e8;
  cursor: not-allowed;
}
.code-prompt {
  font-size: 1.25rem;
  color: #343a40;
  margin-bottom: 1.5rem;
}
.otp-inputs {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.otp-box {
  width: 60px;
  height: 60px;
  font-size: 2rem;
  text-align: center;
  border: 1px solid #ced4da;
  border-radius: 8px;
}
.otp-box:focus {
  outline: none;
  border-color: #6A3FEA;
  box-shadow: 0 0 0 3px rgba(106, 63, 234, 0.2);
}
.error-feedback {
  color: #dc3545;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 