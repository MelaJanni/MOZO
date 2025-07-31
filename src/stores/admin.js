import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, apiService } from '@/services/api'

export const useAdminStore = defineStore('admin', () => {
  const businessId = ref(localStorage.getItem('businessId') || null)
  const businessData = ref(null)
  const menus = ref([])
  const tables = ref([])
  const staffRequests = ref([])
  const archivedRequests = ref([])
  const staff = ref([])
  const statistics = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const staffLinks = ref({ next: null, prev: null })
  const staffMeta = ref({ current_page: 1, last_page: 1 })
  
  const hasMenus = computed(() => menus.value.length > 0)
  const hasTables = computed(() => tables.value.length > 0)
  const pendingRequests = computed(() => staffRequests.value.filter(req => req.status === 'pending'))
  
  const fetchBusinessData = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      businessData.value = {
        id: 'rest-1',
        name: 'Mi Restaurante',
        address: 'Calle Principal 123',
        phone: '+34 678 123 456',
        email: 'contacto@mirestaurante.com',
        logo: '/src/assets/mozo-logo.svg',
        description: 'El mejor restaurante de la ciudad',
        openingHours: {
          monday: { open: '12:00', close: '23:00' },
          tuesday: { open: '12:00', close: '23:00' },
          wednesday: { open: '12:00', close: '23:00' },
          thursday: { open: '12:00', close: '23:00' },
          friday: { open: '12:00', close: '00:00' },
          saturday: { open: '12:00', close: '00:00' },
          sunday: { open: '12:00', close: '23:00' }
        },
        tables: 20,
        capacity: 80,
        averageRating: 4.5
      }
      
      if (!businessId.value) {
        businessId.value = businessData.value.id
        localStorage.setItem('businessId', businessData.value.id)
      }
      
      return businessData.value
    } catch (err) {
      error.value = err.message || 'Error al cargar datos del negocio'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchMenus = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.getMenus()
      const rawSource = resp.data?.menus ?? resp.data
      const raw = Array.isArray(rawSource) ? rawSource : []
      menus.value = raw.map(m => ({
        id: m.id,
        name: m.name,
        url: m.view_url || m.file_path,
        thumbnailUrl: m.preview_url || m.thumbnail_url || '/src/assets/pdf-thumb.png',
        isDefault: m.is_default
      }))
      
      return menus.value
    } catch (err) {
      error.value = err.message || 'Error al cargar menús'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const setDefaultMenu = async (menuId) => {
    isLoading.value = true
    error.value = null
    
    try {
      await apiService.setDefaultMenu({ menu_id: menuId })
      await fetchMenus()
      return true
    } catch (err) {
      error.value = err.message || 'Error al establecer menú predeterminado'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const uploadMenu = async (formData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.uploadMenu(formData)
      await fetchMenus()
      return resp.data
    } catch (err) {
      error.value = err.message || 'Error al subir menú'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchTables = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.getTables()
      tables.value = resp.data.tables || []
      
      return true
    } catch (err) {
      error.value = err.message || 'Error al obtener mesas'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const createTable = async (tableData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.createTable(tableData)
      await fetchTables()
      return true
    } catch (err) {
      error.value = err.message || 'Error al crear mesa'
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  const updateTable = async (tableId, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.updateTable(tableId, data)
      const index = tables.value.findIndex(t => t.id === tableId)
      if (index !== -1) {
        tables.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al actualizar mesa'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteTable = async (tableId) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.deleteTable(tableId)
      tables.value = tables.value.filter(t => t.id !== tableId)
      return true
    } catch (err) {
      error.value = err.message || 'Error al eliminar mesa'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchStaffRequests = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiService.getStaffRequests()
      const rawSource = response.data?.requests ?? response.data
      const raw = Array.isArray(rawSource) ? rawSource : []
      staffRequests.value = raw
      return staffRequests.value
    } catch (err) {
      error.value = err.message || 'Error al cargar solicitudes de personal'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchArchivedRequests = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.getArchivedStaffRequests()
      const rawSource = response.data?.archived_requests ?? response.data?.requests ?? response.data
      const raw = Array.isArray(rawSource) ? rawSource : []
      archivedRequests.value = raw
      return archivedRequests.value
    } catch (err) {
      error.value = err.message || 'Error al cargar solicitudes archivadas'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const handleStaffRequest = async (requestId, action) => {
    isLoading.value = true
    error.value = null
    
    try {
      await apiService.handleStaffRequest(requestId, { action })
      
      await fetchStaffRequests()
      await fetchArchivedRequests()
      if (action === 'confirm') {
        await fetchStaff()
      }
      
      return true
    } catch (err) {
      error.value = err.message || 'Error al procesar solicitud'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchStaff = async (pageOrUrl = 1) => {
    isLoading.value = true
    error.value = null
    try {
      const response = typeof pageOrUrl === 'string'
        ? await api.get(pageOrUrl.replace(api.defaults.baseURL + '/', ''))
        : await apiService.getStaff(pageOrUrl)

      const rawSource = response.data?.staff ?? response.data?.data ?? response.data
      staff.value = Array.isArray(rawSource) ? rawSource : []

      staffLinks.value = {
        next: response.data?.links?.next ?? null,
        prev: response.data?.links?.prev ?? null
      }
      staffMeta.value = {
        current_page: response.data?.meta?.current_page ?? 1,
        last_page: response.data?.meta?.last_page ?? 1
      }
      return staff.value
    } catch (err) {
      error.value = err.message || 'Error al cargar el personal'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchDashboardStats = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.getAdminStatistics()
      const stats = resp.data?.statistics ?? resp.data
      return stats
    } catch (err) {
      error.value = err.message || 'Error al cargar estadísticas'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchStaffMember = async (staffId) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiService.getStaffMember(staffId)
      const data = response.data?.staff ?? response.data
      return data
    } catch (err) {
      error.value = err.message || 'Error al cargar datos del miembro del personal'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const updateStaffMember = async (staffId, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.updateStaffMember(staffId, data)
      const index = staff.value.findIndex(s => s.id === staffId)
      if (index !== -1) {
        staff.value[index] = { ...staff.value[index], ...response.data }
      }
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al actualizar miembro del personal'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const removeStaff = async (staffId) => {
    isLoading.value = true
    error.value = null
    
    try {
      await apiService.removeStaff(staffId)
      staff.value = staff.value.filter(s => s.id !== staffId)
      return true
    } catch (err) {
      error.value = err.message || 'Error al eliminar miembro del personal'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const inviteStaff = async (inviteData) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.inviteStaff(inviteData)
      await fetchStaffRequests()
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al enviar invitación'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const addReview = async (staffId, reviewData) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.addReview(staffId, reviewData)
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al añadir reseña'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const deleteReview = async (staffId, reviewId) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.deleteReview(staffId, reviewId)
      return true
    } catch (err) {
      error.value = err.message || 'Error al eliminar reseña'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const renameMenu = async (menuId, newName) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.renameMenu(menuId, { name: newName })
      await fetchMenus()
      return true
    } catch (err) {
      error.value = err.message || 'Error al renombrar menú'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteMenu = async (menuId) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.deleteMenu(menuId)
      await fetchMenus()
      return true
    } catch (err) {
      error.value = err.message || 'Error al eliminar menú'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reorderMenus = async (orderedIds) => {
    try {
      await apiService.reorderMenus(orderedIds)
      menus.value.sort((a,b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
    } catch (err) {
      console.error('Error reordenando menús', err)
    }
  }

  const previewMenu = async (menuId) => {
    try {
      const resp = await apiService.previewMenu(menuId)
      return URL.createObjectURL(resp.data)
    } catch (err) {
      console.error('Error obteniendo preview', err)
      return null
    }
  }

  const cloneTable = async (tableId, data) => {
    isLoading.value = true
    try {
      const resp = await apiService.cloneTable(tableId, data)
      tables.value.push(resp.data)
    } catch (err) {
      console.error('Error clonando mesa', err)
    } finally {
      isLoading.value = false
    }
  }

  const generateQrCode = async (tableId) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.generateQRCode(tableId)
      await fetchTables()
    } catch (err) {
      error.value = err.message || 'Error al generar código QR'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  return {
      businessId,
    businessData,
    menus,
    tables,
    staffRequests,
    archivedRequests,
    staff,
    statistics,
    isLoading,
    error,
    staffLinks,
    staffMeta,
    
      hasMenus,
    hasTables,
    pendingRequests,
    
      fetchBusinessData,
    fetchMenus,
    setDefaultMenu,
    uploadMenu,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    fetchStaffRequests,
    fetchArchivedRequests,
    handleStaffRequest,
    fetchStaff,
    inviteStaff,
    fetchDashboardStats,
    fetchStaffMember,
    updateStaffMember,
    removeStaff,
    addReview,
    deleteReview,
    renameMenu,
    deleteMenu,
    reorderMenus,
    previewMenu,
    cloneTable,
    generateQrCode
  }
}) 