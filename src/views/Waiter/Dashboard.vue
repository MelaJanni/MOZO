<template>
  <!-- Wrapper con layout compartido de header -->
  <MozoHeaderLayout>
    <template #right>
      <button class="p-2 rounded-md hover:bg-white/20" @click="ui.toggleNotifSidebar()" aria-label="Notificaciones">
        <MozoIcon name="bell" :size="22" />
      </button>
    </template>
    <div v-if="loading" class="flex items-center justify-center h-[60vh]">
      <div class="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-[var(--color-primary)] rounded-full" role="status" aria-label="Cargando"></div>
    </div>
    <div v-else class="dashboard-content row">
      <!-- Estado: Sin negocio asociado -->
  <div v-if="needsBusiness" class="col-12">
        <div class="needs-business-wrap">
        <div class="mozo-card needs-business-card">
          <div class="nb-hero">
    <MozoIcon name="store" :size="28" />
          </div>
          <h3 class="nb-title">Asóciate a un negocio</h3>
          <p class="nb-sub">Para usar el dashboard necesitas estar asociado a un negocio. Ingresa el código de invitación o revisa tus invitaciones pendientes.</p>
          <div class="nb-actions">
    <button class="btn btn-secondary" @click="showAddBusinessModal = true"><MozoIcon name="key" :size="18" class="mr-1"/> Ingresar código</button>
    <button class="btn btn-primary" @click="$router.push('/staff/invitations')"><MozoIcon name="envelopeOpen" :size="18" class="mr-1"/> Ver Invitaciones</button>
          </div>
        </div>
        </div>
      </div>
  <template v-else>
  <!-- Header Usuario -->
  <div class="header-user pt-0 col-12 px-0">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <h5 class="user-name">{{ displayName }}</h5>
          <p class="user-time">{{ nowString }}</p>
        </div>
  <div class="notification-badge" v-show="newPendingCount > 0">{{ newPendingCount }}</div>
      </div>
    
      <!-- Dropdown Cards -->
      <div class="dropdown-cards col-12 d-flex justify-content-center align-items-center px-0">
        <div class="row justify-content-between row__width">
          <!-- Dropdown Selector de Negocio -->
          <div class="dropdown-card col me-1" @click="showBusinessDropdown = !showBusinessDropdown">
            <div class="dropdown-icon"><MozoIcon name="building" :size="20" /></div>
            <div class="dropdown-content">
              <h6 class="dropdown-title">{{ currentBusiness?.name || "Sin negocio" }}</h6>
              <p class="dropdown-subtitle">{{ currentBusiness?.type || "Seleccionar negocio" }}</p>
            </div>
            <div class="dropdown-arrow"><MozoIcon name="chevronRight" :size="18" /></div>
          </div>
          
          <!-- Dropdown Selector de Perfiles -->
          <div class="dropdown-card col ms-1" @click="showBusinessDropdown = false; showProfilesDropdown = !showProfilesDropdown">
            <div class="dropdown-icon"><MozoIcon name="mapPin" :size="20" /></div>
            <div class="dropdown-content">
              <h6 class="dropdown-title">{{ getActiveProfileName() }}</h6>
              <p class="dropdown-subtitle">{{ assignedTables.length }} mesa{{ assignedTables.length === 1 ? '' : 's' }}</p>
            </div>
            <div class="dropdown-arrow"><MozoIcon name="chevronRight" :size="18" /></div>
          </div>
        </div>
      </div>

  <!-- Business BottomSheet -->
      <BottomSheet
        v-model="showBusinessDropdown"
        title="Seleccionar Negocio"
        subtitle="Elige el restaurante donde estás trabajando"
        sheet-class="violet"
        @after-leave="onBusinessSheetAfterLeave"
      >
        <button class="bs-add-btn" @click="queueOpenAddBusiness">+ Agregar Negocio</button>
        <div class="bs-list mt-3">
          <button
            v-for="b in businesses"
            :key="b.id"
            class="bs-item"
            :class="{ active: currentBusiness?.id === b.id }"
            @click="selectBusiness(b)"
          >
            <div class="left">
              <div class="bs-ico"><MozoIcon name="building" :size="18" /></div>
              <div>
                <div class="bs-name">{{ b.name }}</div>
                <div class="bs-sub">{{ b.type || 'Restaurante' }} • {{ b.address || 'Sin dirección' }}</div>
              </div>
            </div>
            <div class="bs-right">
              <MozoIcon v-if="currentBusiness?.id === b.id" name="check" :size="16" />
              <MozoIcon v-else name="chevronRight" :size="16" />
            </div>
          </button>
        </div>
      </BottomSheet>

  <!-- Profiles BottomSheet -->
      <BottomSheet
        v-model="showProfilesDropdown"
        title="Perfil de Mesas"
        subtitle="Selecciona qué área de mesas quieres gestionar"
        sheet-class="violet"
      >
        <button class="bs-add-btn" @click="showProfilesManager = true; showProfilesDropdown = false">+ Gestionar Perfiles</button>

        <!-- Loading de perfiles -->
        <div v-if="state.profilesLoading" class="bs-loading mt-3">
          <MozoIcon name="loader" :size="16" class="animate-spin"/>
          <span>Cargando perfiles...</span>
        </div>

        <div v-else class="bs-list mt-3">
          
          <!-- Opción para mostrar todas las mesas -->
          <button class="bs-item" :class="{ active: selectedProfileId === null }" @click="selectProfile(null)">
            <div class="left">
              <div class="bs-ico"><MozoIcon name="table" :size="18"/></div>
              <div>
                <div class="bs-name">Todas las Mesas</div>
                <div class="bs-sub">Ver todas las mesas asignadas • {{ assignedTables.length }} mesas</div>
              </div>
            </div>
            <div class="bs-right">
              <MozoIcon v-if="selectedProfileId === null" name="check" :size="16" />
              <MozoIcon v-else name="chevronRight" :size="16" />
            </div>
          </button>
          
          <!-- Perfiles reales del backend -->
          <button 
            v-for="profile in state.availableProfiles" 
            :key="profile.id"
            class="bs-item" 
            :class="{ active: selectedProfileId === profile.id }" 
            @click="selectProfile(profile.id)"
          >
            <div class="left">
              <div class="bs-ico"><MozoIcon name="bookmark" :size="18"/></div>
              <div>
                <div class="bs-name">{{ profile.name }}</div>
                <div class="bs-sub">{{ profile.description || 'Perfil personalizado' }} • {{ getProfileTablesInfo(profile) }}</div>
              </div>
            </div>
            <div class="bs-right">
              <MozoIcon v-if="selectedProfileId === profile.id" name="check" :size="16" />
              <MozoIcon v-else name="chevronRight" :size="16" />
            </div>
          </button>
          
          <!-- Estado vacío si no hay perfiles -->
          <div v-if="state.availableProfiles.length === 0" class="bs-empty">
            <div class="empty-icon">
              <MozoIcon name="bookmark" :size="18" />
            </div>
            <div class="empty-text">
              <h4>No tienes perfiles creados</h4>
              <p>Crea perfiles para agrupar mesas por áreas</p>
            </div>
          </div>
        </div>
      </BottomSheet>

      

  <!-- Tabs de notificaciones -->
      <div class="tabs-container col-12 d-flex justify-content-center align-items-center">
        <div class="row w-100 justify-content-between">
          <button class="tab-item col-4" :class="{ active: activeNotificationTab === 'pendientes' }" @click="activeNotificationTab = 'pendientes'">
            Pendientes
            <span class="tab-badge" v-show="newPendingCount > 0">{{ newPendingCount }}</span>
          </button>
          <button class="tab-item col-4" :class="{ active: activeNotificationTab === 'historial' }" @click="activeNotificationTab = 'historial'">
            Historial
            <span class="tab-badge" v-show="newHistoryCount > 0">{{ newHistoryCount }}</span>
          </button>
          <button class="tab-item bloqueadas col-4" :class="{ active: activeNotificationTab === 'bloqueadas' }" @click="activeNotificationTab = 'bloqueadas'">
            Bloqueadas
            <span class="tab-badge" v-show="newBlockedCount > 0">{{ newBlockedCount }}</span>
          </button>
        </div>
      </div>

      <!-- Sección de notificaciones pendientes -->
      <div v-if="activeNotificationTab === 'pendientes'" class="notifications-section col-12">
        <div class="row section-header mb-4">
          <div class="col-12 d-flex justify-content-between align-items-center px-0">
            <h3 class="section-title">Notificaciones Pendientes</h3>
            <p class="section-subtitle">{{ pendingCallsWithSpamInfo.length > 0 ? `${pendingCallsWithSpamInfo.length} sin atender` : 'Todas atendidas' }}</p>
          </div>
        </div>

        <div class="notifications-list row" v-if="pendingCallsWithSpamInfo.length > 0">
          <div v-for="call in pendingCallsWithSpamInfo" :key="call.id" class="notification-card" :class="{ urgent: call.is_potential_spam }">
            <div class="row notification-content">
              <div class="col-12 d-flex justify-content-between align-items-center px-0">
                <h6 class="notification-title">Mesa {{ call.table_number || call.table?.number }}</h6>
                <p class="notification-time">{{ call.minutes_ago ? `Hace ${call.minutes_ago} min` : '' }}</p>
              </div>
              <div class=" col-12 px-0">
                <p class="notification-message">{{ call.message || 'Llamada' }}<span v-if="call.is_potential_spam"> • posible spam ({{ call.ip_call_count }})</span></p>
              </div>
              <div class="col-12">
                <div class="row notification-actions">
                  <button class="btn-silenciar col" @click="silenceTableFromCall(call.table_id || call.table?.id)">
                    <MozoIcon name="volumeMute" :size="18" class="mr-1" /> Silenciar
                  </button>
                  <button class="btn-recibido col" @click="acknowledgeCall(call.id)" :disabled="processingCall === call.id">
                    <MozoIcon v-if="processingCall === call.id" name="loader" :size="18" class="animate-spin mr-1" />
                    <MozoIcon v-else name="check" :size="18" class="mr-1" />
                    Recibido
                  </button>
                  <button class="btn-bloquear-ip col" @click="blockIpForSpam(call)">
                    <MozoIcon name="ban" :size="18" class="mr-1" /> Bloquear IP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Estado vacío para notificaciones pendientes -->
        <div v-else class="empty-state-notifications">
          <div class="empty-icon">🎉</div>
          <h4>¡Todo al día!</h4>
          <p>No hay notificaciones pendientes. Las llamadas aparecerán aquí cuando los clientes las realicen.</p>
        </div>
      </div>

      <!-- Sección de Historial -->
      <div v-if="activeNotificationTab === 'historial'" class="notifications-section col-12">
        <div class="row section-header mb-4">
          <div class="col-12 d-flex justify-content-between align-items-center px-0">
            <h3 class="section-title">Historial</h3>
            <p class="section-subtitle">{{ callHistory.length > 0 ? `${callHistory.length} completada${callHistory.length === 1 ? '' : 's'}` : 'Sin historial' }}</p>
          </div>
        </div>
        <div class="notifications-list row" v-if="callHistory.length > 0">
          <div v-for="call in callHistory" :key="call.id" class="notification-card completed col-12">
            <div class="row notification-content">
              <div class="col-12 d-flex justify-content-between align-items-center px-0">
                <h6 class="notification-title">Mesa {{ call.table_number || call.table?.number }}</h6>
                <p class="notification-time">{{ call.minutes_ago ? `Hace ${call.minutes_ago} min` : '' }}</p>
              </div>
              <div class=" col-12 px-0">
                <p class="notification-message">{{ call.message || 'Llamada completada' }}</p>
              </div>
              <div class="col-12">
                <div class="row notification-actions">
                  <button class="btn-recibido col" @click="completeFromHistory(call.id)" :disabled="processingCall === call.id">
                    <MozoIcon v-if="processingCall === call.id" name="loader" :size="18" class="animate-spin mr-1" />
                    <MozoIcon v-else name="check" :size="18" class="mr-1" />
                    Completar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Estado vacío para historial -->
        <div v-else class="empty-state-notifications">
          <div class="empty-icon">📜</div>
          <h4>Sin historial aún</h4>
          <p>Las llamadas completadas aparecerán en esta sección.</p>
        </div>
      </div>

  <!-- Sección de IPs Bloqueadas -->
      <div v-if="activeNotificationTab === 'bloqueadas'" class="notifications-section col-12">
        <div class="row section-header mb-4">
          <div class="col-12 d-flex justify-content-between align-items-center px-0">
            <h3 class="section-title">IPs Bloqueadas</h3>
            <p class="section-subtitle">{{ blockedIps.length > 0 ? `${blockedIps.length} bloqueada${blockedIps.length === 1 ? '' : 's'}` : 'Ninguna bloqueada' }}</p>
          </div>
        </div>

        <div class="notifications-list row" v-if="blockedIps.length > 0">
          <div v-for="blockedIp in blockedIps" :key="blockedIp.ip_address" class="ip-blocked-card col-12">
            <div class="row notification-content w-100">
              <div class="col-12 d-flex justify-content-between align-items-center px-0">
                <div class="ip-title">IP: {{ blockedIp.ip_address }}</div>
                <div class="ip-time">{{ formatBlockDate(blockedIp.blocked_at) }}</div>
              </div>
              <div class="col-12 px-0">
                <div class="ip-reason">Razón: {{ blockedIp.reason || 'Spam' }}</div>
                <div class="ip-address" v-if="blockedIp.expires_at">Expira: {{ new Date(blockedIp.expires_at).toLocaleString() }}</div>
                <div class="ip-address" v-else>Bloqueo permanente</div>
              </div>
              <div class="col-12">
                <div class="row notification-actions">
                  <button class="btn-bloquear-ip col d-flex justify-content-center align-items-center" @click="unblockIp(blockedIp.ip_address)">
                    <MozoIcon name="unlock" :size="18" class="mr-1" /> Desbloquear IP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Estado vacío para IPs bloqueadas -->
        <div v-else class="empty-state-notifications">
          <div class="empty-icon">😇</div>
          <h4>Sin IPs bloqueadas</h4>
          <p>Cuando bloquees alguna IP por spam, aparecerá en esta sección.</p>
        </div>
      </div>

      </template>
    </div>

    <!-- Add Business Modal (fuera del gating para usarlo siempre) -->
    <Teleport to="body">
      <div v-if="showAddBusinessModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="showAddBusinessModal = false">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md" @click.stop>
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="showAddBusinessModal = false" aria-label="Cerrar">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="p-6">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <h3 class="text-lg font-semibold text-gray-900">Unirse a un Negocio</h3>
            </div>
            <p class="text-gray-600 mb-4">Ingresa el código de invitación para unirte a un nuevo negocio</p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Código de Invitación</label>
                <input
                  v-model="invitationCode"
                  type="text"
                  placeholder="Ej: ABCD1234"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  ref="invitationInput"
                  @keyup.enter="joinBusinessFromCode"
                />
              </div>
              <div class="flex justify-end gap-3">
                <button class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" @click="showAddBusinessModal = false">Cerrar</button>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2" :disabled="joinLoading || !invitationCode" @click="joinBusinessFromCode">
                  <svg v-if="joinLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span v-if="!joinLoading">Unirme</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Contenido eliminado de columnas - ahora todo en una sola columna -->
    
    <!-- Elementos ocultos para mantener funcionalidad -->
    <div style="display: none;">
      <BusinessSelector 
        @business-changed="onBusinessChanged"
        @businesses-loaded="onBusinessesLoaded"
        ref="businessSelector"
      />

    <!-- Modal selector de mesas -->
    <TableSelector 
      v-if="showTableSelector && !needsBusiness"
      :available-tables="availableTables"
      :assigned-tables="assignedTables"
      @close="showTableSelector = false"
      @tables-selected="onTablesSelected"
    />

    <!-- Modal gestor de mesas del negocio -->
    <Teleport to="body">
      <div v-if="showTablesManager && currentBusiness" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showTablesManager = false">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                </svg>
                {{ currentBusiness.name }} - Gestión de Mesas
              </h3>
              <button @click="showTablesManager = false" class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 p-6 overflow-y-auto">
            <BusinessTablesManager 
              :business-id="currentBusiness.id"
              :business-name="currentBusiness.name"
              @tables-updated="onTablesUpdated"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Gestor de perfiles de mesa -->
    <TableProfilesManager 
      v-if="showProfilesManager && currentBusiness"
      :business-id="currentBusiness.id"
      :available-tables="availableTables"
      :assigned-tables="assignedTables"
      @profiles-updated="onProfilesUpdated"
      @close="showProfilesManager = false"
    />

    <!-- Modal gestor de IPs bloqueadas -->
    <Teleport to="body">
      <div v-if="showBlockedIpsManager && currentBusiness" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showBlockedIpsManager = false">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Sistema Anti-Spam - IPs Bloqueadas
              </h3>
              <button @click="showBlockedIpsManager = false" class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 p-6 overflow-y-auto">
          <div class="anti-spam-section">
            <!-- Estadísticas de spam -->
            <div v-if="suspiciousIps.length > 0" class="spam-alerts">
              <h4><MozoIcon name="warning" :size="18" class="mr-1" /> IPs Sospechosas Activas</h4>
              <div v-for="ipData in suspiciousIps" :key="ipData.ip" class="suspicious-ip-card">
                <div class="ip-info">
                  <strong>{{ ipData.ip }}</strong>
                  <span class="call-count">{{ ipData.count }} llamadas en 10 min</span>
                </div>
                <div class="ip-calls">
                  <div v-for="call in ipData.calls" :key="call.id" class="mini-call">
                    Mesa {{ call.table_number }} - {{ call.message }}
                  </div>
                </div>
                <button 
                  @click="blockIpForSpam(ipData.calls[0])" 
                  class="btn-block-ip"
                >
                  <MozoIcon name="ban" :size="16" class="mr-1" /> Bloquear IP
                </button>
              </div>
            </div>

            <!-- Lista de IPs bloqueadas -->
            <div class="blocked-ips-list">
              <div class="section-header">
                <h4><MozoIcon name="ban" :size="18" class="mr-1" /> IPs Bloqueadas</h4>
                <button @click="loadBlockedIps" class="btn btn-secondary btn-sm">
                  <MozoIcon name="refresh" :size="16" class="mr-1" /> Actualizar
                </button>
              </div>

              <div v-if="blockedIps.length === 0" class="empty-state">
                <MozoIcon name="shieldCheck" :size="20" />
                <p>No hay IPs bloqueadas actualmente</p>
              </div>

              <div v-else class="blocked-ip-cards">
                <div v-for="blockedIp in blockedIps" :key="blockedIp.ip_address" class="blocked-ip-card">
                  <div class="blocked-ip-header">
                    <div class="ip-address">{{ blockedIp.ip_address }}</div>
                    <div class="block-reason">{{ blockedIp.reason }}</div>
                  </div>
                  <div class="blocked-ip-details">
                    <div class="detail-item">
                      <strong>Bloqueada por:</strong> {{ blockedIp.blocked_by }}
                    </div>
                    <div class="detail-item">
                      <strong>Fecha:</strong> {{ new Date(blockedIp.blocked_at).toLocaleString() }}
                    </div>
                    <div v-if="blockedIp.expires_at" class="detail-item">
                      <strong>Expira:</strong> {{ new Date(blockedIp.expires_at).toLocaleString() }}
                    </div>
                    <div v-else class="detail-item">
                      <strong>Duración:</strong> Permanente
                    </div>
                    <div v-if="blockedIp.notes" class="detail-item">
                      <strong>Notas:</strong> {{ blockedIp.notes }}
                    </div>
                  </div>
                  <div class="blocked-ip-actions">
                    <button 
                      @click="unblockIp(blockedIp.ip_address)"
                      class="btn btn-warning btn-sm"
                    >
                      <MozoIcon name="unlock" :size="16" class="mr-1" /> Desbloquear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>
    
    <!-- Modal: Ver todas las mesas -->
    <AllTablesModal
      v-if="showAllTablesModal"
      :title="currentBusiness?.name ? `Mesas ${currentBusiness.name}` : ''"
      :tables="allTablesList"
      :assigned-ids="assignedIds"
      :silenced-ids="silencedIds"
      :pending-by-table-id="pendingByTableId"
      @close="showAllTablesModal = false"
      @assign="onAssignTable"
      @unassign="onUnassignTable"
      @silence="onSilenceTable"
      @unsilence="onUnsilenceTable"
    />

    
  </div>
  
  <!-- Offcanvas global montado en App.vue -->
  <!-- Sidebar de notificaciones (derecha) -->
  <NotificationsSidebar v-model="ui.isNotifSidebarOpen">
    <!-- Aquí podemos renderizar notificaciones del store si hace falta -->
  </NotificationsSidebar>
  </MozoHeaderLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import waiterCallsService from '@/services/waiterCallsService'
