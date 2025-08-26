<template>
  <div class="qr-container">
    <div class="tabs-container">
      <div class="tabs-header d-flex justify-content-center align-items-center">
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'tables' }"
          @click="setTab('tables')"
        >
          MESAS
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'menus' }"
          @click="setTab('menus')"
        >
          MENÚ
        </button>
      </div>
    </div>
    <div v-if="isLoading && !tables.length" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando datos...</p>
    </div>
    <div v-if="error && !isLoading" class="alert alert-danger">
      {{ error }}
    </div>
    
    
    <div class="qr-content">
      <div v-if="activeTab === 'tables'" class="qr-layout">
         <div class="tables-panel">
           <h2 class="panel-title">Selecciona una mesa</h2>
            <div class="select-all-container">
              <input 
                type="checkbox" 
                @change="selectAll" 
                :checked="tables.length > 0 && selectedTables.length === tables.length"
                class="form-check-input"
              >
              <label>Seleccionar todo</label>
            </div>
           <div v-if="isLoading" class="tables-list">
             <TableListItemSkeleton v-for="n in 8" :key="n" />
           </div>
           <div v-else class="tables-list">
             <div 
              v-for="table in tables" 
              :key="table.id"
              class="table-item"
              :class="{ active: selectedTable && selectedTable.id === table.id }"
              @click="selectTable(table)"
            >
              <input 
                type="checkbox" 
                :checked="isSelected(table)" 
                @change="toggleSelection(table)"
                @click.stop 
                class="form-check-input"
              >
              <span class="table-name">{{ (table.name || `MESA ${table.number}`).toUpperCase() }}</span>
              <div class="table-actions" @click.stop>
                <button @click="editTablePrompt(table)" class="btn-action edit" title="Editar mesa">
                  <i class="bi bi-pencil"></i>
                </button>
                <button @click="deleteTablePrompt(table)" class="btn-action delete" title="Eliminar mesa">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
           </div>
           <button class="add-table-btn" @click="createTablePrompt">MESA ＋</button>
         </div>
         <div class="qr-panel">
            <div v-if="selectedTables.length > 0" class="qr-display-multiple">
              <h3>{{ selectedTables.length }} mesa(s) seleccionada(s)</h3>
              <p>Selecciona una acción para aplicar a todas las mesas seleccionadas.</p>
              <div class="share-buttons">
                  <button @click="openDownloadModal(selectedTables)" class="share-btn download">
                      <i class="bi bi-download"></i> Descargar QRs
                  </button>
                  <button @click="openEmailModal(selectedTables)" class="share-btn email">
                      <i class="bi bi-envelope-fill"></i> Enviar por correo
                  </button>
              </div>
            </div>
            <div v-else-if="selectedTable" class="qr-display">
              <h3 class="qr-table-name">Mesa {{ selectedTable.number }}</h3>
              <div v-if="selectedTable.qr_code" class="qr-code-item">
                <div v-if="isQrLoading" class="qr-image-loader">
                  <div class="loading-spinner-small"></div>
                </div>
                <img v-else-if="qrCodeImageUrl" :src="qrCodeImageUrl" alt="Código QR" class="qr-image">
                <div v-else class="qr-image-error">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <span>Error al cargar QR</span>
                </div>
                <div class="share-buttons">
                  <button @click="openDownloadModal([selectedTable])" class="share-btn download">
                    <i class="bi bi-download"></i> Descargar
                  </button>
                  <button @click="shareQrFile(selectedTable)" class="share-btn share">
                    <i class="bi bi-share-fill"></i> Compartir
                  </button>
                  <button @click="openEmailModal([selectedTable])" class="share-btn email">
                    <i class="bi bi-envelope-fill"></i> Enviar
                  </button>
                </div>
                <button class="btn btn-secondary mt-3" @click="generateQrForSelectedTable">Regenerar QR</button>
              </div>
              <div v-else class="no-qr-codes">
                <p>Esta mesa aún no tiene un código QR.</p>
                <button class="btn btn-primary mt-3" @click="generateQrForSelectedTable">Generar QR</button>
              </div>
            </div>
             <div v-else class="qr-placeholder">
              <p>Selecciona una mesa para ver su código QR</p>
            </div>
        </div>
      </div>
      <div v-else class="menu-layout">
        <div class="row mb-3">
          <div class="col-12 d-flex flex-column align-items-start justify-content-start">
            <h2>Menús</h2>
            <p class="text-left">Administra tus menús para que tus clientes puedan escanearlos y verlos en su mesa.</p>
          </div>
        </div>
        <div v-if="isLoading" class="menu-grid">
          <MenuCardSkeleton v-for="n in 6" :key="n" />
        </div>
        <div v-else class="menu-grid">
          <div 
            v-for="menu in menus" 
            :key="menu.id" 
            class="menu-card"
            :class="{ 
              'default': menu.isDefault,
              'processing': processingMenuId === menu.id
            }"
            @click="toggleOverlay(menu.id)"
          >
            <div class="card-content">
              <div class="menu-cover"></div>
              <div class="menu-info">
                <span class="menu-name">{{ menu.name }}</span>
                <span v-if="menu.isDefault" class="menu-badge">PREDETERMINADO</span>
              </div>
            </div>
            <div class="menu-actions" :class="{ show: overlayMenuId === menu.id }" @click.stop>
                <button 
                  v-if="!menu.isPredefined" 
                  @click="setDefaultMenu(menu)" 
                  class="action-item"
                >
                  <span class="action-icon select"><i class="bi bi-check-lg"></i></span>
                  <span class="action-label">Seleccionar</span>
                </button>
                <button @click="handleViewMenu(menu)" class="action-item">
                  <span class="action-icon view"><i class="bi bi-eye-fill"></i></span>
                  <span class="action-label">Ver</span>
                </button>
                <button @click="renameMenuPrompt(menu)" class="action-item">
                  <span class="action-icon rename"><i class="bi bi-pencil-fill"></i></span>
                  <span class="action-label">Renombrar</span>
                </button>
                <button @click="downloadMenu(menu)" class="action-item">
                  <span class="action-icon download"><i class="bi bi-download"></i></span>
                  <span class="action-label">Descargar</span>
                </button>
                <button v-if="!menu.isPredefined" @click="deleteMenu(menu)" class="action-item">
                  <span class="action-icon delete"><i class="bi bi-trash-fill"></i></span>
                  <span class="action-label">Eliminar</span>
                </button>
            </div>
             <div v-if="processingMenuId === menu.id" class="processing-overlay">
              <div class="loading-spinner-small"></div>
            </div>
          </div>
          <div class="add-menu-card w-100" @click="handleAddMenu">
            ＋ Agregar menú (PDF)
          </div>
          <div class="debug-menu-card w-100" @click="debugUpload">
            🐛 DEBUG Upload Test
          </div>
         </div>
      </div>
    </div>
    <InputModal 
      v-model="showTableModal" 
      title="Nueva mesa" 
      label="Número de la mesa" 
      placeholder="Ej: 5"
      input-type="number"
      @confirm="confirmCreateTable"
    />
    
    <!-- Modal para editar mesa -->
    <BaseModal v-model="showEditTableModal" title="Editar Mesa">
      <div class="edit-table-content">
        <div class="form-group">
          <label for="edit-table-number">Número de la mesa:</label>
          <input 
            id="edit-table-number" 
            v-model.number="editTableData.number" 
            type="number" 
            class="form-control"
            min="1"
          />
        </div>
        <div class="form-group">
          <label for="edit-table-name">Nombre personalizado (opcional):</label>
          <input 
            id="edit-table-name" 
            v-model="editTableData.name" 
            type="text" 
            class="form-control"
            placeholder="Ej: Mesa VIP, Mesa Terraza..."
          />
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showEditTableModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="confirmEditTable">Guardar Cambios</button>
      </template>
    </BaseModal>
    <BaseModal v-model="showDownloadModal" title="Exportar Códigos QR">
      <div class="download-modal-content">
        <p>Selecciona el formato en el que deseas descargar los códigos QR.</p>
        <div class="form-group">
          <label for="format-select">Formato:</label>
          <select id="format-select" v-model="downloadFormat" class="form-control">
            <option value="pdf">PDF</option>
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
            <option value="zip">ZIP (PNGs comprimidos)</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showDownloadModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="confirmDownload">Descargar</button>
      </template>
    </BaseModal>
    <BaseModal v-model="showEmailModal" title="Enviar Códigos QR por Email">
      <div class="email-modal-content">
        <div class="form-group">
          <label for="recipients-input">Destinatarios (separa correos con coma):</label>
          <input id="recipients-input" v-model="emailRecipientsStr" type="text" class="form-control" placeholder="ej: correo@dominio.com, otro@dominio.com"/>
        </div>
        <div class="form-group">
          <label for="subject-input">Asunto:</label>
          <input id="subject-input" v-model="emailSubject" type="text" class="form-control"/>
        </div>
        <div class="form-group">
          <label for="body-input">Mensaje:</label>
          <textarea id="body-input" v-model="emailBody" class="form-control" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="email-format-select">Formato:</label>
          <select id="email-format-select" v-model="emailFormat" class="form-control">
            <option value="pdf">PDF</option>
            <option value="png">PNG</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="showEmailModal = false">Cancelar</button>
        <button class="btn btn-primary" @click="confirmSendEmail">Enviar</button>
      </template>
    </BaseModal>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import BaseModal from '@/components/UI/BaseModal.vue';
