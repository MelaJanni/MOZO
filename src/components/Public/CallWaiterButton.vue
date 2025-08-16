<template>
  <div class="call-waiter-container">
    <!-- Estado: Normal/Idle -->
    <div v-if="callState === 'idle'" class="call-idle-state">
      <div class="call-info">
        <h3>
          <i class="fas fa-concierge-bell"></i>
          ¿Necesitas ayuda?
        </h3>
        <p>Presiona el botón para llamar a tu mozo</p>
      </div>
      
      <button 
        @click="callWaiter"
        class="call-button primary"
        :disabled="loading"
      >
        <i class="fas fa-bell" :class="{ 'fa-spin': loading }"></i>
        <span v-if="!loading">Llamar Mozo</span>
        <span v-else>Conectando...</span>
      </button>
    </div>

    <!-- Estado: Llamando/Enviando -->
    <div v-else-if="callState === 'calling'" class="call-calling-state">
      <div class="call-status-card">
        <div class="status-icon calling">
          <i class="fas fa-paper-plane"></i>
        </div>
        <h3>Llamando mozo...</h3>
        <p>Estamos notificando a tu mozo</p>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- Estado: Aguardando respuesta del mozo -->
    <div v-else-if="callState === 'waiting'" class="call-waiting-state">
      <div class="call-status-card">
        <div class="status-icon waiting">
          <i class="fas fa-clock"></i>
        </div>
        <h3>¡Mozo notificado!</h3>
        <p>Aguarde por favor, su mozo fue notificado y lo atenderá en breve</p>
        <div class="wait-time">
          <i class="fas fa-hourglass-half"></i>
          <span>Tiempo de espera: {{ formatWaitTime }}</span>
        </div>
        
        <!-- Botón para llamar de nuevo si pasa mucho tiempo -->
        <button 
          v-if="waitTimeSeconds > 120" 
          @click="callWaiterUrgent"
          class="call-button urgent"
        >
          <i class="fas fa-exclamation-triangle"></i>
          Llamar urgente
        </button>
      </div>
    </div>

    <!-- Estado: Mozo confirmó que vio la llamada -->
    <div v-else-if="callState === 'acknowledged'" class="call-acknowledged-state">
      <div class="call-status-card success">
        <div class="status-icon acknowledged">
          <i class="fas fa-check"></i>
        </div>
        <h3>¡Mozo en camino!</h3>
        <p>Su mozo confirmó la llamada y se dirige a su mesa</p>
        
        <!-- Botón para nuevas solicitudes -->
        <button 
          @click="resetCall"
          class="call-button secondary"
        >
          <i class="fas fa-redo"></i>
          Nueva solicitud
        </button>
      </div>
    </div>

    <!-- Estado: Error -->
    <div v-else-if="callState === 'error'" class="call-error-state">
      <div class="call-status-card error">
        <div class="status-icon error">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>{{ errorMessage.title || 'Error en la llamada' }}</h3>
        <p>{{ errorMessage.description || 'No pudimos contactar con su mozo. Intente nuevamente.' }}</p>
        
        <button 
          @click="resetCall"
          class="call-button primary"
        >
          <i class="fas fa-redo"></i>
          Intentar nuevamente
        </button>
      </div>
    </div>

    <!-- Opciones de urgencia (modal) -->
    <div v-if="showUrgencyOptions" class="urgency-modal-overlay" @click="showUrgencyOptions = false">
      <div class="urgency-modal" @click.stop>
        <h4>Tipo de solicitud</h4>
        <div class="urgency-options">
          <button 
            @click="confirmCall('normal')"
            class="urgency-option normal"
          >
            <i class="fas fa-bell"></i>
            <span>Normal</span>
            <small>Solicitud general</small>
          </button>
          <button 
            @click="confirmCall('urgent')"
            class="urgency-option urgent"
          >
            <i class="fas fa-exclamation-triangle"></i>
            <span>Urgente</span>
            <small>Necesito atención inmediata</small>
          </button>
        </div>
        <button @click="showUrgencyOptions = false" class="cancel-btn">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import waiterCallsService from '@/services/waiterCallsService'

// Props
const props = defineProps({
  tableId: {
    type: [String, Number],
    required: true
  },
  businessId: {
    type: [String, Number], 
    required: true
  },
  tableNumber: {
    type: [String, Number],
    default: null
  }
})

