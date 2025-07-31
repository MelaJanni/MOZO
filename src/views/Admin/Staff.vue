<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'
import RequestCard from '@/components/RequestCard.vue'
import StaffCard from '@/components/StaffCard.vue'
import StaffCardSkeleton from '@/components/skeletons/StaffCardSkeleton.vue'
import RequestCardSkeleton from '@/components/skeletons/RequestCardSkeleton.vue'
const router = useRouter()
const adminStore = useAdminStore()
const isLoading = ref(false)
const error = ref('')
const staff = computed(() => adminStore.staff)
const staffRequests = computed(() => adminStore.staffRequests)
const archivedRequests = computed(() => adminStore.archivedRequests)
const showInviteModal = ref(false)
const showConfirmModal = ref(false)
const showConfirmRequestModal = ref(false)
const showArchiveRequestModal = ref(false)
const selectedEmployee = ref(null)
const selectedRequest = ref(null)
const searchQuery = ref('')
const inviteEmail = ref('')
const inviteRole = ref('waiter')
const showArchived = ref(false)
const staffLinks = computed(() => adminStore.staffLinks)
const staffMeta = computed(() => adminStore.staffMeta)
const filteredStaff = computed(() => {
  if (!staff.value.length) return [];
  let filtered = [...staff.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(employee => 
      employee.name?.toLowerCase().includes(query) || 
      employee.email?.toLowerCase().includes(query) ||
      employee.position?.toLowerCase().includes(query)
    );
  }
  return filtered;
});
const displayedRequests = computed(() => {
  return showArchived.value ? archivedRequests.value : staffRequests.value;
});
const staffStats = computed(() => {
  if (!staff.value.length) return { total: 0, avgRating: 0 };
  const total = staff.value.length;
  const totalRating = staff.value.reduce((sum, emp) => sum + (emp.rating || 0), 0);
  const avgRating = totalRating / total;
  return {
    total,
    avgRating: avgRating.toFixed(1)
  };
});
onMounted(async () => {
  isLoading.value = true;
  error.value = '';
  try {
    await Promise.all([
      adminStore.fetchStaff(),
      adminStore.fetchStaffRequests(),
      adminStore.fetchArchivedRequests()
    ]);
  } catch (err) {
    error.value = err.message || 'Error al cargar datos de personal';
  } finally {
    isLoading.value = false;
  }
});
const inviteStaff = async () => {
  if (!inviteEmail.value || !inviteRole.value) {
    error.value = 'Por favor, completa todos los campos';
    return;
  }
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.inviteStaff({ email: inviteEmail.value, role: inviteRole.value });
    inviteEmail.value = '';
    inviteRole.value = 'waiter';
    showInviteModal.value = false;
  } catch (err) {
    error.value = err.message || 'Error al enviar invitación';
  } finally {
    isLoading.value = false;
  }
};
const handleConfirmRequest = async (request) => {
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.handleStaffRequest(request.id, 'confirm');
  } catch (err) {
    error.value = err.message || 'Error al confirmar solicitud';
  } finally {
    isLoading.value = false;
  }
};
const handleArchiveRequest = async (request) => {
  const action = 'archive';
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.handleStaffRequest(request.id, action);
  } catch (err) {
    error.value = err.message || `Error al ${action === 'unarchive' ? 'desarchivar' : 'archivar'} solicitud`;
  } finally {
    isLoading.value = false;
  }
};
const handleUnarchiveRequest = async (request) => {
  const action = 'unarchive';
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.handleStaffRequest(request.id, action);
  } catch (err) {
    error.value = err.message || 'Error al desarchivar solicitud';
  } finally {
    isLoading.value = false;
  }
};
const handleRejectRequest = async (request) => {
  const action = 'reject';
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.handleStaffRequest(request.id, action);
  } catch (err) {
    error.value = err.message || `Error al ${action === 'delete' ? 'eliminar' : 'rechazar'} solicitud`;
  } finally {
    isLoading.value = false;
  }
};
const confirmAllRequests = async () => {
  if (!staffRequests.value.length) return;
  isLoading.value = true;
  error.value = '';
  try {
    for (const request of staffRequests.value) {
      await adminStore.handleStaffRequest(request.id, 'confirm');
    }
  } catch (err) {
    error.value = err.message || 'Error al confirmar todas las solicitudes';
  } finally {
    isLoading.value = false;
  }
};
const archiveAllRequests = async () => {
  if (!staffRequests.value.length) return;
  isLoading.value = true;
  error.value = '';
  try {
    for (const request of staffRequests.value) {
      await adminStore.handleStaffRequest(request.id, 'archive');
    }
  } catch (err) {
    error.value = err.message || 'Error al archivar todas las solicitudes';
  } finally {
    isLoading.value = false;
  }
};
const confirmRemoveStaff = (employee) => {
  selectedEmployee.value = employee;
  showConfirmModal.value = true;
};
const removeStaff = async () => {
  if (!selectedEmployee.value) return;
  isLoading.value = true;
  error.value = '';
  try {
    await adminStore.removeStaff(selectedEmployee.value.id);
    showConfirmModal.value = false;
    selectedEmployee.value = null;
  } catch (err) {
    error.value = err.message || 'Error al eliminar miembro del personal';
  } finally {
    isLoading.value = false;
  }
};
const toggleArchived = () => {
  showArchived.value = !showArchived.value;
};
const getRoleName = (role) => {
  switch (role) {
    case 'waiter':
      return 'Mozo';
    case 'kitchen':
      return 'Cocinero';
    case 'cashier':
      return 'Cajero';
    case 'manager':
      return 'Gerente';
    case 'cleaning':
      return 'Limpieza';
    default:
      return role;
  }
};
const viewStaffDetail = (employee) => {
  router.push('/admin/staff/' + employee.id);
};
const openInviteModal = () => {
  showInviteModal.value = true;
};
const loadNextPage = async () => {
  if (staffLinks.value.next) {
    isLoading.value = true;
    await adminStore.fetchStaff(staffLinks.value.next);
    isLoading.value = false;
  }
};
const loadPrevPage = async () => {
  if (staffLinks.value.prev) {
    isLoading.value = true;
    await adminStore.fetchStaff(staffLinks.value.prev);
    isLoading.value = false;
  }
};
</script>
<template>
  <div class="staff-page">
    <div class="page-header">
      <h1 class="page-title">Gestión de Personal</h1>
      <div class="header-stats" v-if="!isLoading && staff.length > 0">
        <div class="stat-item">
          <span class="stat-value">{{ staffStats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ staffStats.avgRating }}</span>
          <span class="stat-label">Rating promedio</span>
        </div>
      </div>
      <BaseButton @click="openInviteModal" variant="primary" icon="fas fa-plus">
        Invitar Personal
      </BaseButton>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando personal...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <BaseButton @click="$router.go(0)" variant="primary">
        Reintentar
      </BaseButton>
    </div>
    <div v-else class="staff-content">
      <section class="staff-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">
              {{ showArchived ? 'Solicitudes Archivadas' : 'Solicitudes Pendientes' }}
              <span v-if="!showArchived && staffRequests.length" class="badge bg-primary rounded-pill">
                {{ staffRequests.length }}
              </span>
            </h2>
          </div>
          <div class="section-actions" v-if="!showArchived">
            <BaseButton @click="archiveAllRequests" size="sm" :disabled="!staffRequests.length">Archivar Todo</BaseButton>
            <BaseButton @click="confirmAllRequests" size="sm" variant="success" :disabled="!staffRequests.length">Confirmar Todo</BaseButton>
          </div>
        </div>
        <div v-if="isLoading" class="requests-list">
          <RequestCardSkeleton v-for="n in 3" :key="n" />
        </div>
        <div v-else>
          <div v-if="!displayedRequests.length" class="text-center p-4 text-muted">
            <p>No hay solicitudes para mostrar.</p>
          </div>
          <div v-else class="requests-list">
            <RequestCard 
              v-for="request in displayedRequests" 
              :key="request.id" 
              :request="request"
              :is-archived="showArchived"
              @confirm="handleConfirmRequest"
              @archive="handleArchiveRequest"
              @unarchive="handleUnarchiveRequest"
              @reject="handleRejectRequest"
            />
          </div>
        </div>
        <BaseButton @click="toggleArchived" size="sm" class="mt-3">
          {{ showArchived ? 'Ver Pendientes' : 'Ver Archivadas' }}
        </BaseButton>
      </section>
      <section class="staff-section">
        <div class="section-header">
          <h2 class="section-title">Tu Personal</h2>
          <input type="text" v-model="searchQuery" class="search-input" placeholder="Buscar personal...">
        </div>
        <div v-if="isLoading" class="staff-grid">
          <StaffCardSkeleton v-for="n in 4" :key="n" />
        </div>
        <div v-else class="staff-grid">
          <p v-if="!filteredStaff.length">No se encontró personal.</p>
          <StaffCard 
            v-for="employee in filteredStaff" 
            :key="employee.id" 
            :employee="employee"
            @remove="confirmRemoveStaff"
            @view="viewStaffDetail"
          />
        </div>
        <div class="pagination-container" v-if="staffMeta.last_page > 1">
          <button class="pagination-button" :disabled="!staffLinks.prev" @click="loadPrevPage">Anterior</button>
          <span>{{ staffMeta.current_page }} / {{ staffMeta.last_page }}</span>
          <button class="pagination-button" :disabled="!staffLinks.next" @click="loadNextPage">Siguiente</button>
        </div>
      </section>
    </div>
    <BaseModal
      v-model="showInviteModal"
      title="Invitar Personal"
      size="md"
    >
      <div class="invite-form">
        <div class="form-group">
          <label for="invite-email">Correo electrónico</label>
          <input
            id="invite-email"
            type="email"
            v-model="inviteEmail"
            placeholder="Ingresa el correo electrónico"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label for="invite-role">Cargo</label>
          <select
            id="invite-role"
            v-model="inviteRole"
            class="form-control"
          >
            <option value="waiter">Mozo</option>
            <option value="kitchen">Cocinero</option>
            <option value="cashier">Cajero</option>
            <option value="manager">Gerente</option>
            <option value="cleaning">Limpieza</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showInviteModal = false"
        >
          Cancelar
        </button>
        <button 
          class="btn btn-primary" 
          @click="inviteStaff"
          :disabled="!inviteEmail || isLoading"
        >
          <span v-if="isLoading">Enviando...</span>
          <span v-else>Enviar invitación</span>
        </button>
      </template>
    </BaseModal>
    <BaseModal
      v-model="showConfirmModal"
      title="Desvincular empleado"
      size="sm"
    >
      <p>¿Estás seguro de que deseas desvincular a {{ selectedEmployee?.name }}?</p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
      <template #footer>
        <button 
          class="btn btn-secondary" 
          @click="showConfirmModal = false"
        >
          Cancelar
        </button>
        <button 
          class="btn btn-danger" 
          @click="removeStaff"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Desvincular
        </button>
      </template>
    </BaseModal>
  </div>