import apiService from '@/services/api'
import { initializeUnifiedWaiterNotifications } from '@/services/firebaseUnifiedAdapter'
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/notifications'
import TableSelector from '@/components/Waiter/TableSelector.vue'
import BusinessSelector from '@/components/Waiter/BusinessSelector.vue'
import BusinessTablesManager from '@/components/Waiter/BusinessTablesManager.vue'
import TableProfilesManager from '@/components/Waiter/TableProfilesManager.vue'
import TableCard from '@/components/Waiter/TableCard.vue'
import BottomSheet from '@/components/UI/BottomSheet.vue'
import AllTablesModal from '@/components/Waiter/AllTablesModal.vue'
import NotificationsSidebar from '@/components/layout/NotificationsSidebar.vue'
import MozoHeaderLayout from '@/layouts/MozoHeaderLayout.vue'
import MozoIcon from '@/components/icons/MozoIcon.vue'
import { useUiStore } from '@/stores/ui'


// Stores
const router = useRouter()
const authStore = useAuthStore()
const ui = useUiStore()

// Estado reactivo
const state = reactive({
  assignedTables: [],
  availableTables: [],
  pendingCalls: [],
  callHistory: [],
  silencedTables: [],
  businesses: [],
  currentBusiness: null,
  needsBusiness: false,
  loading: false,
  processingCall: null,
  showTableSelector: false,
  showTablesManager: false,
  showProfilesManager: false,
  availableProfiles: [],
  profilesLoading: false,
  showBlockedIpsManager: false,
  showAllTablesModal: false,
  blockedIps: [],
  
  // UI Flags from dashboard API
  uiFlags: {
    unlinkedBanner: false,
    unlinkedMessage: ''
  },
  // UI helpers
  quickBusy: false,
  currentPage: 1,
  pageSize: 6
})