// Emits
const emit = defineEmits(['call-status-change'])

// Estado reactivo
const state = reactive({
  callState: 'idle', // idle, calling, waiting, acknowledged, error
  loading: false,
  showUrgencyOptions: false,
  waitTimeSeconds: 0,
  errorMessage: {},
  currentCallId: null,
  waitTimer: null
})

// Referencias reactivas para template
const callState = computed(() => state.callState)
const loading = computed(() => state.loading)
const showUrgencyOptions = computed({
  get: () => state.showUrgencyOptions,
  set: (value) => state.showUrgencyOptions = value
})
const waitTimeSeconds = computed(() => state.waitTimeSeconds)
const errorMessage = computed(() => state.errorMessage)

// Computed para formatear tiempo de espera
const formatWaitTime = computed(() => {
  const seconds = state.waitTimeSeconds
  if (seconds < 60) {
    return `${seconds}s`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
})

// ===== MÉTODOS PRINCIPALES =====

/**
 * Iniciar proceso de llamada (mostrar opciones de urgencia)
 */
const callWaiter = () => {
  state.showUrgencyOptions = true
}

/**
 * Llamada urgente directa
 */
const callWaiterUrgent = () => {
  confirmCall('urgent')
}

/**
 * Confirmar llamada con nivel de urgencia
 */
const confirmCall = async (urgency = 'normal') => {
  state.showUrgencyOptions = false
  state.callState = 'calling'
  state.loading = true
  
  emit('call-status-change', 'calling')

  try {
    console.log('📞 Calling waiter...', {
      tableId: props.tableId,
      urgency,
      tableNumber: props.tableNumber
    })

    const response = await waiterCallsService.callWaiter(props.tableId, {
      message: urgency === 'urgent' ? 'Solicitud urgente' : 'Solicita mozo',
      urgency: urgency === 'urgent' ? 'high' : 'normal',
      client_info: {
        timestamp: new Date().toISOString(),
        table_number: props.tableNumber
      }
    })

    if (response.success) {
      console.log('✅ Waiter called successfully:', response)
      
      state.currentCallId = response.call_id
      state.callState = 'waiting'
      state.waitTimeSeconds = 0
      
      // Iniciar timer de espera
      startWaitTimer()
      
      // Escuchar actualizaciones en tiempo real
      setupRealTimeListener()
      
      emit('call-status-change', 'waiting')
      
    } else {
      handleCallError(response)
    }

  } catch (error) {
    console.error('❌ Error calling waiter:', error)
    handleCallError(error)
  } finally {
    state.loading = false
  }
}

/**
 * Manejar errores de llamada
 */
const handleCallError = (error) => {
  state.callState = 'error'
  
  if (error.message?.includes('no_waiter_assigned')) {
    state.errorMessage = {
      title: 'Mozo no disponible',
      description: 'No hay un mozo asignado a esta mesa actualmente. Por favor, solicite ayuda al personal del establecimiento.'
    }
  } else if (error.message?.includes('table_silenced')) {
    state.errorMessage = {
      title: 'Mesa temporalmente silenciada',
      description: 'Su mesa está temporalmente silenciada. Inténtelo de nuevo en unos minutos.'
    }
  } else {
    state.errorMessage = {
      title: 'Error en la conexión',
      description: 'No pudimos procesar su solicitud. Verifique su conexión a internet e inténtelo nuevamente.'
    }
  }
  
  emit('call-status-change', 'error')
}

/**
 * Resetear llamada
 */
const resetCall = () => {
  clearWaitTimer()
  clearRealTimeListener()
  
  state.callState = 'idle'
  state.currentCallId = null
  state.waitTimeSeconds = 0
  state.errorMessage = {}
  
  emit('call-status-change', 'idle')
}

/**
 * Iniciar timer de tiempo de espera
 */
const startWaitTimer = () => {
  clearWaitTimer()
  
  state.waitTimer = setInterval(() => {
    state.waitTimeSeconds += 1
  }, 1000)
}

/**
 * Limpiar timer de espera
 */
const clearWaitTimer = () => {
  if (state.waitTimer) {
    clearInterval(state.waitTimer)
    state.waitTimer = null
  }
}

/**
 * Configurar listener en tiempo real para actualizaciones de estado
 */
const setupRealTimeListener = () => {
  // Escuchar evento cuando mozo confirma la llamada
  window.addEventListener('waiter-call-acknowledged', handleWaiterAcknowledged)
  window.addEventListener('waiter-call-completed', handleWaiterCompleted)
}

/**
 * Limpiar listener en tiempo real
 */
const clearRealTimeListener = () => {
  window.removeEventListener('waiter-call-acknowledged', handleWaiterAcknowledged)
  window.removeEventListener('waiter-call-completed', handleWaiterCompleted)
}

/**
 * Handler cuando mozo confirma la llamada
 */
const handleWaiterAcknowledged = (event) => {
  console.log('✅ Waiter acknowledged call:', event.detail)
  
  if (event.detail.call_id === state.currentCallId) {
    clearWaitTimer()
    state.callState = 'acknowledged'
    emit('call-status-change', 'acknowledged')
  }
}

/**
 * Handler cuando mozo completa la llamada
 */
const handleWaiterCompleted = (event) => {
  console.log('✅ Waiter completed call:', event.detail)
  
  if (event.detail.call_id === state.currentCallId) {
    resetCall()
  }
}

// ===== LIFECYCLE =====

onMounted(() => {
  console.log('🔔 CallWaiterButton mounted', {
    tableId: props.tableId,
    businessId: props.businessId,
    tableNumber: props.tableNumber
  })
})

onUnmounted(() => {
  clearWaitTimer()
  clearRealTimeListener()
})
</script>

<style scoped>
.call-waiter-container {
  width: 100%;
}

.call-idle-state,
.call-calling-state,
.call-waiting-state,
.call-acknowledged-state,
.call-error-state {
  text-align: center;
}

.call-info h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
}

