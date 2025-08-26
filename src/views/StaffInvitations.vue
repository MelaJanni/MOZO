<template>
  <div class="staff-invitations">
    <div class="container">
      <div class="header">
        <h1>
          <i class="fas fa-envelope"></i>
          Invitaciones de Trabajo
        </h1>
        <p class="subtitle">Revisa y gestiona tus invitaciones para trabajar en diferentes negocios</p>
      </div>

      <!-- Estado de carga -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando invitaciones...</p>
      </div>

      <!-- Sin invitaciones -->
      <div v-else-if="invitations.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3>No tienes invitaciones</h3>
        <p>Cuando los administradores te inviten a trabajar, aparecerán aquí.</p>
        <button @click="$router.push('/waiter/dashboard')" class="btn btn-primary">
          <i class="fas fa-arrow-left"></i>
          Volver al Dashboard
        </button>
      </div>

      <!-- Lista de invitaciones -->
      <div v-else class="invitations-grid">
        <div
          v-for="invitation in invitations"
          :key="invitation.id"
          class="invitation-card"
          :class="{ 'expired': isExpired(invitation) }"
        >
          <div class="card-header">
            <div class="business-info">
              <div class="business-logo">
                <img 
                  v-if="invitation.business_logo" 
                  :src="invitation.business_logo" 
                  :alt="invitation.business_name"
                />
                <i v-else class="fas fa-building"></i>
              </div>
              <div class="business-details">
                <h3>{{ invitation.business_name }}</h3>
                <p class="position">{{ invitation.position || 'Mozo' }}</p>
              </div>
            </div>
            <div class="invitation-status" :class="invitation.status">
              <span v-if="invitation.status === 'invited'">📩 Pendiente</span>
              <span v-else-if="invitation.status === 'confirmed'">✅ Aceptada</span>
              <span v-else-if="invitation.status === 'rejected'">❌ Rechazada</span>
            </div>
          </div>

          <div class="card-body">
            <div class="invitation-details">
              <div class="detail-item" v-if="invitation.business_address">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ invitation.business_address }}</span>
              </div>
              <div class="detail-item" v-if="invitation.salary">
                <i class="fas fa-dollar-sign"></i>
                <span>${{ invitation.salary.toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>Invitado {{ formatDate(invitation.invitation_sent_at) }}</span>
              </div>
            </div>

            <div class="invitation-message" v-if="invitation.notes">
              <i class="fas fa-comment"></i>
              <p>{{ invitation.notes }}</p>
            </div>
          </div>

          <div class="card-actions" v-if="invitation.status === 'invited' && !isExpired(invitation)">
            <button 
              @click="acceptInvitation(invitation)"
              :disabled="processing"
              class="btn btn-success"
            >
              <i v-if="processing && processingId === invitation.id" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-check"></i>
              Aceptar
            </button>
            <button 
              @click="declineInvitation(invitation)"
              :disabled="processing"
              class="btn btn-danger"
            >
              <i v-if="processing && processingId === invitation.id" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-times"></i>
              Declinar
            </button>
          </div>

          <div class="card-actions" v-else-if="isExpired(invitation)">
            <div class="expired-message">
              <i class="fas fa-exclamation-triangle"></i>
              Esta invitación ha expirado
            </div>
          </div>
        </div>
      </div>

      <!-- Botón para volver -->
      <div class="back-button" v-if="invitations.length > 0">
        <button @click="$router.push('/waiter/dashboard')" class="btn btn-outline">
          <i class="fas fa-arrow-left"></i>
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import { createStaffJoinSuccessNotification } from '@/services/staffNotifications'

const router = useRouter()
const authStore = useAuthStore()
const invitations = ref([])
const loading = ref(false)
const processing = ref(false)
const processingId = ref(null)

const loadInvitations = async () => {
  loading.value = true
  try {
    // Simulamos obtener invitaciones del usuario actual
    // En un caso real, esto vendría de un endpoint específico para invitaciones del usuario
    const response = await apiService.getWaiterNotifications()
    
    // Filtrar solo notificaciones de tipo invitación
    const staffInvitations = response.data?.unread_notifications
      ?.filter(notification => notification.type === 'staff_invitation')
      ?.map(notification => ({
        id: notification.data?.staff_invitation_id || notification.id,
        business_name: notification.data?.business_name,
        business_logo: notification.data?.business_logo,
        business_address: notification.data?.business_address,
        position: notification.data?.position || 'Mozo',
        salary: notification.data?.salary,
        status: 'invited',
        invitation_sent_at: notification.created_at,
        invitation_token: notification.data?.invitation_token,
        notes: notification.data?.message
      })) || []
    
    invitations.value = staffInvitations
  } catch (error) {
    console.error('Error loading invitations:', error)
    showErrorToast('Error al cargar invitaciones')
  } finally {
    loading.value = false
  }
}

const acceptInvitation = async (invitation) => {
  processing.value = true
  processingId.value = invitation.id
  
  try {
    // Usar el endpoint de unirse con token con user_id del usuario actual
    const userData = { user_id: authStore.user.id }
    const response = await apiService.joinStaffWithToken(invitation.invitation_token, userData)
    
    if (response.data?.success || response.success) {
      showSuccessToast(`¡Te has unido exitosamente a ${invitation.business_name}!`)
      
      // Crear notificación de éxito
      createStaffJoinSuccessNotification(invitation.business_name)
      
      // Actualizar el estado local
      const index = invitations.value.findIndex(inv => inv.id === invitation.id)
      if (index !== -1) {
        invitations.value[index].status = 'confirmed'
      }
      
      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        router.push('/waiter/dashboard')
      }, 2000)
    } else {
      throw new Error(response.data?.message || 'Error al aceptar invitación')
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Error al aceptar invitación'
    showErrorToast(errorMessage)
  } finally {
    processing.value = false
    processingId.value = null
  }
}

const declineInvitation = async (invitation) => {
  processing.value = true
  processingId.value = invitation.id
  
  try {
    // En un caso real, habría un endpoint específico para declinar invitaciones
    // Por ahora simulamos el rechazo marcando como rechazada localmente
    showSuccessToast(`Has declinado la invitación de ${invitation.business_name}`)
    
    // Actualizar el estado local
    const index = invitations.value.findIndex(inv => inv.id === invitation.id)
    if (index !== -1) {
      invitations.value[index].status = 'rejected'
    }
  } catch (error) {
    console.error('Error declining invitation:', error)
    showErrorToast('Error al declinar invitación')
  } finally {
    processing.value = false
    processingId.value = null
  }
}

const isExpired = (invitation) => {
  if (!invitation.invitation_sent_at) return false
  
  const sentDate = new Date(invitation.invitation_sent_at)
  const now = new Date()
  const daysDiff = (now - sentDate) / (1000 * 60 * 60 * 24)
  
  // Invitaciones expiran después de 7 días
  return daysDiff > 7
}

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  loadInvitations()
})
</script>

<style scoped>
.staff-invitations {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.invitations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.invitation-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.invitation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.invitation-card.expired {
  opacity: 0.7;
  background: #f8f9fa;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: 1rem;
}

.business-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.business-logo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.business-logo i {
  font-size: 1.5rem;
  color: #667eea;
}

.business-details h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.position {
  color: #667eea;
  font-weight: 500;
}

.invitation-status {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

.invitation-status.invited {
  background: #fff3cd;
  color: #856404;
}

.invitation-status.confirmed {
  background: #d4edda;
  color: #155724;
}

.invitation-status.rejected {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  padding: 1.5rem;
}

.invitation-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.detail-item i {
  width: 16px;
  color: #667eea;
}

.invitation-message {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.invitation-message i {
  color: #667eea;
  margin-right: 0.5rem;
}

.invitation-message p {
  margin: 0;
  color: #555;
  font-style: italic;
}

.card-actions {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
}

.card-actions .btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.expired-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #856404;
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 8px;
  width: 100%;
}

.back-button {
  text-align: center;
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: #5a67d8;
}

@media (max-width: 768px) {
  .invitations-grid {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .invitation-card {
    margin: 0 1rem;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>