// Referencias reactivas para el template  
const availableTables = computed(() => state.availableTables)
const silencedTables = computed(() => state.silencedTables)
const loading = computed(() => state.loading)
const processingCall = computed(() => state.processingCall)
const showTableSelector = computed({
  get: () => state.showTableSelector,
  set: (value) => state.showTableSelector = value
})
const showTablesManager = computed({
  get: () => state.showTablesManager,
  set: (value) => state.showTablesManager = value
})
const showProfilesManager = computed({
  get: () => state.showProfilesManager,
  set: (value) => state.showProfilesManager = value
})
const showBlockedIpsManager = computed({
  get: () => state.showBlockedIpsManager,
  set: (value) => state.showBlockedIpsManager = value
})
const showAllTablesModal = computed({
  get: () => state.showAllTablesModal,
  set: (v) => state.showAllTablesModal = v
})
const quickBusy = computed(() => state.quickBusy)
const currentPage = computed(() => state.currentPage)
const pageSize = computed(() => state.pageSize)


// Estados de dropdowns
const showBusinessDropdown = ref(false)
const showProfilesDropdown = ref(false)

// Watcher para cargar perfiles cuando se abre el dropdown
watch(showProfilesDropdown, (newValue) => {
  if (newValue) {
    // Cargar perfiles cuando se abre el dropdown
    loadTableProfiles()
  }
})
const selectedProfileId = ref(null)
const showAddBusinessModal = ref(false)
// Flag para abrir el modal de "Agregar Negocio" justo después de cerrar el sheet
const shouldOpenAddBusinessAfterClose = ref(false)

// Código de invitación
const invitationCode = ref('')
const joinLoading = ref(false)
const invitationInput = ref(null)

// Referencias reactivas para el template
const blockedIps = computed(() => state.blockedIps || [])

// Referencias
const businessSelector = ref(null)
const businesses = computed(() => state.businesses)
const currentBusiness = computed(() => state.currentBusiness)
const needsBusiness = computed(() => state.needsBusiness)
const businessName = computed(() => state.currentBusiness?.name || 'Seleccionar Negocio')

// Cierre del sheet de perfiles (usa animación del BottomSheet)
const handleCloseProfilesDropdown = (maybeEventOrFlag = false, maybeOpenManager) => {
  const openManager = typeof maybeEventOrFlag === 'boolean' ? maybeEventOrFlag : !!maybeOpenManager
  if (!showProfilesDropdown.value) return
  showProfilesDropdown.value = false
  if (openManager) {
    // Abrir gestor tras cerrar (la animación la maneja el componente)
    setTimeout(() => { showProfilesManager.value = true }, 0)
  }
}

// Selección de perfil
const selectProfile = async (profileId) => {
  selectedProfileId.value = profileId
  handleCloseProfilesDropdown(false)
  
  // Si se seleccionó un perfil específico, activarlo en el backend
  if (profileId !== null) {
    try {
      const response = await apiService.activateWaiterTableProfile(profileId)
      if (response.data?.success) {
        showSuccessToast(`Perfil "${getActiveProfileName()}" activado`)
        // Recargar las mesas asignadas para reflejar el nuevo perfil
        await loadAssignedTables()
        startRealtimeListeners()
      } else {
        showErrorToast(response.data?.message || response.message || 'Error activando perfil')
        // Revertir selección si falla
        selectedProfileId.value = null
      }
    } catch (error) {
      console.error('Error activating profile:', error)
      showErrorToast('Error activando perfil')
      selectedProfileId.value = null
    }
  } else {
    // Si se seleccionó "Todas las mesas", desactivar cualquier perfil activo
    await loadAssignedTables()
  }
}

// Disparar apertura de modal tras cerrar el sheet de negocios
const queueOpenAddBusiness = () => {
  shouldOpenAddBusinessAfterClose.value = true
  showBusinessDropdown.value = false
}
const onBusinessSheetAfterLeave = () => {
  if (shouldOpenAddBusinessAfterClose.value) {
    shouldOpenAddBusinessAfterClose.value = false
    showAddBusinessModal.value = true
  }
}

// Focus en input al abrir modal
watch(showAddBusinessModal, async (open) => {
  if (open) {
    await nextTick()
    invitationInput.value?.focus()
  }
})