import InputModal from '@/components/UI/InputModal.vue'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/notifications'
import MenuCardSkeleton from '@/components/skeletons/MenuCardSkeleton.vue'
import TableListItemSkeleton from '@/components/skeletons/TableListItemSkeleton.vue'
import { api } from '@/services/api'
const router = useRouter();
const adminStore = useAdminStore();
const maxMenuSizeMB = 50;
const isLoading = computed(() => adminStore.isLoading);
const error = computed(() => adminStore.error);
const tables = computed(() => adminStore.tables);
const menus = computed(() => adminStore.menus);
const selectedTable = ref(null);
const qrImageUrl = ref('');
const activeTab = ref(localStorage.getItem('adminQRTab') || 'tables');
const showTableModal = ref(false)
const newTableName = ref('')
const showEditTableModal = ref(false)
const editTableData = ref({ id: null, number: null, name: '' })
const overlayMenuId = ref(null)
const processingMenuId = ref(null)
const selectedTables = ref([]);
const showDownloadModal = ref(false);
const downloadFormat = ref('pdf');
let downloadTarget = [];
const qrCodeImageUrl = ref('');
const isQrLoading = ref(false);
const showEmailModal = ref(false);
const emailFormat = ref('pdf');
const emailRecipientsStr = ref('');
const emailSubject = ref('Mesas QR');
const emailBody = ref('Te comparto los códigos.');
let emailTarget = [];
const isSelected = (table) => selectedTables.value.some(t => t.id === table.id);
const toggleSelection = (table) => {
  const index = selectedTables.value.findIndex(t => t.id === table.id);
  if (index === -1) {
    selectedTables.value.push(table);
  } else {
    selectedTables.value.splice(index, 1);
  }
};
const selectAll = (event) => {
  if (event.target.checked) {
    selectedTables.value = [...tables.value];
  } else {
    selectedTables.value = [];
  }
};
const selectTable = (table) => {
  selectedTable.value = table;
};
const setTab = (tab) => {
  activeTab.value = tab;
  localStorage.setItem('adminQRTab', tab);
};
const createTablePrompt = () => {
  newTableName.value = ''
  showTableModal.value = true
};
const confirmCreateTable = async (tableNumber) => {
  const num = parseInt(tableNumber, 10);
  if (isNaN(num) || num <= 0) {
    showErrorToast('Por favor, ingresa un número de mesa válido y mayor a cero.');
    return;
  }
  try {
    await adminStore.createTable({ number: num });
    showSuccessToast('Mesa creada correctamente');
  } catch (err) {
    showErrorToast(err.message || 'Error al crear la mesa');
  }
};