</template>
<style scoped>
.staff-page {
  background-color: #f9fafb;
  min-height: 100vh;
  padding: 1rem;
  padding-top: 80px; /* Espacio para el navbar fijo */
}
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  margin-right: auto;
}
.header-stats {
  display: flex;
  gap: 1rem;
  margin-right: 1rem;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #6A3FEA;
}
.stat-label {
  font-size: 0.75rem;
  color: #666;
}
.add-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #6A3FEA;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 10px rgba(106, 63, 234, 0.3);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s, transform 0.2s;
}
.add-button:hover {
  background-color: #5933C3;
  transform: scale(1.05);
}
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.spinner {
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
.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}
.staff-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.staff-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}
.section-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
}
.section-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s, border-color 0.2s;
}
.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}
.btn-outline-primary {
  background-color: transparent;
  border: 1px solid #6A3FEA;
  color: #6A3FEA;
}
.btn-outline-primary:hover {
  background-color: #6A3FEA;
  color: white;
}
.btn-outline-secondary {
  background-color: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}
.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}
.btn-primary {
  background-color: #6A3FEA;
  color: white;
  border: none;
}
.btn-primary:hover {
  background-color: #5933C3;
}
.btn-primary[disabled] {
  background-color: #a084e8;
  cursor: not-allowed;
}
.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}
.btn-danger:hover {
  background-color: #c82333;
}
.btn-danger[disabled] {
  background-color: #f8d7da;
  cursor: not-allowed;
}
.btn-secondary {
  background-color: #e9ecef;
  color: #495057;
  border: none;
}
.btn-secondary:hover {
  background-color: #dee2e6;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 8px;
}
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.search-container {
  max-width: 400px;
  width: 100%;
}
.search-input {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
}
.form-control {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input .form-control {
  padding-left: 2.75rem;
}
.form-control:focus {
  outline: none;
  border-color: #6A3FEA;
  box-shadow: 0 0 0 2px rgba(106, 63, 234, 0.2);
}
.clear-button {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
}
.pagination-button {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: #4a4a4a;
  transition: background-color 0.2s;
}
.pagination-button:not(:disabled):hover {
  background-color: #f0f0f0;
}
.pagination-button:disabled {
  cursor: not-allowed;
  color: #9ca3af;
}
.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 0.5rem;
}
.invite-form .form-group {
  margin-bottom: 1rem;
}
.invite-form .form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .section-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style> 