// Unirse a negocio por código
const joinBusinessFromCode = async () => {
  if (!invitationCode.value) return
  joinLoading.value = true
  try {
    const resp = await waiterCallsService.joinBusinessWithCode(invitationCode.value.trim())
    if (resp.success) {
      showSuccessToast(resp.message || 'Solicitud enviada')
      showAddBusinessModal.value = false
      invitationCode.value = ''
      // Recargar negocios y dashboard
      if (businessSelector.value?.loadBusinesses) {
        await businessSelector.value.loadBusinesses()
      }
      await loadDashboardInfo()
      await loadDashboardData()
      startRealtimeListeners()
    } else {
      showErrorToast(resp.message || 'No se pudo procesar el código')
    }
  } catch (e) {
    console.error('joinBusinessFromCode error:', e)
    showErrorToast(e?.message || 'Error uniendo al negocio')
  } finally {
    joinLoading.value = false
  }
}

// UI header helpers
const displayName = computed(() => authStore.user?.name || 'Usuario')
const initials = computed(() => (displayName.value || 'A').charAt(0).toUpperCase())
const nowString = ref('')
const updateTime = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  nowString.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
updateTime()
setInterval(updateTime, 60 * 1000)

// Computed properties
// Tabs de filtrado de mesas
const activeTab = ref('todas')
const activeNotificationTab = ref('pendientes')
// Track últimos vistos por pestaña para mostrar solo "nuevos"
const lastSeen = reactive({
  pendientes: 0,
  historial: 0,
  bloqueadas: 0
})
// Counters de nuevos por pestaña
const newPendingCount = computed(() => {
  const nowCount = visiblePendingCalls.value.length
  return Math.max(0, nowCount - (lastSeen.pendientes || 0))
})
const newHistoryCount = computed(() => {
  const nowCount = callHistory.value.length
  return Math.max(0, nowCount - (lastSeen.historial || 0))
})
const newBlockedCount = computed(() => {
  const nowCount = blockedIps.value.length
  return Math.max(0, nowCount - (lastSeen.bloqueadas || 0))
})
const tablesWithCalls = computed(() => assignedTables.value.filter(t => (t.pending_calls_count || 0) > 0))
const filteredTables = computed(() => {
  switch (activeTab.value) {
    case 'con-llamadas':
      return tablesWithCalls.value
    case 'silenciadas':
      return assignedTables.value.filter(t => t.is_silenced)
    default:
      return assignedTables.value
  }
})

// pendingCalls se calcula dinámicamente filtrando por activeCalls (si existe)
const pendingCalls = computed(() => {
  try {
    if (window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls) {
      const activeIds = new Set(Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k)))
  return state.pendingCalls.filter(call => !activeIds.has(String(call.id)))
    }
  } catch (e) {
    // fallback
  }
  return state.pendingCalls
})

// callHistory debe excluir cualquier llamada que siga en pending para evitar mezclas
const callHistory = computed(() => {
  try {
    const pendingIds = new Set((window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls)
      ? Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k))
      : []
    )
    // Dedupe por id y excluir los que aún están pendientes
    const unique = new Map()
    for (const c of state.callHistory) {
      const id = String(c.id)
      if (!pendingIds.has(id) && !unique.has(id)) unique.set(id, c)
    }
    return Array.from(unique.values())
  } catch (e) {
    return state.callHistory
  }
})

// Evitar duplicados en la maquetación: si UltraFast mantiene activeCalls, filtrar
// las pendingCalls que ya estén presentes allí (por id)
const visiblePendingCalls = computed(() => {
  try {
    if (window && window.ultraFastNotifications && window.ultraFastNotifications.activeCalls) {
  const activeIds = new Set(Array.from(window.ultraFastNotifications.activeCalls.keys()).map(k => String(k)))
  // Dedupe y filtrar por status pending/acknowledged displayed rules
  const filtered = state.pendingCalls.filter(call => !activeIds.has(String(call.id)) && (!call.status || call.status === 'pending'))
  const unique = new Map()
  for (const c of filtered) {
    const id = String(c.id)
    if (!unique.has(id)) unique.set(id, c)
  }
  return Array.from(unique.values())
    }
  } catch (err) {
    // ignore and fallback
  }
  // fallback dedupe
  const unique = new Map()
  for (const c of state.pendingCalls) {
    const id = String(c.id)
    if (!c.status || c.status === 'pending') {
      if (!unique.has(id)) unique.set(id, c)
    }
  }
  return Array.from(unique.values())
})

const assignedTables = computed(() => {
  return state.assignedTables.map(table => {
    // pending desde respuesta directa si existe
    const apiPending = table.calls?.pending_count
    // fallback: contar pendingCalls locales
    const localPending = state.pendingCalls.filter(call => 
      call.table_id === table.id || call.table?.id === table.id
    ).length
    return {
      ...table,
      is_silenced: table.silence?.is_silenced ?? table.is_silenced ?? false,
      pending_calls_count: typeof apiPending === 'number' ? apiPending : localPending
    }
  })
})

// Paginación de mesas asignadas
const totalPages = computed(() => Math.max(1, Math.ceil(assignedTables.value.length / state.pageSize)))
const pagedTables = computed(() => {
  const start = (state.currentPage - 1) * state.pageSize
  return assignedTables.value.slice(start, start + state.pageSize)
})
const pageStart = computed(() => ((state.currentPage - 1) * state.pageSize) + 1)
const pageEnd = computed(() => Math.min(state.currentPage * state.pageSize, assignedTables.value.length))
const urgentTablesCount = computed(() => tablesWithCalls.value.length)
const nextPage = () => { if (state.currentPage < totalPages.value) state.currentPage++ }
const prevPage = () => { if (state.currentPage > 1) state.currentPage-- }
const tableStatusClass = (t) => {
  if ((t.pending_calls_count || 0) > 0) return 'status-llamando'
  if (t.is_silenced) return 'status-desasignada'
  return 'status-asignada'
}

// Unificar todas las mesas disponibles + asignadas (evita duplicados por id)
const allTablesList = computed(() => {
  const map = new Map()
  ;(state.availableTables || []).forEach(t => map.set(t.id, t))
  ;(state.assignedTables || []).forEach(t => map.set(t.id, { ...map.get(t.id), ...t }))
  return Array.from(map.values())
})

const assignedIds = computed(() => (state.assignedTables || []).map(t => t.id))
const silencedIds = computed(() => (state.silencedTables || []).map(t => t.id))
const pendingByTableId = computed(() => {
  const counts = {}
  for (const call of state.pendingCalls || []) {
    const tid = call.table_id || call.table?.id
    if (!tid) continue
    counts[tid] = (counts[tid] || 0) + 1
  }
  return counts
})

// Handlers para modal "Ver Todas"
async function onAssignTable(id) { await activateTable(id) }
async function onUnassignTable(id) { await deactivateTable(id) }
async function onSilenceTable(id) { await silenceTable(id) }
async function onUnsilenceTable(id) { await unsilenceTable(id) }

// Acciones rápidas
const onQuickActivateAll = async () => {
  if (state.quickBusy) return
  
  try {
    state.quickBusy = true
    await loadAvailableTables() // Refrescar antes de activar
    
    const ids = (state.availableTables || []).map(t => t.id)
    if (ids.length === 0) {
      showErrorToast('No hay mesas disponibles para activar')
      return
    }
    
    const resp = await waiterCallsService.activateMultipleTables(ids)
    if (resp.success) {
      showSuccessToast(resp.message || `${ids.length} mesa${ids.length === 1 ? '' : 's'} activada${ids.length === 1 ? '' : 's'}`)
      await Promise.all([loadAssignedTables(), loadAvailableTables()])
      startRealtimeListeners()
    } else {
      showErrorToast(resp.message || 'No se pudo activar las mesas')
    }
  } catch (error) {
    console.error('Error en activación masiva:', error)
    showErrorToast('Error activando mesas')
  } finally { 
    state.quickBusy = false 
  }
}

const onQuickSilenceAll = async () => {
  if (state.quickBusy) return
  
  try {
    state.quickBusy = true
    const ids = (state.assignedTables || []).map(t => t.id)
    
    if (ids.length === 0) {
      showErrorToast('No tienes mesas asignadas para silenciar')
      return
    }
    
    const confirmed = await showConfirmDialog(
      '¿Silenciar todas las mesas?',
      `Se silenciarán ${ids.length} mesa${ids.length === 1 ? '' : 's'} por 30 minutos.`,
      'Silenciar Todo',
      'Cancelar',
      'warning'
    )
    
    if (!confirmed) return
    
    const resp = await waiterCallsService.silenceMultipleTables(ids, 30, 'Silencio masivo desde dashboard')
    if (resp.success) {
      showSuccessToast(`${ids.length} mesa${ids.length === 1 ? '' : 's'} silenciada${ids.length === 1 ? '' : 's'} por 30 min`)
      await Promise.all([loadAssignedTables(), loadSilencedTables()])
    } else {
      showErrorToast(resp.message || 'No se pudo silenciar las mesas')
    }
  } catch (error) {
    console.error('Error en silenciado masivo:', error)
    showErrorToast('Error silenciando mesas')
  } finally { 
    state.quickBusy = false 
  }
}