.call-info p {
  margin: 0 0 24px 0;
  color: #6c757d;
  font-size: 16px;
}

.call-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.call-button.primary {
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: white;
}

.call-button.primary:hover:not(:disabled) {
  background: linear-gradient(45deg, #0056b3, #004085);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.call-button.urgent {
  background: linear-gradient(45deg, #dc3545, #c82333);
  color: white;
  animation: pulse-urgent 2s infinite;
}

.call-button.urgent:hover:not(:disabled) {
  background: linear-gradient(45deg, #c82333, #a71e2a);
  transform: translateY(-2px);
}

.call-button.secondary {
  background: #6c757d;
  color: white;
}

.call-button.secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.call-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.call-status-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 32px 24px;
  border: 2px solid #e9ecef;
}

.call-status-card.success {
  background: #d4edda;
  border-color: #28a745;
}

.call-status-card.error {
  background: #f8d7da;
  border-color: #dc3545;
}

.status-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  color: white;
}

.status-icon.calling {
  background: #007bff;
  animation: pulse-calling 2s infinite;
}

.status-icon.waiting {
  background: #ffc107;
  animation: pulse-waiting 2s infinite;
}

.status-icon.acknowledged {
  background: #28a745;
  animation: scale-success 0.6s ease-out;
}

.status-icon.error {
  background: #dc3545;
}

.call-status-card h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
}

.call-status-card p {
  margin: 0 0 20px 0;
  color: #6c757d;
  font-size: 16px;
  line-height: 1.5;
}

.wait-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #495057;
  font-weight: 500;
  margin: 16px 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: 20px 0;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

.urgency-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.urgency-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.urgency-modal h4 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.urgency-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.urgency-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.urgency-option:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.urgency-option.normal:hover {
  border-color: #007bff;
}

.urgency-option.urgent:hover {
  border-color: #dc3545;
  background: #fff5f5;
}

.urgency-option i {
  font-size: 24px;
  margin-bottom: 8px;
  color: #007bff;
}

.urgency-option.urgent i {
  color: #dc3545;
}

.urgency-option span {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.urgency-option small {
  color: #6c757d;
  font-size: 12px;
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #545b62;
}

/* Animations */
@keyframes pulse-calling {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes pulse-waiting {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse-urgent {
  0% { box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4); }
  50% { box-shadow: 0 6px 20px rgba(220, 53, 69, 0.6); }
  100% { box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4); }
}

@keyframes scale-success {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .call-button {
    padding: 14px 28px;
    font-size: 16px;
  }
  
  .call-status-card {
    padding: 24px 16px;
  }
  
  .status-icon {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .call-status-card h3 {
    font-size: 20px;
  }
  
  .urgency-modal {
    margin: 20px;
  }
}
</style>