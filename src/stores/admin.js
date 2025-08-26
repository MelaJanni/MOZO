import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, apiService } from '@/services/api'

export const useAdminStore = defineStore('admin', () => {
  const businessId = ref(localStorage.getItem('businessId') || null)
  const businessData = ref(null)
  const activeBusinessId = ref(null)
  const tablesCount = ref(0)
  const menusCount = ref(0)
  const qrCodesCount = ref(0)
  const invitationCode = ref(null)
  const invitationUrl = ref(null)
  const availableBusinesses = ref([])
  const allBusinesses = ref([])
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
  const requiresBusinessSetup = ref(false)
  
  const hasMenus = computed(() => menus.value.length > 0)
  const hasTables = computed(() => tables.value.length > 0)
  const pendingRequests = computed(() => staffRequests.value.filter(req => req.status === 'pending'))
  
  const fetchBusinessData = async (force = false) => {
    // Si ya tenemos datos de negocio y no forzamos la recarga, devolver los existentes
    if (!force && businessData.value && businessData.value.id) {
      return businessData.value
    }
    
    isLoading.value = true
    error.value = null
    try {
      const resp = await apiService.getBusinessInfo()
      const data = resp.data.business || {}
      
      //console.log('🔍 Respuesta de la API:', data)
      
      // Verificar si requiere setup de negocio
      requiresBusinessSetup.value = data.requires_business_setup === true

      //console.log('📊 requiresBusinessSetup establecido a:', requiresBusinessSetup.value)

      if (requiresBusinessSetup.value) {
        // No hay negocios, retornar estado de setup
        //console.log('✅ Retornando estado de setup')
        return {
          requires_business_setup: true
        }
      }
      
      const business = data.business || data
      businessData.value = business
      // campos adicionales del contrato
      activeBusinessId.value = data.active_business_id ?? business?.id ?? null
      tablesCount.value = data.tables_count ?? 0
      menusCount.value = data.menus_count ?? 0
      qrCodesCount.value = data.qr_codes_count ?? 0
      invitationCode.value = data.invitation_code ?? null
      invitationUrl.value = data.invitation_url ?? null
      availableBusinesses.value = Array.isArray(data.available_businesses) ? data.available_businesses : []

      if (activeBusinessId.value) {
        businessId.value = activeBusinessId.value
        localStorage.setItem('businessId', String(activeBusinessId.value))
      } else if (business && business.id) {
        businessId.value = business.id
        localStorage.setItem('businessId', String(business.id))
      }
      return {
        business: businessData.value,
        active_business_id: activeBusinessId.value,
        tables_count: tablesCount.value,
        menus_count: menusCount.value,
        qr_codes_count: qrCodesCount.value,
        invitation_code: invitationCode.value,
        invitation_url: invitationUrl.value,
  available_businesses: availableBusinesses.value
      }
    } catch (err) {
      error.value = err.message || 'Error al cargar datos del negocio'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Listar todos los negocios del admin
  const fetchAllBusinesses = async () => {
    // Si ya tenemos los datos y no han pasado más de 2 minutos, no hacer la petición
    if (availableBusinesses.value && availableBusinesses.value.length > 0) {
      return availableBusinesses.value
    }
    
    isLoading.value = true
    error.value = null
    try {
      const resp = await apiService.getAdminBusinesses()
      const list = resp.data?.businesses ?? resp.data
      allBusinesses.value = Array.isArray(list) ? list : []
      // También actualizar availableBusinesses para el selector
      availableBusinesses.value = allBusinesses.value
      return allBusinesses.value
    } catch (err) {
      error.value = err.message || 'Error al listar negocios'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Cambiar negocio activo: usa POST /role/select { role, business_id }
  const selectActiveBusiness = async (businessIdToSelect) => {
    isLoading.value = true
    error.value = null
    try {
      // Solicitamos token (puede o no venir uno nuevo, el backend lo permite reutilizar)
      const resp = await apiService.selectRole('admin', businessIdToSelect)
      const data = resp.data || {}
      // Si viene un token nuevo, el interceptor ya lo guarda; aquí solo reflejamos estado local
      activeBusinessId.value = businessIdToSelect
      businessId.value = businessIdToSelect
      localStorage.setItem('businessId', String(businessIdToSelect))
      // refrescar datos dependientes del negocio
      await Promise.all([
        fetchBusinessData(),
        fetchTables(),
        fetchMenus()
      ])
      return data
    } catch (err) {
      error.value = err.message || 'Error al seleccionar negocio'
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
      tables.value = resp.data?.tables || resp.data || []
      return tables.value
    } catch (err) {
      error.value = err.message || 'Error al obtener mesas'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const createTable = async (tableData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const resp = await apiService.createTable(tableData)
      const tbl = resp.data?.table || resp.data
      if (tbl) tables.value.push(tbl)
      return tbl
    } catch (err) {
      error.value = err.message || 'Error al crear mesa'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const updateTable = async (tableId, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.updateTable(tableId, data)
      const updated = response.data?.table || response.data
      const index = tables.value.findIndex(t => t.id === tableId)
      if (index !== -1 && updated) tables.value[index] = updated
      return updated
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

  const approveStaffRequest = async (staffId, approvalData = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.approveStaff(staffId, approvalData)
      
      // Actualizar listas locales
      await fetchStaffRequests()
      await fetchStaff()
      
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al aprobar solicitud'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const rejectStaffRequest = async (staffId, rejectionData = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.rejectStaff(staffId, rejectionData)
      
      // Actualizar listas locales
      await fetchStaffRequests()
      await fetchArchivedRequests()
      
      return response.data
    } catch (err) {
      error.value = err.message || 'Error al rechazar solicitud'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const inviteStaffMember = async (staffId) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiService.inviteStaffMember(staffId)
      
      // Actualizar listas locales
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
      // construir payload: [{ menu_id, display_order }]
      const order = orderedIds.map((id, idx) => ({ menu_id: id, display_order: idx + 1 }))
      await apiService.reorderMenus(order)
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

  const regenerateQrCode = async (tableId) => {
    isLoading.value = true
    error.value = null
    try {
      await apiService.regenerateQRCode(tableId)
      await fetchTables()
    } catch (err) {
      error.value = err.message || 'Error al regenerar código QR'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getSettings = async () => {
    const resp = await apiService.getSettings()
    return resp.data?.settings || resp.data
  }

  const updateBusinessData = async (settings) => {
    const resp = await apiService.updateSettings({ settings })
    return resp.data?.settings || resp.data
  }

  const regenerateInvitation = async () => {
    const resp = await apiService.regenerateInvitationCode()
    const data = resp.data || {}
    invitationCode.value = data.invitation_code ?? invitationCode.value
    invitationUrl.value = data.invitation_url ?? invitationUrl.value
    return data
  }

  const createBusiness = async (businessData) => {
    isLoading.value = true
    error.value = null
    try {
      const resp = await apiService.createBusiness(businessData)
      const data = resp.data || {}
      if (resp.status === 201 || data.business) {
        // OK
      }
      
      // El negocio fue creado exitosamente
      businessData.value = data.business
      businessId.value = data.business?.id
      activeBusinessId.value = data.business?.id
      invitationCode.value = data.business?.invitation_code
      invitationUrl.value = data.invitation_url
      requiresBusinessSetup.value = false
      
      // Guardar en localStorage
      if (businessId.value) {
        localStorage.setItem('businessId', String(businessId.value))
      }
      
      return data
    } catch (err) {
      // Si es validación 422, mapear errores
      if (err.response && err.response.status === 422) {
        const errors = err.response.data?.errors
        const first = errors && Object.values(errors)[0]?.[0]
        error.value = first || err.response.data?.message || 'Los datos proporcionados no son válidos'
      } else {
        error.value = err.message || 'Error al crear negocio'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const joinBusinessWithCode = async (invitationCode) => {
    isLoading.value = true
    error.value = null
    try {
      const resp = await apiService.joinBusiness(invitationCode)
      const data = resp.data || {}
      
      // Se unió al negocio exitosamente
      businessData.value = data.business
      businessId.value = data.business?.id
      activeBusinessId.value = data.business?.id
      requiresBusinessSetup.value = false
      
      // Guardar en localStorage
      if (businessId.value) {
        localStorage.setItem('businessId', String(businessId.value))
      }
      
      // Recargar datos del negocio
      await fetchBusinessData()
      
      return data
    } catch (err) {
      error.value = err.message || 'Error al unirse al negocio'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  return {
      businessId,
    businessData,
  activeBusinessId,
  tablesCount,
  menusCount,
  qrCodesCount,
  invitationCode,
  invitationUrl,
  availableBusinesses,
  allBusinesses,
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
    requiresBusinessSetup,
    
      hasMenus,
    hasTables,
    pendingRequests,
    
      fetchBusinessData,
  fetchAllBusinesses,
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
    approveStaffRequest,
    rejectStaffRequest,
    inviteStaffMember,
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
  generateQrCode,
  regenerateQrCode,
  getSettings,
  updateBusinessData,
  regenerateInvitation,
  selectActiveBusiness,
  createBusiness,
  joinBusinessWithCode
  }
}) 