// Activar solitarias = activar mesas disponibles que no están asignadas a ningún mozo
const onQuickActivateSolo = async () => {
  if (state.quickBusy) return
  
  try {
    state.quickBusy = true
    await loadAvailableTables() // Refrescar antes de filtrar
    
    const soloTables = (state.availableTables || []).filter(t => !t.assigned_waiter_id)
    const ids = soloTables.map(t => t.id)
    
    if (ids.length === 0) {
      showErrorToast('No hay mesas sin asignar disponibles')
      return
    }
    
    const resp = await waiterCallsService.activateMultipleTables(ids)
    if (resp.success) {
      showSuccessToast(`${ids.length} mesa${ids.length === 1 ? '' : 's'} sin asignar activada${ids.length === 1 ? '' : 's'}`)
      await Promise.all([loadAssignedTables(), loadAvailableTables()])
      startRealtimeListeners()
    } else {
      showErrorToast(resp.message || 'No se pudo activar las mesas')
    }
  } catch (error) {
    console.error('Error activando mesas solitarias:', error)
    showErrorToast('Error activando mesas')
  } finally { 
    state.quickBusy = false 
  }
}

// Computed para detectar IPs sospechosas (más de 2 llamadas en 10 minutos)
const ipCallCounts = computed(() => {
  if (!visiblePendingCalls.value || !Array.isArray(visiblePendingCalls.value)) {
    return {}
  }
  
  const now = Date.now()
  const tenMinutesAgo = now - (10 * 60 * 1000)
  const ipCounts = {}
  
  visiblePendingCalls.value.forEach(call => {
    const ip = call.client_info?.ip_address
    if (!ip || !call.called_at || call.called_at < tenMinutesAgo) return
    
    if (!ipCounts[ip]) {
      ipCounts[ip] = { count: 0, calls: [] }
    }
    ipCounts[ip].count++
    ipCounts[ip].calls.push(call)
  })
  
  return ipCounts
})

const suspiciousIps = computed(() => {
  return Object.entries(ipCallCounts.value)
    .filter(([ip, data]) => data.count >= 2)
    .map(([ip, data]) => ({ ip, ...data }))
})

// Computed para marcar llamadas como potencial spam
const pendingCallsWithSpamInfo = computed(() => {
  if (!visiblePendingCalls.value || !Array.isArray(visiblePendingCalls.value)) {
    return []
  }
  // Basado en visiblePendingCalls para respetar filtros/dedupe
  return visiblePendingCalls.value.map(call => {
    const ip = call.client_info?.ip_address
    const ipData = ipCallCounts.value[ip]
    
    return {
      ...call,
      is_potential_spam: ipData && ipData.count >= 2,
      ip_call_count: ipData ? ipData.count : 1
    }
  })
})

// --- Event handlers to let Dashboard own all rendering of realtime calls ---
function addOrUpdatePendingCall(call) {
  const id = String(call.id)
  // Si se añade/actualiza como pending, asegurarnos que no esté en el historial
  state.callHistory = state.callHistory.filter(c => String(c.id) !== id)
  const idx = state.pendingCalls.findIndex(c => String(c.id) === id)
  const now = Date.now()
  const calledAt = call.called_at || call.timestamp || now
  const minutesAgo = Math.max(0, Math.floor((now - calledAt) / 60000))

  // Ignorar entradas que no correspondan a pending
  if (call.status && call.status !== 'pending') {
    // Si viene acknowledged/completed, sacarlo de pending por si acaso
    state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== id)
    return
  }

  const normalized = { ...call, minutes_ago: minutesAgo, status: 'pending' }

  if (idx === -1) {
    // Insert at top (newest first)
    // Evitar duplicados exactos
    const exists = state.pendingCalls.some(c => String(c.id) === id)
    if (!exists) state.pendingCalls.unshift(normalized)
  } else {
    state.pendingCalls[idx] = { ...state.pendingCalls[idx], ...normalized }
  }
}

function handleUltraFastAddCall(ev) {
  try {
    const call = ev?.detail
    if (!call || !call.id) return
  console.debug('Dashboard handler ultraFastAddCall', call.id, call)
  addOrUpdatePendingCall(call)
  // Los contadores se actualizan automáticamente via computed properties
  } catch (e) {
    console.warn('Error handling ultraFastAddCall:', e)
  }
}

function handleUpdateCallStatus(ev) {
  try {
    const call = ev?.detail
    if (!call || !call.id) return
    // Update status in pendingCalls if present
    addOrUpdatePendingCall(call)
  } catch (e) {
    console.warn('Error handling updateCallStatus:', e)
  }
}

function handleRemoveCall(ev) {
  try {
    const callId = ev?.detail?.callId
    if (!callId) return
    const id = String(callId)
    state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== id)
  } catch (e) {
    console.warn('Error handling removeCall:', e)
  }
}

function handleClearAllCalls() {
  state.pendingCalls = []
}

function handleCallAcknowledged(ev) {
  try {
    const callId = ev?.detail?.callId
    if (!callId) return
    const idx = state.pendingCalls.findIndex(c => String(c.id) === String(callId))
    if (idx !== -1) {
      // Marcar como acknowledged en pending
  const now = Date.now()
  const base = state.pendingCalls[idx]
  const calledAt = base.called_at || base.timestamp || now
  const minutesAgo = Math.max(0, Math.floor((now - calledAt) / 60000))
  const acknowledgedCall = { ...base, status: 'acknowledged', minutes_ago: minutesAgo }
      // Remover de pending
      state.pendingCalls.splice(idx, 1)
      // Añadir al historial al inicio
  const exists = state.callHistory.find(c => String(c.id) === String(callId))
  if (!exists) state.callHistory.unshift(acknowledgedCall)
    }
  } catch (e) {
    console.warn('Error handling callAcknowledged:', e)
  }
}

function handleCallMovedToHistory(ev) {
  try {
    const detail = ev?.detail || {}
    const callId = detail.callId || (detail.callData && detail.callData.id)
    const callData = detail.callData || null
    if (!callId) return
    // Ignorar eventos que llevan status 'pending' (no deben ir al historial)
    if (callData && callData.status === 'pending') return

    // Remover de pending si por algún motivo sigue ahí
    state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== String(callId))

    // Si ya está en history, actualizarlo, si no, insertarlo al inicio
    const exists = state.callHistory.find(c => String(c.id) === String(callId))
    if (exists) {
      Object.assign(exists, callData || {})
    } else if (callData) {
      const now = Date.now()
      const calledAt = callData.called_at || callData.timestamp || now
      const minutesAgo = Math.max(0, Math.floor((now - calledAt) / 60000))
      state.callHistory.unshift({ ...callData, minutes_ago: minutesAgo })
    }
  } catch (err) {
    console.warn('Error manejando callMovedToHistory en Dashboard:', err)
  }
}

/**
 * Handle staff request approval - reload dashboard data
 */
function handleStaffRequestApproved(ev) {
  try {
    console.log('🎉 Staff request approved! Reloading dashboard data...', ev.detail)
    
    // First, force reload business data from BusinessSelector
    if (businessSelector.value && businessSelector.value.loadBusinesses) {
      console.log('🔄 Forcing business data reload...')
      businessSelector.value.loadBusinesses().then(() => {
        console.log('✅ Business data reloaded, now loading dashboard data')
        
        // Then reload dashboard data with new business assignment
        return loadDashboardData()
      }).then(() => {
        console.log('✅ Dashboard data reloaded after staff approval')
        
        // Restart real-time listeners with new business context
        startRealtimeListeners()
      }).catch((error) => {
        console.error('❌ Error reloading after staff approval:', error)
      })
    } else {
      console.warn('⚠️ BusinessSelector ref not available, falling back to dashboard reload only')
      
      // Fallback: reload dashboard data only
      loadDashboardData().then(() => {
        console.log('✅ Dashboard data reloaded after staff approval')
        startRealtimeListeners()
      }).catch((error) => {
        console.error('❌ Error reloading dashboard after staff approval:', error)
      })
    }
  } catch (err) {
    console.warn('Error handling staff request approval:', err)
  }
}

/**
 * Handle waiter unlinked notification - show banner and reload data
 */
function handleWaiterUnlinked(ev) {
  try {
    console.log('🚫 Waiter unlinked from business! Processing unlink notification...', ev.detail)
    
    // Force reload dashboard info to get the unlinked banner flag
    loadDashboardInfo().then(() => {
      console.log('✅ Dashboard info reloaded after unlink notification')
      
      // Also reload business data to reflect changes
      if (businessSelector.value && businessSelector.value.loadBusinesses) {
        return businessSelector.value.loadBusinesses()
      }
    }).then(() => {
      console.log('✅ Business data reloaded after unlink')
      
      // Reload dashboard data (should now show no assigned tables)
      return loadDashboardData()
    }).catch((error) => {
      console.error('❌ Error handling waiter unlink:', error)
    })
    
  } catch (err) {
    console.warn('Error handling waiter unlink notification:', err)
  }
}