const editTablePrompt = (table) => {
  editTableData.value = {
    id: table.id,
    number: table.number,
    name: table.name || ''
  };
  showEditTableModal.value = true;
};

const confirmEditTable = async () => {
  if (!editTableData.value.number || editTableData.value.number <= 0) {
    showErrorToast('Por favor, ingresa un número de mesa válido y mayor a cero.');
    return;
  }
  
  try {
    const updateData = {
      number: editTableData.value.number,
      name: editTableData.value.name || null
    };
    
    await adminStore.updateTable(editTableData.value.id, updateData);
    showEditTableModal.value = false;
    
    // Update selected table if it's the one being edited
    if (selectedTable.value && selectedTable.value.id === editTableData.value.id) {
      const updatedTable = tables.value.find(t => t.id === editTableData.value.id);
      if (updatedTable) {
        selectedTable.value = updatedTable;
      }
    }
    
    showSuccessToast('Mesa actualizada correctamente');
  } catch (err) {
    showErrorToast(err.message || 'Error al actualizar la mesa');
  }
};

const deleteTablePrompt = async (table) => {
  const result = await Swal.fire({
    title: '¿Eliminar mesa?',
    html: `¿Estás seguro de que deseas eliminar la mesa <strong>${table.name || `MESA ${table.number}`}</strong>?<br><br><small class="text-danger">Esta acción no se puede deshacer y eliminará también su código QR.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await adminStore.deleteTable(table.id);
      
      // Clear selection if deleted table was selected
      if (selectedTable.value && selectedTable.value.id === table.id) {
        selectedTable.value = null;
      }
      
      // Remove from selected tables if it was selected
      selectedTables.value = selectedTables.value.filter(t => t.id !== table.id);
      
      showSuccessToast(`Mesa ${table.name || table.number} eliminada correctamente`);
    } catch (err) {
      showErrorToast(err.message || 'Error al eliminar la mesa');
    }
  }
};
const generateQrForSelectedTable = async () => {
  if (!selectedTable.value) return;
  try {
    // Determine action before API call
    const hasExistingQr = selectedTable.value.qr_code;
    const action = hasExistingQr ? 'regenerado' : 'generado';
    
    // Use regenerateQrCode for the "Regenerar QR" button to create a new QR code
    if (hasExistingQr) {
      await adminStore.regenerateQrCode(selectedTable.value.id);
    } else {
      // Use generateQrCode only for tables that don't have a QR code yet
      await adminStore.generateQrCode(selectedTable.value.id);
    }
    
    // Update the selected table with the fresh data from the store
    const updatedTable = tables.value.find(t => t.id === selectedTable.value.id);
    if (updatedTable) {
      selectedTable.value = updatedTable;
    }
    
    showSuccessToast(`Código QR ${action} exitosamente.`);
  } catch (error) {
    showErrorToast(error.message || 'Error al procesar código QR');
  }
};
const shareQrFile = async (table) => {
    if (!table || !table.qr_code) {
        showErrorToast('La mesa no tiene un QR para compartir.');
        return;
    }
    try {
        const resp = await api.post(
            '/admin/qr/export',
            { qr_ids: [table.qr_code.id], format: 'png' },
            { responseType: 'blob' }
        );
        const file = new File([resp.data], `QR_Mesa_${table.number}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Código QR para Mesa ${table.number}`,
                text: `Aquí está el código QR para la mesa ${table.number}.`
            });
        } else {
            const blobUrl = window.URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            showSuccessToast('Archivo descargado (el navegador no admite compartir).');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            showErrorToast('Error al intentar compartir el código QR.');
        }
    }
};
const handleAddMenu = async () => {
  const { value: file } = await Swal.fire({
    title: 'Selecciona un PDF',
    input: 'file',
    inputAttributes: {
      accept: 'application/pdf'
    },
    confirmButtonText: 'Subir',
    showCancelButton: true,
    cancelButtonText: 'Cancelar'
  })
  if (!file) return;
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMenuSizeMB) {
    showErrorToast(`El archivo (${sizeMB.toFixed(2)} MB) supera el límite de ${maxMenuSizeMB} MB`);
    return;
  }
  const { value: name } = await Swal.fire({
    title: 'Nombre del menú',
    input: 'text',
    inputValue: file.name.replace(/\.pdf$/i, ''),
    showCancelButton: true,
    confirmButtonText: 'Guardar'
  })
  if (!name) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name);
  await adminStore.uploadMenu(fd);
  showSuccessToast('Menú subido');
};

const debugUpload = async () => {
  try {
    const response = await api.post('/debug/fix-php-limits', {})

    console.log('🐛 DEBUG RESULT:', response.data);
    
    Swal.fire({
      title: '✅ DEBUG Success',
      text: response.data,
      icon: 'success'
    });
  } catch (error) {
    console.error('🐛 DEBUG ERROR:', error);
    Swal.fire({
      title: '❌ DEBUG Error',
      text: error.message || 'Error al ejecutar el debug',
      icon: 'error'
    });
  }
};

const toggleOverlay = (menuId) => {
  overlayMenuId.value = overlayMenuId.value === menuId ? null : menuId
}
const handleViewMenu = async (menu) => {
  const url = await adminStore.previewMenu(menu.id)
  if (url) window.open(url, '_blank')
}
const renameMenuPrompt = async (menu) => {
  const { value: newName } = await Swal.fire({
    title: 'Nuevo nombre',
    input: 'text',
    inputValue: menu.name,
    showCancelButton: true
  })
  if (newName && newName !== menu.name) {
    processingMenuId.value = menu.id;
    try {
      await adminStore.renameMenu(menu.id, newName)
      showSuccessToast('Nombre cambiado')
      overlayMenuId.value = null
    } catch (err) {
      showErrorToast(err.message || 'Error al renombrar menú')
    } finally {
      processingMenuId.value = null;
    }
  }
}
const setDefaultMenu = async (menu) => {
  processingMenuId.value = menu.id;
  try {
    await adminStore.setDefaultMenu(menu.id)
    showSuccessToast('Menú predeterminado actualizado')
    overlayMenuId.value = null
  } catch (err) {
    showErrorToast(err.message || 'Error al establecer menú predeterminado');
  } finally {
    processingMenuId.value = null;
  }
}
const downloadMenu = async (menu) => {
  processingMenuId.value = menu.id;
  try {
    const response = await api.get(`/menus/${menu.id}/download`, {
      responseType: 'blob', // Importante para manejar la respuesta como un archivo
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `${menu.name}.pdf`; // Nombre por defecto
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    overlayMenuId.value = null;
  } catch (error) {
    showErrorToast(error.message || 'Error al descargar el archivo.');
  } finally {
    processingMenuId.value = null;
  }
}
const deleteMenu = async (menu) => {
  if (menu.isPredefined) {
    showErrorToast('No puedes eliminar el menú predeterminado.');
    return
  }
  const res = await Swal.fire({
    title: `¿Eliminar "${menu.name}"?`,
    text: 'Esta acción es irreversible',
    icon: 'warning',
    showCancelButton: true
  })
  if (res.isConfirmed) {
    processingMenuId.value = menu.id;
    try {
      await adminStore.deleteMenu(menu.id)
      showSuccessToast('Menú eliminado')
      overlayMenuId.value = null
    } catch(err) {
       showErrorToast(err.message || 'Error al eliminar el menú');
    } finally {
      processingMenuId.value = null;
    }
  }
}
const openDownloadModal = (tablesToDownload) => {
    downloadTarget = tablesToDownload;
    showDownloadModal.value = true;
};
const confirmDownload = async () => {
    showDownloadModal.value = false;
    const qrIds = downloadTarget
        .filter(t => t.qr_code && t.qr_code.id)
        .map(t => t.qr_code.id);
    if (qrIds.length === 0) {
        showErrorToast('Ninguna de las mesas seleccionadas tiene un QR para exportar.');
        return;
    }
    const format = downloadFormat.value;
    try {
        const response = await api.post('/admin/qr/export', 
            { qr_ids: qrIds, format: format },
            { responseType: 'blob' }
        );
        const blobUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        const contentDisposition = response.headers['content-disposition'];
        let fileName;
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length === 2) {
                fileName = fileNameMatch[1];
            }
        }
        if (!fileName) {
            const extension = format;
            if (qrIds.length === 1) {
                const table = downloadTarget.find(t => t.qr_code && t.qr_code.id === qrIds[0]);
                fileName = `QR_Mesa_${table.number}.${extension}`;
            } else {
                fileName = `QRs_Export.${extension}`;
            }
        }
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        showErrorToast('Error al exportar los códigos QR.');
    }
};
const openEmailModal = (tablesToSend) => {
    emailTarget = tablesToSend;
    showEmailModal.value = true;
};
const confirmSendEmail = async () => {
    showEmailModal.value = false;
    const recipients = emailRecipientsStr.value.split(',').map(r => r.trim()).filter(r => r);
    if (recipients.length === 0) {
        showErrorToast('Ingresa al menos un destinatario.');
        return;
    }
    const qrIds = emailTarget
        .filter(t => t.qr_code && t.qr_code.id)
        .map(t => t.qr_code.id);
    if (qrIds.length === 0) {
        showErrorToast('Ninguna de las mesas seleccionadas tiene un QR para enviar.');
        return;
    }
    const payload = {
        qr_ids: qrIds,
        format: emailFormat.value,
        recipients,
        subject: emailSubject.value,
        body: emailBody.value
    };
    try {
        await api.post('/admin/qr/email', payload);
        showSuccessToast('Correo enviado correctamente.');
    } catch (error) {
        showErrorToast(error.message || 'Error al enviar el correo.');
    }
};
onMounted(() => {
  adminStore.fetchTables();
  adminStore.fetchMenus();
});
watch(selectedTable, async (newTable) => {
  if (qrCodeImageUrl.value) {
    URL.revokeObjectURL(qrCodeImageUrl.value);
    qrCodeImageUrl.value = '';
  }
  if (newTable && newTable.qr_code) {
    isQrLoading.value = true;
    try {
      const response = await api.get(`/admin/qr/preview/${newTable.id}`, { responseType: 'blob' });
      qrCodeImageUrl.value = URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error fetching QR code image:', error);
      showErrorToast('No se pudo cargar la imagen del QR.');
    } finally {
      isQrLoading.value = false;
    }
  }
});

// Watch for changes in the tables array to update selected table if it was modified
watch(tables, (newTables) => {
  if (selectedTable.value) {
    const updatedSelectedTable = newTables.find(t => t.id === selectedTable.value.id);
    if (updatedSelectedTable && updatedSelectedTable !== selectedTable.value) {
      selectedTable.value = updatedSelectedTable;
    }
  }
}, { deep: true });
</script>
<style scoped lang="scss">
.qr-management-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}
.tabs-header {
  display: flex;
  background: white;
  padding: 0 1.5rem;
  border-bottom: 1px solid #dee2e6;
}
.tab-button {
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  border-bottom: 2px solid transparent;
  &.active {
    color: #6A3FEA;
    border-bottom-color: #6A3FEA;
  }
}
.main-layout {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}
.tables-panel {
  width: 300px;
  background: #fff;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
.tables-list {
  flex-grow: 1;
  overflow-y: auto;
}
.table-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f1f3f5;
    
    .table-actions {
      opacity: 1;
      visibility: visible;
    }
  }
  
  &.active {
    background: #e9e4f8;
    border-color: #6A3FEA;
    font-weight: 600;
    
    .table-actions {
      opacity: 1;
      visibility: visible;
    }
  }
  
  .table-name {
    flex: 1;
    margin-left: 0.5rem;
  }
}

.table-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &.edit {
    background-color: #ffc107;
    color: #000;
    
    &:hover {
      background-color: #e0a800;
      transform: scale(1.05);
    }
  }
  
  &.delete {
    background-color: #dc3545;
    color: white;
    
    &:hover {
      background-color: #c82333;
      transform: scale(1.05);
    }
  }
}
.form-check-input {
  margin: 0;
}
.qr-display-panel {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}
.qr-content {
  text-align: center;
}
.qr-image {
  max-width: 300px;
  border: 1px solid #dee2e6;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.qr-image-loader, .qr-image-error {
  width: 300px;
  height: 300px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
  gap: 0.5rem;
  color: #6c757d;
  .loading-spinner-small {
    width: 50px;
    height: 50px;
  }
  i {
    font-size: 3rem;
  }
}
.qr-placeholder {
  text-align: center;
  color: #6c757d;
  .bi {
    font-size: 5rem;
    margin-bottom: 1rem;
  }
}
.form-group {
  margin-bottom: 1rem;
  label {
    display: block;
    margin-bottom: .5rem;
    font-weight: 500;
  }
  input, select {
    width: 100%;
    padding: .75rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
  }
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  &-primary {
    background-color: #6A3FEA;
    color: white;
  }
  &-secondary {
    background-color: #e9ecef;
  }
  &-danger {
    background-color: #dc3545;
    color: white;
  }
}
.menu-layout {
  padding: 1rem;
}
.menu-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
}
.menu-card, .add-menu-card {
  width: 160px;
  background: #FAF4E8;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
  &:hover {
    transform: translateY(-4px);
  }
}
.menu-card {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all .2s ease-in-out;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0,0,0,0.29);
  }
  &.default .menu-badge {
    background: #1e40af;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    position: absolute;
    top: 15px;
    left: 0;
  }
  &.processing .card-content {
    filter: blur(4px);
  }
}
.menu-cover {
  width: 100%;
  height: 120px;
  background: url('https://cdn-icons-png.flaticon.com/512/1046/1046784.png') center/contain no-repeat;
}
.menu-info {
  margin-top: 0.5rem;
  text-align: center;
}
.menu-name {
  font-weight: 600;
}
.add-menu-card {
  background: none;
  border: 2px dashed #1e40af;
  color: #1e40af;
  font-weight: 600;
}

.debug-menu-card {
  background: none;
  border: 2px dashed #dc2626;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.9rem;
}
.card-content {
  transition: filter .2s ease;
  width: 100%;
}
.menu-actions {
  position: absolute;
  inset: 0;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  place-items: center;
  gap: 0.3rem 0rem;
  padding: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  &.show {
    opacity: 1;
    pointer-events: auto;
  }
}
.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  max-width: 120px;
  text-align: center;
  padding: 0;
  .action-icon{
    font-size: 16px;
  }
  .action-label{
    font-size: 10px;
  }
  &:hover .action-icon {
    transform: scale(1.1);
  }
}
.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: white;
  flex-shrink: 0;
  transition: transform 0.2s;
  &.select { background-color: #28a745; }
  &.view { background-color: #0d6efd; }
  &.rename { background-color: #ffc107; }
  &.download { background-color: #0dcaf0; }
  &.delete { background-color: #dc3545; }
  &.share { background-color: #6f42c1; }
}
.processing-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255,255,255,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
.loading-spinner-small {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0,0,0,0.2);
  border-top-color: var(--primary-color, #a57cb9);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.share-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 1rem 0;
  width: 100%;
  max-width: 300px;
}
.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  i {
    font-size: 1.2rem;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  &.download { color: #007bff; }
  &.whatsapp { color: #25D366; }
  &.telegram { color: #0088cc; }
  &.email { color: #dc3545; }
  &.share { color: #6f42c1; }
}
.select-all-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #dee2e6;
}
.qr-display-multiple {
  text-align: center;
  padding: 2rem;
}
.download-modal-content {
  p {
    margin-bottom: 1rem;
  }
  .form-group {
    label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    select {
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ced4da;
    }
  }
}
.table-actions {
  button {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    &:hover {
      opacity: 1;
      color: #6A3FEA;
    }
  }
}
.email-modal-content {
  .form-group {
    label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    input, textarea, select {
      width: 100%;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ced4da;
    }
  }
}

.edit-table-content {
  .form-group {
    margin-bottom: 1rem;
    
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #495057;
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: #6A3FEA;
        box-shadow: 0 0 0 0.2rem rgba(106, 63, 234, 0.25);
      }
    }
    
    input[type="number"] {
      -moz-appearance: textfield;
      
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }
}
</style>