/**
 * Completar llamada desde la sección historial.
 * Intentará usar UltraFast si está disponible, si no usará el servicio API.
 */
const completeFromHistory = async (callId) => {
  if (!callId) {
    showErrorToast('ID de llamada inválido')
    return
  }
  
  state.processingCall = callId
  try {
    if (ultraFastNotifications && typeof ultraFastNotifications.completeCall === 'function') {
      await ultraFastNotifications.completeCall(callId)
    } else {
      await waiterCallsService.completeCall(callId)
    }

    // Remover de historial local
    state.callHistory = state.callHistory.filter(c => String(c.id) !== String(callId))
    showSuccessToast('Llamada marcada como completada')
  } catch (e) {
    console.error('Error completing call from history:', e)
    showErrorToast('Error completando la llamada')
  } finally {
    state.processingCall = null
  }
}

// Adapter realtime unificado (antes variable se usaba para ultra-fast legacy)
let ultraFastNotifications = null

// ===== MÉTODOS PRINCIPALES =====

/**
 * Cargar información del dashboard (UI flags, etc.)
 */
const loadDashboardInfo = async () => {
  try {
  const response = await apiService.getWaiterDashboard()
    const data = response.data
    
    // Update UI flags
    if (data.ui_flags) {
      state.uiFlags.unlinkedBanner = data.ui_flags.unlinked_banner || false
      state.uiFlags.unlinkedMessage = data.ui_flags.unlinked_message || ''
    }
    
    return data
  } catch (error) {
    console.error('Error loading dashboard info:', error)
    // Don't show toast for this, as it's not critical
    return null
  }
}

/**
 * Cargar datos iniciales
 */
const loadDashboardData = async () => {
  // Si no hay negocio activo, no cargar datos de mesas
  if (state.needsBusiness || !state.currentBusiness) {
    return
  }

  state.loading = true
  try {
    await Promise.all([
      loadDashboardInfo(),
      loadAssignedTables(),
      loadPendingCalls(),
      loadAvailableTables(),
      loadSilencedTables(),
      loadBlockedIps(),
      loadTableProfiles()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    showErrorToast('Error cargando datos del dashboard')
  } finally {
    state.loading = false
  }
}

// Inicializar UltraFast y listeners relacionados
onMounted(async () => {
  // Cargar datos iniciales
  await loadDashboardData()

  // (Legacy UltraFast DESACTIVADO) - usamos solo el adapter unified en startRealtimeListeners()

  // Registrar listeners de eventos emitidos por el módulo realtime
  if (!window.__waiterDashboardListenersRegistered) {
    window.addEventListener('newWaiterCall', handleUltraFastAddCall)
    window.addEventListener('updateCallStatus', handleUpdateCallStatus)
    window.addEventListener('removeCall', handleRemoveCall)
    window.addEventListener('clearAllCalls', handleClearAllCalls)
    window.addEventListener('callAcknowledged', handleCallAcknowledged)
    window.addEventListener('callMovedToHistory', handleCallMovedToHistory)
    
    // Listen for staff request approval to reload dashboard data
    window.addEventListener('staffRequestApproved', handleStaffRequestApproved)
    
    // Listen for waiter unlinked notification to show banner and reload data
    window.addEventListener('waiterUnlinked', handleWaiterUnlinked)
    
    window.__waiterDashboardListenersRegistered = true
  }

  // Exponer helper de debug para inspeccionar desde consola
  try {
    window.debugUltra = () => ({
      pendingCalls: state.pendingCalls.slice(),
      activeCalls: window.ultraFastNotifications ? Array.from(window.ultraFastNotifications.activeCalls.keys()) : []
    })
  } catch (e) {
    /* no-op */
  }

  // Inicializar lastSeen para que no aparezcan badges al inicio
  lastSeen.pendientes = visiblePendingCalls.value.length
  lastSeen.historial = callHistory.value.length
  lastSeen.bloqueadas = blockedIps.value.length
})

onUnmounted(() => {
  try {
    // Sólo eliminar si fuimos quienes los registramos
    if (window.__waiterDashboardListenersRegistered) {
      window.removeEventListener('newWaiterCall', handleUltraFastAddCall)
      window.removeEventListener('updateCallStatus', handleUpdateCallStatus)
      window.removeEventListener('removeCall', handleRemoveCall)
      window.removeEventListener('clearAllCalls', handleClearAllCalls)
      window.removeEventListener('callAcknowledged', handleCallAcknowledged)
      window.removeEventListener('callMovedToHistory', handleCallMovedToHistory)
      window.removeEventListener('staffRequestApproved', handleStaffRequestApproved)
      window.removeEventListener('waiterUnlinked', handleWaiterUnlinked)
      window.__waiterDashboardListenersRegistered = false
    }
  } catch (e) {
    console.warn('Error removing ultraFast event listeners:', e)
  }

  try {
    if (ultraFastNotifications && ultraFastNotifications.stopListening) {
      ultraFastNotifications.stopListening()
    }
  } catch (e) {
    console.warn('Error stopping ultraFastNotifications on unmount:', e)
  }
})

// Resetear contadores de "nuevos" al cambiar de pestaña
watch(activeNotificationTab, (tab) => {
  if (tab === 'pendientes') {
    lastSeen.pendientes = visiblePendingCalls.value.length
  } else if (tab === 'historial') {
    lastSeen.historial = callHistory.value.length
  } else if (tab === 'bloqueadas') {
    lastSeen.bloqueadas = blockedIps.value.length
  }
})

/**
 * Cargar mesas asignadas (carga inicial + tiempo real con Firestore)
 */
const loadAssignedTables = async () => {
  if (!state.currentBusiness) {
    // console.log('⚠️ No hay negocio activo, no se pueden cargar mesas')
    return
  }
  
  try {
    // console.log('📋 Cargando mesas asignadas para negocio:', state.currentBusiness.id)
    const response = await waiterCallsService.getWaiterBusinessTables(state.currentBusiness.id)
    
    // console.log('📋 Respuesta completa:', response)
    
    if (response.success) {
      // Filtrar solo las mesas asignadas al mozo actual
      const assignedTables = response.tables?.filter(table => 
        table.status?.assignment === 'assigned_to_me'
      ) || []
      
      state.assignedTables = assignedTables
      // console.log('✅ Mesas asignadas cargadas:', assignedTables.length, assignedTables)
    } else {
      // console.error('❌ Error en respuesta:', response)
    }
  } catch (error) {
    console.error('❌ Error cargando mesas asignadas:', error)
    showErrorToast('Error al cargar las mesas asignadas')
  }
}

/**
 * Cargar llamadas pendientes - delegado a Firebase
 */
const loadPendingCalls = async () => {
  // (UNIFICACIÓN) Ya no se carga historial por API.
  // El historial se construirá SOLO con eventos tiempo real (callMovedToHistory).
  // Esta función se mantiene para no romper llamadas existentes en Promise.all.
  //console.debug('🔄 Pending manejadas por realtime; historial API deshabilitado')
}

/**
 * Cargar mesas disponibles
 */
const loadAvailableTables = async () => {
  // console.log('🔍 Cargando mesas disponibles...')
  try {
    const response = await waiterCallsService.getAvailableTables()
    // console.log('📋 Respuesta mesas disponibles:', response)
    if (response.success) {
      state.availableTables = response.available_tables || []
      // console.log('✅ Mesas disponibles cargadas:', state.availableTables.length, state.availableTables)
    } else {
      // console.error('❌ Error en respuesta mesas disponibles:', response.message)
    }
  } catch (error) {
    console.error('💥 Error loading available tables:', error)
  }
}

/**
 * Cargar mesas silenciadas
 */
const loadSilencedTables = async () => {
  try {
    const response = await waiterCallsService.getSilencedTables()
    if (response.success) {
      state.silencedTables = response.silenced_tables || []
    }
  } catch (error) {
    console.error('Error loading silenced tables:', error)
  }
}

// ===== GESTIÓN DE LLAMADAS =====


// ===== GESTIÓN DE MESAS =====

/**
 * Activar mesa individual
 */
const activateTable = async (tableId) => {
  // console.log('🚀 Dashboard: Iniciando activación de mesa:', tableId)
  try {
    const response = await waiterCallsService.activateTable(tableId)
    // console.log('📊 Dashboard: Respuesta de activación:', response)
    
    if (response.success) {
      // console.log('✅ Dashboard: Mesa activada exitosamente')
      showSuccessToast(response.message || 'Mesa activada')
      // console.log('🔄 Dashboard: Recargando mesas asignadas...')
      await loadAssignedTables()
      
      // Reiniciar monitoreo en tiempo real con las nuevas mesas
      startRealtimeListeners()
    } else {
      // console.error('❌ Dashboard: Error en respuesta:', response.message)
      showErrorToast(response.message || 'Error activando mesa')
    }
  } catch (error) {
    console.error('💥 Dashboard: Error completo activando mesa:', error)
    
    // Handle 403 errors specifically (waiter not confirmed staff)
    if (error.response?.status === 403) {
      console.log('🚫 403 error detected - waiter not confirmed staff, reloading dashboard info')
      showErrorToast(error.response?.data?.message || 'No tienes permisos para activar mesas en este negocio')
      
      // Reload dashboard info to get updated UI flags (unlinked banner)
      await loadDashboardInfo()
    } else {
      showErrorToast('Error activando mesa')
    }
  }
}

/**
 * Silenciar mesa individual
 */
const silenceTable = async (tableId) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Silenciar mesa?',
      'La mesa no podrá realizar llamadas durante 30 minutos.',
      'Silenciar',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.silenceTable(tableId, 30)
      if (response.success) {
        showSuccessToast(response.message || 'Mesa silenciada')
        await loadAssignedTables()
        await loadSilencedTables()
      } else {
        showErrorToast(response.message || 'Error silenciando mesa')
      }
    }
  } catch (error) {
    console.error('Error silencing table:', error)
    showErrorToast('Error silenciando mesa')
  }
}

/**
 * Quitar silencio de mesa
 */
const unsilenceTable = async (tableId) => {
  try {
    const response = await waiterCallsService.unsilenceTable(tableId)
    if (response.success) {
      showSuccessToast(response.message || 'Silencio removido')
      await loadAssignedTables()
      await loadSilencedTables()
    } else {
      showErrorToast(response.message || 'Error removiendo silencio')
    }
  } catch (error) {
    console.error('Error unsilencing table:', error)
    showErrorToast('Error removiendo silencio')
  }
}

/**
 * Desactivar mesa individual
 */
const deactivateTable = async (tableId) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Desactivar mesa?',
      'Te desasignarás de esta mesa y no recibirás más llamadas.',
      'Desactivar',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.deactivateTable(tableId)
      if (response.success) {
        showSuccessToast(response.message || 'Mesa desactivada')
        await loadAssignedTables()
        await loadAvailableTables()
        await loadPendingCalls()
        
        // Reiniciar monitoreo en tiempo real tras desactivar mesa
        startRealtimeListeners()
      } else {
        showErrorToast(response.message || 'Error desactivando mesa')
      }
    }
  } catch (error) {
    console.error('Error deactivating table:', error)
    showErrorToast('Error desactivando mesa')
  }
}

/**
 * Silenciar mesa desde llamada
 */
const silenceTableFromCall = async (tableId) => {
  await silenceTable(tableId)
  await loadPendingCalls() // Actualizar llamadas
}

/**
 * Refrescar datos de mesas
 */
const refreshTables = async () => {
  await loadDashboardData()
}

/**
 * Finalizar turno
 */
const endShift = async () => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Finalizar turno?',
      'Te desasignarás de todas las mesas y saldrás de la aplicación.',
      'Finalizar Turno',
      'Cancelar',
      'danger'
    )

    if (confirmed) {
      // Desactivar todas las mesas
      if (state.assignedTables.length > 0) {
        const tableIds = state.assignedTables.map(table => table.id)
        await waiterCallsService.deactivateMultipleTables(tableIds)
      }

      // Parar monitoreo en tiempo real
      stopRealtimeListeners()

      // Cerrar sesión
      await authStore.logout()
      
      showSuccessToast('Turno finalizado correctamente')
      
      // Redirigir al login
      await router.push('/login')
    }
  } catch (error) {
    console.error('Error ending shift:', error)
    showErrorToast('Error finalizando turno')
  }
}

// ===== GESTIÓN DE NEGOCIOS =====

/**
 * Cuando se cargan los negocios
 */
const onBusinessesLoaded = (data) => {
  state.businesses = data.businesses || []
  state.currentBusiness = data.activeBusiness || null
  state.needsBusiness = data.needsBusiness || false
  state.loading = false

  // console.log('🏢 Negocios cargados:', {
  //   total: state.businesses.length,
  //   current: state.currentBusiness?.name,
  //   needsBusiness: state.needsBusiness
  // })

  // Si hay negocio activo, cargar datos del dashboard
  if (state.currentBusiness && !state.needsBusiness) {
    loadDashboardData()
    // Iniciar monitoreo en tiempo real para las mesas del mozo
    startRealtimeListeners()
  }
}

/**
 * Cuando se cambia de negocio
 */
const onBusinessChanged = (business) => {
  state.currentBusiness = business
  
  // console.log('🏢 Negocio cambiado a:', business.name)
  
  // Limpiar datos anteriores
  state.assignedTables = []
  state.availableTables = []
  state.pendingCalls = []
  state.silencedTables = []
  
  // Cargar nuevos datos
  loadDashboardData()
  
  // Reiniciar monitoreo en tiempo real
  startRealtimeListeners()
}

// Abrir selector de mesas: refrescar la lista antes de mostrar
watch(() => state.showTableSelector, async (open) => {
  if (open && state.currentBusiness && !state.needsBusiness) {
    await loadAvailableTables()
  }
})

// ===== EVENT HANDLERS =====

/**
 * Cuando se seleccionan mesas para activar
 */
const onTablesSelected = async (selectedTableIds) => {
  // console.log('🚀 Dashboard: Mesas seleccionadas para activar:', selectedTableIds)
  state.showTableSelector = false
  
  if (selectedTableIds.length === 0) {
    // console.log('⚠️ Dashboard: No se seleccionaron mesas')
    return
  }

  try {
    // console.log('🔄 Dashboard: Iniciando activación múltiple...')
    const response = await waiterCallsService.activateMultipleTables(selectedTableIds)
    // console.log('📊 Dashboard: Respuesta activación múltiple:', response)
    
    if (response.success) {
      console.log('✅ Dashboard: Mesas activadas exitosamente')
      showSuccessToast(response.message || `${response.summary?.successful || selectedTableIds.length} mesas activadas`)
      // console.log('🔄 Dashboard: Recargando datos del dashboard...')
      await loadAssignedTables()
      await loadAvailableTables()
      
      // Reiniciar monitoreo en tiempo real con las nuevas mesas activadas
      startRealtimeListeners()
    } else {
      // console.error('❌ Dashboard: Error en respuesta múltiple:', response.message)
      showErrorToast(response.message || 'Error activando mesas')
    }
  } catch (error) {
    console.error('💥 Dashboard: Error completo activando mesas múltiples:', error)
    
    // Handle 403 errors specifically (waiter not confirmed staff)
    if (error.response?.status === 403) {
      console.log('🚫 403 error detected - waiter not confirmed staff, reloading dashboard info')
      showErrorToast(error.response?.data?.message || 'No tienes permisos para activar mesas en este negocio')
      
      // Reload dashboard info to get updated UI flags (unlinked banner)
      await loadDashboardInfo()
    } else {
      showErrorToast('Error activando mesas')
    }
  }
}

/**
 * Cuando se actualizan las mesas desde el gestor
 */
const onTablesUpdated = async (tables) => {
  // console.log('📋 Mesas del negocio actualizadas:', tables.length)
  // Recargar datos del dashboard
  await loadDashboardData()
}

/**
 * Cargar perfiles de mesa del usuario
 */
const loadTableProfiles = async () => {
  state.profilesLoading = true
  try {
    const response = await apiService.getWaiterTableProfiles({ include: 'tables' })
    console.log('🔍 Respuesta API con mesas incluidas:', response)
    
    // Intentar diferentes estructuras de respuesta
    let profiles = null
    if (response.data?.success && response.data?.profiles) {
      profiles = response.data.profiles
    } else if (response.data?.profiles) {
      profiles = response.data.profiles  
    } else if (response.profiles) {
      profiles = response.profiles
    } else if (Array.isArray(response.data)) {
      profiles = response.data
    } else if (Array.isArray(response)) {
      profiles = response
    }
    
    if (profiles && Array.isArray(profiles)) {
      state.availableProfiles = profiles
    } else {
      state.availableProfiles = []
    }
  } catch (error) {
    console.error('Error loading table profiles:', error)
    state.availableProfiles = []
  } finally {
    state.profilesLoading = false
  }
}

/**
 * Cuando se actualizan los perfiles desde el gestor
 */
const onProfilesUpdated = async () => {
  // Forzar recarga inmediata de perfiles
  await loadTableProfiles()
  // Si el dropdown está abierto, forzar actualización
  if (showProfilesDropdown.value) {
    showProfilesDropdown.value = false
    await nextTick()
    showProfilesDropdown.value = true
  }
  // Recargar datos del dashboard para aplicar cambios
  await loadDashboardData()
}

// ===== TIEMPO REAL CON FIRESTORE =====

/**
 * Inicializar Ultra Fast Firebase Realtime Database
 */
const startRealtimeListeners = async () => {
  if (!authStore.user?.id || state.needsBusiness || !state.currentBusiness?.id) {
    console.log('⚠️ No se pueden iniciar listeners: usuario, negocio o contexto faltante')
    return
  }

  console.log('⚡ Iniciando Firebase Realtime para mozo:', authStore.user.id, 'negocio:', state.currentBusiness.id)
  
  try {
    // Parar listeners anteriores si existen
    if (ultraFastNotifications) {
      ultraFastNotifications.stopListening()
      ultraFastNotifications = null
    }
    
    // Inicializar sistema UNIFIED
    ultraFastNotifications = initializeUnifiedWaiterNotifications(authStore.user.id.toString())
    
    if (ultraFastNotifications) {
      console.log('✅ Firebase Realtime Database activado correctamente')
    } else {
      throw new Error('No se pudo inicializar Firebase')
    }
  } catch (error) {
    console.error('❌ Error configurando Firebase Realtime:', error)
    showErrorToast('Error configurando notificaciones en tiempo real')
  }
}

/**
 * Parar listeners de tiempo real
 */
const stopRealtimeListeners = async () => {
  console.log('🛑 Deteniendo Firebase Realtime Database')
  
  try {
    if (ultraFastNotifications) {
      if (typeof ultraFastNotifications.stopListening === 'function') {
        ultraFastNotifications.stopListening()
      }
      ultraFastNotifications = null
      console.log('✅ Firebase Realtime Database desconectado correctamente')
    }
  } catch (error) {
    console.error('❌ Error desconectando Firebase:', error)
  }
}

// Auto-refresh eliminado - ahora usamos tiempo real

// ===== LIFECYCLE =====

onMounted(async () => {
  // console.log('🏠 Waiter Dashboard mounted')
  // Mostrar loading hasta que BusinessSelector emita onBusinessesLoaded
  state.loading = true
  // Las empresas se cargan automáticamente por el BusinessSelector
  // loadDashboardData se llamará desde onBusinessesLoaded si hay negocio activo
})

onUnmounted(() => {
  stopRealtimeListeners()
})


// ===== ACCIONES DE LLAMADAS DELEGADAS A FIREBASE =====

/**
 * Reconocer una llamada usando Ultra Fast Firebase
 */
const acknowledgeCall = async (callId) => {
  if (!callId) {
    showErrorToast('ID de llamada inválido')
    return
  }
  
  if (!ultraFastNotifications || typeof ultraFastNotifications.acknowledgeCall !== 'function') {
    console.warn('Sistema Firebase no disponible, usando API de respaldo')
    try {
      state.processingCall = callId
      await waiterCallsService.acknowledgeCall(callId)
      showSuccessToast('Llamada reconocida')
      
      // Remover de la lista local
      state.pendingCalls = state.pendingCalls.filter(c => String(c.id) !== String(callId))
    } catch (error) {
      console.error('Error con API de respaldo:', error)
      showErrorToast('Error al reconocer la llamada')
    } finally {
      state.processingCall = null
    }
    return
  }

  try {
    state.processingCall = callId
    await ultraFastNotifications.acknowledgeCall(callId)
    showSuccessToast('Llamada reconocida')
  } catch (error) {
    console.error('Error reconociendo llamada:', error)
    showErrorToast('Error al reconocer la llamada')
  } finally {
    state.processingCall = null
  }
}

/**
 * Completar una llamada usando Ultra Fast Firebase
 */
const completeCall = async (callId) => {
  if (!callId) {
    showErrorToast('ID de llamada inválido')
    return
  }
  
  if (!ultraFastNotifications || typeof ultraFastNotifications.completeCall !== 'function') {
    console.warn('Sistema Firebase no disponible, usando API de respaldo')
    try {
      state.processingCall = callId
      await waiterCallsService.completeCall(callId)
      showSuccessToast('Llamada completada')
      
      // Remover del historial local
      state.callHistory = state.callHistory.filter(c => String(c.id) !== String(callId))
    } catch (error) {
      console.error('Error con API de respaldo:', error)
      showErrorToast('Error al completar la llamada')
    } finally {
      state.processingCall = null
    }
    return
  }

  try {
    state.processingCall = callId
    await ultraFastNotifications.completeCall(callId)
    showSuccessToast('Llamada completada')
  } catch (error) {
    console.error('Error completando llamada:', error)
    showErrorToast('Error al completar la llamada')
  } finally {
    state.processingCall = null
  }
}

/**
 * Crear llamada de prueba
 */
const createTestCall = async () => {
  if (!ultraFastNotifications) {
    showErrorToast('Sistema de notificaciones ultra rápidas no disponible')
    return
  }

  try {
    const testCall = await ultraFastNotifications.createTestCall()
    showSuccessToast(`🧪 Llamada de prueba creada: Mesa ${testCall.table_number}`)
  } catch (error) {
    console.error('Error creando llamada de prueba:', error)
    showErrorToast('Error al crear la llamada de prueba')
  }
}

// ===== FUNCIONES ANTI-SPAM =====

/**
 * Bloquear IP por spam
 */
const blockIpForSpam = async (call) => {
  if (!call.client_info?.ip_address) {
    showErrorToast('No se puede bloquear: IP no disponible')
    return
  }

  try {
    const confirmed = await showConfirmDialog(
      '¿Bloquear IP por spam?',
      `Se bloqueará la IP ${call.client_info.ip_address} por 24 horas. Esta IP no podrá realizar más llamadas.`,
      'Bloquear IP',
      'Cancelar',
      'error'
    )

    if (confirmed) {
      state.processingCall = call.id
      
      const response = await waiterCallsService.blockIpForSpam(call.id, {
        reason: 'spam',
        duration_hours: 24,
        notes: `Bloqueada desde Mesa ${call.table_number} - IP: ${call.client_info.ip_address}`
      })

      if (response.success) {
        showSuccessToast(`IP ${call.client_info.ip_address} bloqueada por 24 horas`)
        
        // Remover todas las llamadas de esta IP
        const blockedIp = call.client_info.ip_address
        state.pendingCalls = state.pendingCalls.filter(c => 
          c.client_info?.ip_address !== blockedIp
        )
        
        // Recargar lista de IPs bloqueadas
        await loadBlockedIps()
      } else {
        showErrorToast(response.message || 'Error bloqueando IP')
      }
    }
  } catch (error) {
    console.error('Error blocking IP for spam:', error)
    showErrorToast('Error bloqueando IP por spam')
  } finally {
    state.processingCall = null
  }
}

/**
 * Cargar IPs bloqueadas
 */
const loadBlockedIps = async () => {
  try {
    const response = await waiterCallsService.getBlockedIps({ active_only: true })
    if (response.success) {
      state.blockedIps = response.blocked_ips || []
    } else {
      state.blockedIps = []
    }
  } catch (error) {
    console.error('Error loading blocked IPs:', error)
    state.blockedIps = []
  }
}

/**
 * Desbloquear IP
 */
const unblockIp = async (ipAddress) => {
  try {
    const confirmed = await showConfirmDialog(
      '¿Desbloquear IP?',
      `Se desbloqueará la IP ${ipAddress} y podrá volver a realizar llamadas.`,
      'Desbloquear',
      'Cancelar',
      'warning'
    )

    if (confirmed) {
      const response = await waiterCallsService.unblockIp(ipAddress, state.currentBusiness?.id)
      
      if (response.success) {
        showSuccessToast(`IP ${ipAddress} desbloqueada`)
        await loadBlockedIps()
      } else {
        showErrorToast(response.message || 'Error desbloqueando IP')
      }
    }
  } catch (error) {
    console.error('Error unblocking IP:', error)
    showErrorToast('Error desbloqueando IP')
  }
}


/**
 * Formatear fecha para mostrar en la lista de bloqueados
 */
const formatBlockDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes}m`
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha inválida'
  }
}

// ===== DROPDOWN HANDLERS =====

/**
 * Seleccionar un negocio del dropdown (con backend)
 */
const selectBusiness = async (business) => {
  try {
    const resp = await waiterCallsService.setActiveWaiterBusiness(business.id)
    if (resp.success) {
      showBusinessDropdown.value = false
      state.currentBusiness = business
      showSuccessToast(`Negocio "${business.name}" seleccionado`)
      // refrescar dashboard y reiniciar realtime
      await loadDashboardData()
      startRealtimeListeners()
    } else {
      showErrorToast(resp.message || 'No se pudo seleccionar el negocio')
    }
  } catch (e) {
    console.error('Error selecting business from dashboard:', e)
    showErrorToast('Error seleccionando negocio')
  }
}

// Helper para obtener el nombre del perfil activo
const getActiveProfileName = () => {
  if (selectedProfileId.value === null) {
    return 'Todas las Mesas'
  }
  
  const activeProfile = state.availableProfiles.find(p => p.id === selectedProfileId.value)
  return activeProfile ? activeProfile.name : 'Perfil Desconocido'
}

// Helper para obtener información de mesas de un perfil
const getProfileTablesInfo = (profile) => {
  if (profile.tables && Array.isArray(profile.tables)) {
    return `${profile.tables.length} mesas: ${profile.tables.map(t => t.number).join(', ')}`
  } else if (profile.table_numbers && Array.isArray(profile.table_numbers)) {
    return `${profile.table_numbers.length} mesas: ${profile.table_numbers.join(', ')}`
  } else if (profile.tables_count) {
    return `${profile.tables_count} mesas`
  }
  return '0 mesas'
}
</script>
