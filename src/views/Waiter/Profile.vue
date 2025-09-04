<template>
  <!-- Íconos SVG personalizados -->
  <svg style="position:absolute;width:0;height:0;visibility:hidden">
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-eye-off" viewBox="0 0 24 24"><path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2.5 12S6.5 5.5 12 5.5c1.6 0 3 .4 4.3 1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M21.5 12S17.5 18.5 12 18.5c-1.5 0-2.9-.3-4.1-.9" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 3v4M8 3v4M3 10h18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-ruler" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 5v2m3 0v2m3 0v2m3 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-weight" viewBox="0 0 24 24"><path d="M6 20h12l-2-11H8L6 20Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-gender" viewBox="0 0 24 24"><circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13 13l4 4m0-4v4m-10 1v-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-7.2-7-12A7 7 0 0 1 19 9c0 4.8-7 12-7 12Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-phone" viewBox="0 0 24 24"><path d="M6 3h4l1 5-2 1a12 12 0 0 0 6 6l1-2 5 1v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-text" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-camera" viewBox="0 0 24 24"><path d="M4 7h4l2-2h4l2 2h4v12H4V7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l4 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-edit" viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16v4Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 4l4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-building" viewBox="0 0 24 24"><path d="M4 21V6l8-3v18H8v-5H6v5H4Zm10 0V4l6 2v15h-2v-5h-2v5h-2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
    <symbol id="i-key" viewBox="0 0 24 24"><circle cx="14" cy="10" r="4.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 12H4v3h2v2h2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="4" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".6"/></symbol>
    <symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m9 12 2 8 3-8 3 8 2-8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m2 7 10 6 10-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  </svg>

  <div class="app">
    <!-- Tabs -->
    <div class="segmented">
      <button :class="['seg-btn', activeTab === 'personal' && 'active']" @click="activeTab = 'personal'">Personal</button>
      <button :class="['seg-btn', activeTab === 'laboral' && 'active']" @click="activeTab = 'laboral'">Laboral</button>
      <button :class="['seg-btn', activeTab === 'cuenta' && 'active']" @click="activeTab = 'cuenta'">Cuenta</button>
    </div>

    <!-- ========== PERSONAL ========== -->
    <section v-if="activeTab === 'personal'">
      <div class="avatar-wrap" @click="triggerAvatarUpload" role="button" aria-label="Cambiar foto">
        <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileChange" />
        <div v-if="!user.avatar" class="avatar-square placeholder">
          <svg class="i md"><use href="#i-camera"/></svg>
        </div>
        <img v-else :src="user.avatar" alt="Foto de perfil" class="avatar-square" />
      </div>
      <h2 class="display-name">{{ user.name || 'Tu nombre' }}</h2>

      <div class="group">
        <label>Fecha de nacimiento</label>
        <div class="input has-icon clickable" @click="openBirth">
          <svg class="i sm left"><use href="#i-calendar"/></svg>
          <input ref="birthRef" type="date" v-model="user.birth_date" placeholder="dd/mm/aaaa"/>
        </div>
      </div>
      <div class="group">
          <label>Estatura</label>
          <div class="input has-icon with-suffix">
            <svg class="i sm left"><use href="#i-ruler"/></svg>
            <input v-model="user.height" type="number" inputmode="decimal" placeholder="1.75" />
            <span class="suffix">m</span>
          </div>
        </div>
        <div class="group">
          <label>Peso</label>
          <div class="input has-icon with-suffix">
            <svg class="i sm left"><use href="#i-weight"/></svg>
            <input v-model="user.weight" type="number" inputmode="decimal" placeholder="70" />
            <span class="suffix">kg</span>
          </div>
        </div>

      <div class="group">
        <label>Sexo</label>
        <div class="input has-icon select">
          <svg class="i sm left"><use href="#i-gender"/></svg>
          <select v-model="user.gender">
            <option value="">Seleccionar...</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro / Prefiero no decir</option>
          </select>
          <span class="chev">▾</span>
        </div>
      </div>

      <div class="group">
        <label>Ubicación actual</label>
        <div class="input has-icon">
          <svg class="i sm left"><use href="#i-pin"/></svg>
          <input v-model="user.current_location" type="text" placeholder="Ej: Belgrano, CABA" />
        </div>
      </div>

      <div class="group">
        <label>Teléfono</label>
        <div class="input has-icon">
          <svg class="i sm left"><use href="#i-phone"/></svg>
          <input v-model="user.phone" type="tel" placeholder="+54 11 5555-5555" />
        </div>
      </div>

      <div class="group">
        <label>Descripción personal</label>
        <div class="input has-icon textarea">
          <svg class="i sm left"><use href="#i-text"/></svg>
          <textarea v-model="user.bio" rows="3" placeholder="Contá breve tu experiencia y estilo de atención."></textarea>
        </div>
      </div>

      <!-- Botón de editar para Personal -->
      <button class="btn btn-primary full" type="button" @click="saveAllChanges" :disabled="updating">
        <span v-if="updating">Guardando...</span>
        <span v-else>Editar Información Personal</span>
      </button>
    </section>

    <!-- ========== LABORAL ========== -->
    <section v-else-if="activeTab === 'laboral'">
      <h2 class="h2">Información Laboral</h2>

      <div class="grid-2">
        <div class="group">
          <label>Modalidad</label>
          <div class="input has-icon select">
            <svg class="i sm left"><use href="#i-briefcase"/></svg>
            <select v-model="user.employment_type">
              <option value="">Seleccionar...</option>
              <option value="full-time">Tiempo completo</option>
              <option value="part-time">Medio tiempo</option>
              <option value="hourly">Por horas</option>
              <option value="weekends-only">Solo fines de semana</option>
            </select>
            <span class="chev">▾</span>
          </div>
        </div>

        <div class="group">
          <label>Años de experiencia</label>
          <div class="input has-icon with-suffix">
            <svg class="i sm left"><use href="#i-award"/></svg>
            <input v-model="user.experience_years" type="number" inputmode="numeric" min="0" placeholder="5"/>
            <span class="suffix">años</span>
          </div>
        </div>
      </div>

      <div class="group">
        <label>Horario de trabajo actual</label>
        <div class="input has-icon">
          <svg class="i sm left"><use href="#i-clock"/></svg>
          <input v-model="user.current_schedule" type="text" placeholder="mañana / tarde / noche" />
        </div>
      </div>

      <div class="group">
        <label>Disponibilidad</label>
        <div class="availability" role="switch" :aria-checked="user.is_available" @click="user.is_available = !user.is_available">
          <span class="status-icon" :class="user.is_available ? 'ok' : 'off'">
            <svg class="i sm"><use href="#i-check"/></svg>
          </span>
          <span class="status-text" :class="user.is_available ? 'on' : 'off'">{{ user.is_available ? 'Disponible' : 'No disponible' }}</span>
          <label class="switch" @click.stop>
            <input type="checkbox" v-model="user.is_available" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <hr class="sep"/>

      <h3 class="h3">Habilidades</h3>
      <div class="input chip-input">
        <input v-model="nuevaHabilidad" type="text" placeholder="Agregar habilidad" @keydown.enter.prevent="addSkill(nuevaHabilidad); nuevaHabilidad = ''" />
        <button class="btn btn-small btn-skill" type="button" @click="addSkill(nuevaHabilidad); nuevaHabilidad = ''">Agregar</button>
      </div>
      <div class="chips">
        <button class="chip" v-for="(skill, i) in user.skills" :key="skill">
          <span>{{ skill }}</span>
          <span class="x" @click.stop="removeSkill(skill)" aria-label="Quitar">×</span>
        </button>
      </div>

      <div class="head-row">
        <h3 class="h3">Historial Laboral</h3>
        <button class="btn btn-primary subtle" type="button" @click="addWorkExperience">+ Agregar Experiencia</button>
      </div>

      <div class="cards">
        <article v-for="item in workHistory" :key="item.id" class="card">
          <header class="card-hd">
            <div class="tt">
              <span class="badge">{{ item.position }}</span>
              <span class="dot">•</span>
              <span class="place">{{ item.business_name }}</span>
            </div>
            <div class="tools">
              <button class="icon" title="Editar" @click="editWorkExperience(item)">
                <svg class="i"><use href="#i-edit"/></svg>
              </button>
              <button class="icon danger" title="Borrar" @click="deleteWorkExperience(item.id)">
                <svg class="i"><use href="#i-trash"/></svg>
              </button>
            </div>
          </header>
          <div class="meta">
            <svg class="i sm"><use href="#i-clock"/></svg>{{ formatDate(item.start_date) }} – {{ item.end_date ? formatDate(item.end_date) : 'Actualidad' }}
          </div>
          <p class="desc">{{ item.description }}</p>
        </article>
      </div>

      <h3 class="h3 mt">Negocios Asociados Hoy</h3>
      <div class="cards">
        <article class="card business" v-for="business in associatedBusinesses" :key="business.id">
          <header class="card-hd">
            <div class="tt">
              <svg class="i"><use href="#i-building"/></svg>
              <span class="place">{{ business.name }}</span>
            </div>
            <span class="pill" :class="business.is_active ? 'ok' : 'off'">{{ business.is_active ? 'Activo' : 'Inactivo' }}</span>
          </header>

          <div class="row">
            <div class="col-12 col-md-6">
              <div class="business-info">
                <svg class="i sm"><use href="#i-pin"/></svg>
                <span class="muted">{{ business.name }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="business-code">
                <svg class="i sm"><use href="#i-key"/></svg>
                <span class="kbd">{{ business.code }}</span>
                <button class="link" type="button" @click="copyCode(business.code)">
                  <svg class="i sm"><use href="#i-copy"/></svg> Copiar
                </button>
              </div>
            </div>
          </div>

          <footer class="foot">
            <button class="btn btn-ghost danger" @click="leaveBusiness(business.id, business.name)">✕ Abandonar</button>
          </footer>
        </article>
      </div>

      <!-- Botón de editar para Laboral -->
      <button class="btn btn-primary full" type="button" @click="saveAllChanges" :disabled="updating">
        <span v-if="updating">Guardando...</span>
        <span v-else>Editar Información Laboral</span>
      </button>
    </section>

    <!-- ========== CUENTA ========== -->
    <section v-else>
      <h2 class="h2">Datos de la Cuenta</h2>

      <div class="group">
        <label>Email</label>
        <div class="input has-icon">
          <svg class="i sm left"><use href="#i-mail"/></svg>
          <input v-model="user.email" type="email" autocomplete="email" placeholder="tu@email.com" />
        </div>
      </div>

      <div class="group">
        <label>Nombre para mostrar</label>
        <div class="input has-icon">
          <svg class="i sm left"><use href="#i-user"/></svg>
          <input v-model="user.name" type="text" placeholder="Cómo te ven en la app" />
        </div>
      </div>

      <button class="btn btn-primary full subtle my-3" type="button" @click="saveAllChanges">Actualizar Email / Nombre</button>

      <h3 class="h3" style="margin-top:12px">Cambiar Contraseña</h3>

      <div class="group">
        <label>Contraseña actual</label>
        <div class="input with-icon">
          <input :type="show.current ? 'text' : 'password'" v-model="passwords.current" placeholder="••••••••" autocomplete="current-password"/>
          <button class="icon-btn" type="button" @click="show.current = !show.current" :aria-label="show.current?'Ocultar':'Ver'">
            <svg class="i sm"><use :href="show.current ? '#i-eye-off' : '#i-eye'"/></svg>
          </button>
        </div>
      </div>

      <div class="group">
        <label>Nueva contraseña</label>
        <div class="input with-icon">
          <input :type="show.next ? 'text' : 'password'" v-model="passwords.new" placeholder="Mínimo 8 caracteres" autocomplete="new-password"/>
          <button class="icon-btn" type="button" @click="show.next = !show.next">
            <svg class="i sm"><use :href="show.next ? '#i-eye-off' : '#i-eye'"/></svg>
          </button>
        </div>
      </div>

      <div class="group">
        <label>Confirmar nueva contraseña</label>
        <div class="input with-icon">
          <input :type="show.confirm ? 'text' : 'password'" v-model="passwords.confirm" placeholder="Repetí la contraseña" autocomplete="new-password"/>
          <button class="icon-btn" type="button" @click="show.confirm = !show.confirm">
            <svg class="i sm"><use :href="show.confirm ? '#i-eye-off' : '#i-eye'"/></svg>
          </button>
        </div>
      </div>

      <button class="btn btn-primary my-3" type="button" @click="changePassword">Cambiar Contraseña</button>

      <div class="danger">
        <h3 class="h3">Zona de Peligro</h3>
        <p>Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.</p>
        <button class="btn btn-danger" type="button" @click="showDeleteModal = true">Eliminar Cuenta</button>
      </div>
    </section>

    <!-- Modal para Historial Laboral -->
    <BaseModal 
      v-model="showWorkHistoryModal"
      :title="editingWorkItem ? 'Editar Experiencia' : 'Agregar Experiencia'"
      size="md"
    >
      <form @submit.prevent="saveWorkExperience" class="col-12 px-0 d-flex flex-column justify-content-center align-items-center">
        <div class="group">
          <label>Nombre del local/empresa</label>
          <input 
            type="text" 
            v-model="newWorkItem.business_name" 
            class="form-control"
            required
          />
        </div>
        
        <div class="group">
          <label>Cargo</label>
          <input 
            type="text" 
            v-model="newWorkItem.position" 
            class="form-control"
            required
          />
        </div>
        
        <div class="group">
          <label>Descripción del puesto</label>
          <textarea 
            v-model="newWorkItem.description" 
            class="form-control"
            rows="3"
          ></textarea>
        </div>
        
          <div class="group">
            <label>Fecha de ingreso</label>
            <input 
              ref="startDateRef"
              :type="startDateInputType" 
              :value="startDateInputType === 'date' ? newWorkItem.start_date : startDateDisplay"
              class="form-control"
              required
              :placeholder="startDateInputType === 'text' ? 'dd/mm/aaaa' : ''"
              @click="handleDateInputClick('start')"
              @blur="handleDateInputBlur('start')"
              @input="handleDateInputChange('start', $event)"
              readonly
            />
          </div>
          
          <div class="group">
            <label>Fecha de salida (opcional)</label>
            <input 
              ref="endDateRef"
              :type="endDateInputType" 
              :value="endDateInputType === 'date' ? newWorkItem.end_date : endDateDisplay"
              class="form-control"
              :placeholder="endDateInputType === 'text' ? 'dd/mm/aaaa' : ''"
              @click="handleDateInputClick('end')"
              @blur="handleDateInputBlur('end')"
              @input="handleDateInputChange('end', $event)"
              readonly
            />
          </div>
      </form>
      
      <template #footer>
        <BaseButton @click="showWorkHistoryModal = false" variant="secondary" class="me-3">
          Cancelar
        </BaseButton>
        <BaseButton @click="saveWorkExperience" variant="primary" :disabled="updating">
          <span v-if="updating">Guardando...</span>
          <span v-else>Guardar</span>
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Eliminar Cuenta -->
    <BaseModal 
      v-model="showDeleteModal"
      title="Eliminar Cuenta"
      size="md"
    >
      <div class="delete-account-content">
        <p>¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
        
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill"></i>
          Al eliminar tu cuenta perderás todo el acceso a tus datos y negocios asociados.
        </div>
        
        <div class="group">
          <label>Escribe "ELIMINAR" para confirmar</label>
          <input 
            type="text" 
            v-model="deleteConfirmation" 
            class="form-control"
            :disabled="deleting"
          />
        </div>
      </div>
      
      <template #footer>
        <BaseButton @click="showDeleteModal = false" variant="secondary" :disabled="deleting">
          Cancelar
        </BaseButton>
        <BaseButton 
          @click="deleteAccount" 
          variant="danger"
          :disabled="deleteConfirmation !== 'ELIMINAR' || deleting"
        >
          <span v-if="deleting">Eliminando...</span>
          <span v-else">Eliminar mi cuenta</span>
        </BaseButton>
      </template>
    </BaseModal>
  </div>

  <!-- Loading state -->
  <div v-if="loading" class="loading-container">
    <div class="loading-spinner"></div>
    <p>Cargando perfil...</p>
  </div>

  <!-- Alerts -->
  <div v-if="error" class="alert alert-danger">
    {{ error }}
  </div>

  <div v-if="success" class="alert alert-success">
    {{ success }}
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import ProfileAvatar from '@/components/ProfileAvatar.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import BaseModal from '@/components/UI/BaseModal.vue'
import apiService from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeTab = ref('personal')

const user = ref({
  display_name: '',
  email: '',
  bio: '',
  phone: '',
  birth_date: '',
  height: null,
  weight: null,
  gender: '',
  experience_years: null,
  employment_type: '',
  current_schedule: '',
  current_location: '',
  latitude: null,
  longitude: null,
  availability_hours: [],
  skills: [],
  is_available: true,
  avatar: '',
  business_id: null
})

const workHistory = ref([])
const associatedBusinesses = ref([])

const passwords = ref({
  current: '',
  new: '',
  confirm: ''
})

const show = ref({ current: false, next: false, confirm: false })

const loading = ref(true)
const updating = ref(false)
const error = ref('')
const success = ref('')
const avatarPreview = ref(null)
const avatarFile = ref(null)
const validationErrors = ref({})

const showDeleteModal = ref(false)
const deleteConfirmation = ref('')
const deleting = ref(false)

const showWorkHistoryModal = ref(false)
const editingWorkItem = ref(null)
const newWorkItem = ref({
  business_name: '',
  position: '',
  description: '',
  start_date: '',
  end_date: ''
})

const nuevaHabilidad = ref('')

// Avatar file handling
const fileInput = ref(null)
const birthRef = ref(null)
const startDateRef = ref(null)
const endDateRef = ref(null)

// Estados para inputs de fecha híbridos
const startDateInputType = ref('text')
const endDateInputType = ref('text')
const startDateDisplay = ref('')
const endDateDisplay = ref('')

const triggerAvatarUpload = () => fileInput.value?.click()
const onFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  handleAvatarUpdate(file)
}

const openBirth = () => {
  if (birthRef.value) {
    birthRef.value.focus()
    if (birthRef.value.showPicker) {
      birthRef.value.showPicker()
    } else {
      birthRef.value.click()
    }
  }
}

// Formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

// Manejo de inputs de fecha híbridos
const handleDateInputClick = (field) => {
  if (field === 'start') {
    startDateInputType.value = 'date'
    nextTick(() => {
      if (startDateRef.value && startDateRef.value.showPicker) {
        startDateRef.value.showPicker()
      }
    })
  } else if (field === 'end') {
    endDateInputType.value = 'date'
    nextTick(() => {
      if (endDateRef.value && endDateRef.value.showPicker) {
        endDateRef.value.showPicker()
      }
    })
  }
}

const handleDateInputBlur = (field) => {
  setTimeout(() => {
    if (field === 'start') {
      startDateInputType.value = 'text'
      updateDateDisplay('start')
    } else if (field === 'end') {
      endDateInputType.value = 'text'
      updateDateDisplay('end')
    }
  }, 200)
}

const handleDateInputChange = (field, event) => {
  const value = event.target.value
  if (field === 'start') {
    newWorkItem.value.start_date = value
  } else if (field === 'end') {
    newWorkItem.value.end_date = value
  }
  updateDateDisplay(field)
}

const updateDateDisplay = (field) => {
  if (field === 'start') {
    startDateDisplay.value = newWorkItem.value.start_date ? formatDate(newWorkItem.value.start_date) : ''
  } else if (field === 'end') {
    endDateDisplay.value = newWorkItem.value.end_date ? formatDate(newWorkItem.value.end_date) : ''
  }
}

// Copiar código de negocio al portapapeles
const copyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code || '')
    success.value = 'Código copiado'
    setTimeout(() => { if (success.value === 'Código copiado') success.value = '' }, 1500)
  } catch (e) {
    error.value = 'No se pudo copiar el código'
    setTimeout(() => { if (error.value === 'No se pudo copiar el código') error.value = '' }, 2000)
  }
}

const isPasswordValid = computed(() => {
  if (!passwords.value.new) return true
  return passwords.value.new.length >= 8
})

const doPasswordsMatch = computed(() => {
  if (!passwords.value.new || !passwords.value.confirm) return true
  return passwords.value.new === passwords.value.confirm
})

const calculatedAge = computed(() => {
  if (!user.value.birth_date) return null
  const birth = new Date(user.value.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
})

const loadUserData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const businessId = adminStore?.activeBusinessId ?? localStorage.getItem('businessId') ?? null
    const response = await apiService.getActiveUserProfile(businessId ? Number(businessId) : null)
    const profileData = response.data.data.profile_data
    const userData = response.data.data.user
    if (profileData) {
      user.value = {
        name: userData.name || '',
        email: userData.email || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
        birth_date: profileData.birth_date || '',
        height: profileData.height || null,
        weight: profileData.weight || null,
        gender: profileData.gender || '',
        experience_years: profileData.experience_years || null,
        employment_type: profileData.employment_type || '',
        current_schedule: profileData.current_schedule || '',
        current_location: profileData.current_location || '',
        latitude: profileData.latitude || null,
        longitude: profileData.longitude || null,
        availability_hours: profileData.availability_hours || [],
        skills: profileData.skills || [],
        is_available: profileData.is_available !== undefined ? profileData.is_available : true,
        avatar: profileData.avatar || '',
        business_id: profileData.business_id
      }
    } else {
      // Fallback data if no waiter profile found
      user.value = {
        display_name: 'Mozo',
        email: '',
        bio: '',
        phone: '',
        birth_date: '',
        height: null,
        weight: null,
        gender: '',
        experience_years: null,
        employment_type: '',
        current_schedule: '',
        current_location: '',
        latitude: null,
        longitude: null,
        availability_hours: [],
        skills: [],
        is_available: true,
        avatar: '',
        business_id: null
      }
    }
    
    // Cargar historial laboral
    await loadWorkHistory()
    
    // Cargar negocios asociados
    await loadAssociatedBusinesses()
    
  } catch (err) {
    console.error('Error al cargar datos del usuario:', err)
    error.value = 'No se pudieron cargar tus datos. Por favor, inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

const loadWorkHistory = async () => {
  try {
    const response = await apiService.listWorkHistory()

    // Normalizador de items (el backend puede enviar distintas claves de ID/shape)
    const normalizeWorkItem = (item) => ({
      id: item?.id ?? item?.work_experience_id ?? item?.workExperienceId ?? item?.work_history_id ?? item?.uuid,
      business_name: item?.business_name ?? item?.businessName ?? item?.company_name ?? '',
      position: item?.position ?? item?.role ?? '',
      description: item?.description ?? '',
      start_date: item?.start_date ?? item?.startDate ?? '',
      end_date: item?.end_date ?? item?.endDate ?? null
    })

    // La respuesta puede venir en distintos envoltorios
    const rawItems =
      response?.data?.data?.items ??
      response?.data?.items ??
      (Array.isArray(response?.data) ? response.data : []) ??
      []

    // Mapear a un shape consistente con 'id' definido
    workHistory.value = rawItems.map(normalizeWorkItem)
  } catch (err) {
    console.error('❌ Error al cargar historial laboral:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    workHistory.value = []
  }
}

const loadAssociatedBusinesses = async () => {
  try {
    console.log('🏪 Cargando negocios asociados activos hoy...')
    const response = await apiService.getWaiterBusinessesActiveToday()
    console.log('🏪 Respuesta de businesses/active-today:', response.data)
    
    associatedBusinesses.value = (response.data.businesses || []).map(business => ({
      id: business.id,
      name: business.name,
      code: business.code,
      status: business.is_active ? 'active' : 'inactive',
      assigned_tables: business.assigned_tables || 0,
      calls_today: business.calls_today || 0,
      count: business.count || 0,
      date: business.date,
      is_active: business.is_active
    }))
    
    console.log('🏪 Negocios procesados:', associatedBusinesses.value)
  } catch (err) {
    console.error('❌ Error al cargar negocios asociados:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    associatedBusinesses.value = []
  }
}

const handleAvatarUpdate = async (file) => {
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'La imagen no puede ser mayor a 2MB'
    return
  }
  
  try {
    updating.value = true
    
    const formData = new FormData()
    
    if (user.value.display_name) formData.append('display_name', user.value.display_name)
    if (user.value.email) formData.append('email', user.value.email)
    if (user.value.bio) formData.append('bio', user.value.bio)
    if (user.value.phone) formData.append('phone', user.value.phone)
    if (user.value.birth_date) formData.append('birth_date', user.value.birth_date)
    if (user.value.height) formData.append('height', user.value.height)
    if (user.value.weight) formData.append('weight', user.value.weight)
    if (user.value.gender) formData.append('gender', user.value.gender)
    if (user.value.experience_years) formData.append('experience_years', user.value.experience_years)
    if (user.value.employment_type) formData.append('employment_type', user.value.employment_type)
    if (user.value.current_schedule) formData.append('current_schedule', user.value.current_schedule)
    if (user.value.current_location) formData.append('current_location', user.value.current_location)
    if (user.value.latitude) formData.append('latitude', user.value.latitude)
    if (user.value.longitude) formData.append('longitude', user.value.longitude)
    
    formData.append('availability_hours', JSON.stringify(user.value.availability_hours || []))
    formData.append('skills', JSON.stringify(user.value.skills || []))
    formData.append('is_available', user.value.is_available ? '1' : '0')
    formData.append('avatar', file)
    
    const response = await apiService.updateWaiterUserProfile(formData)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      user.value.avatar = e.target.result
    }
    reader.readAsDataURL(file)
    
    success.value = response.data.message || 'Foto de perfil actualizada'
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      validationErrors.value = err.response.data.errors
      error.value = err.response.data.message || 'Por favor, corrige los errores en el formulario'
    } else {
      error.value = err.response?.data?.message || 'Error al subir la imagen'
    }
  } finally {
    updating.value = false
    
    if (!error.value) {
      await loadUserData()
    }
  }
}

const saveAllChanges = async () => {
  try {
    updating.value = true
    validationErrors.value = {}
    error.value = ''
    
    const formData = new FormData()
    
    // Agregar todos los campos al FormData
    if (user.value.display_name) formData.append('display_name', user.value.display_name)
    if (user.value.email) formData.append('email', user.value.email)
    if (user.value.bio) formData.append('bio', user.value.bio)
    if (user.value.phone) formData.append('phone', user.value.phone)
    if (user.value.birth_date) formData.append('birth_date', user.value.birth_date)
    if (user.value.height) formData.append('height', user.value.height)
    if (user.value.weight) formData.append('weight', user.value.weight)
    if (user.value.gender) formData.append('gender', user.value.gender)
    if (user.value.experience_years) formData.append('experience_years', user.value.experience_years)
    if (user.value.employment_type) formData.append('employment_type', user.value.employment_type)
    if (user.value.current_schedule) formData.append('current_schedule', user.value.current_schedule)
    if (user.value.current_location) formData.append('current_location', user.value.current_location)
    if (user.value.latitude) formData.append('latitude', user.value.latitude)
    if (user.value.longitude) formData.append('longitude', user.value.longitude)
    
    formData.append('availability_hours', JSON.stringify(user.value.availability_hours || []))
    formData.append('skills', JSON.stringify(user.value.skills || []))
    formData.append('is_available', user.value.is_available ? '1' : '0')
    
    const response = await apiService.updateWaiterUserProfile(formData)
    
    if (response.data.data) {
      user.value.avatar = response.data.data.avatar
      user.value.display_name = response.data.data.display_name
    }
    
    success.value = 'Información actualizada correctamente'
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      validationErrors.value = err.response.data.errors
      error.value = err.response.data.message || 'Por favor, corrige los errores en el formulario'
    } else {
      error.value = err.response?.data?.message || 'Error al actualizar la información'
    }
  } finally {
    updating.value = false
    
    if (!error.value) {
      await loadUserData()
    }
  }
}

const changePassword = async () => {
  if (!passwords.value.current || !passwords.value.new || !passwords.value.confirm) {
    error.value = 'Por favor completa todos los campos de contraseña'
    return
  }
  
  if (!isPasswordValid.value || !doPasswordsMatch.value) {
    error.value = 'Verifica que la contraseña sea válida y coincida'
    return
  }
  
  try {
    updating.value = true
    
    await apiService.changePassword({
      current_password: passwords.value.current,
      password: passwords.value.new,
      password_confirmation: passwords.value.confirm
    })
    
    passwords.value.current = ''
    passwords.value.new = ''
    passwords.value.confirm = ''
    
    success.value = 'Contraseña actualizada correctamente'
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    updating.value = false
  }
}

const addWorkExperience = () => {
  editingWorkItem.value = null
  newWorkItem.value = {
    business_name: '',
    position: '',
    description: '',
    start_date: '',
    end_date: ''
  }
  // Reset date input states
  startDateInputType.value = 'text'
  endDateInputType.value = 'text'
  startDateDisplay.value = ''
  endDateDisplay.value = ''
  showWorkHistoryModal.value = true
}

const editWorkExperience = (item) => {
  editingWorkItem.value = item
  newWorkItem.value = { ...item }
  // Reset date input states and set display values
  startDateInputType.value = 'text'
  endDateInputType.value = 'text'
  startDateDisplay.value = item.start_date ? formatDate(item.start_date) : ''
  endDateDisplay.value = item.end_date ? formatDate(item.end_date) : ''
  showWorkHistoryModal.value = true
}

const saveWorkExperience = async () => {
  try {
    updating.value = true
    
    const workData = {
      business_name: newWorkItem.value.business_name,
      position: newWorkItem.value.position,
      description: newWorkItem.value.description || '',
      start_date: newWorkItem.value.start_date,
      end_date: newWorkItem.value.end_date || null
    }
    
    if (editingWorkItem.value) {
      const id = editingWorkItem.value.id
      if (!id) {
        throw new Error('ID de experiencia laboral no definido')
      }
      await apiService.updateWorkHistory(id, workData)
      // Refrescar lista para asegurar shape consistente (y evitar IDs undefined)
      await loadWorkHistory()
    } else {
      await apiService.addWorkHistory(workData)
      // Refrescar lista tras crear
      await loadWorkHistory()
    }
    
    showWorkHistoryModal.value = false
    success.value = editingWorkItem.value ? 'Experiencia actualizada correctamente' : 'Experiencia agregada correctamente'
  } catch (err) {
    console.error('Error al guardar experiencia laboral:', err)
    error.value = err.response?.data?.message || 'Error al guardar experiencia laboral'
  } finally {
    updating.value = false
  }
}

const deleteWorkExperience = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta experiencia laboral?')) {
    return
  }
  
  try {
    updating.value = true
    if (!id) {
      throw new Error('ID de experiencia laboral no definido')
    }
    
    await apiService.deleteWorkHistory(id)
    
    // Refrescar lista tras eliminar para mantener shape uniforme
    await loadWorkHistory()
    success.value = 'Experiencia eliminada correctamente'
  } catch (err) {
    console.error('Error al eliminar experiencia:', err)
    error.value = err.response?.data?.message || 'Error al eliminar experiencia'
  } finally {
    updating.value = false
  }
}

const addSkill = (skill) => {
  if (skill && !user.value.skills.includes(skill)) {
    user.value.skills.push(skill)
  }
}

const removeSkill = (skill) => {
  user.value.skills = user.value.skills.filter(s => s !== skill)
}

const leaveBusiness = async (businessId, businessName) => {
  if (!confirm(`¿Estás seguro de que deseas abandonar el negocio "${businessName}"?`)) {
    return
  }
  
  try {
    updating.value = true
    console.log('🚪 Abandonando negocio:', { businessId, businessName })
    
    const response = await apiService.leaveBusinessAsWaiter({
      business_id: businessId
    })
    
    console.log('🚪 Respuesta de leave-business:', response.data)
    
    await loadAssociatedBusinesses()
    success.value = `Has abandonado el negocio "${businessName}" correctamente`
  } catch (err) {
    console.error('❌ Error al abandonar negocio:', err)
    console.error('❌ Respuesta del error:', err.response?.data)
    error.value = err.response?.data?.message || 'Error al abandonar el negocio'
  } finally {
    updating.value = false
  }
}

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'ELIMINAR') return
  
  deleting.value = true
  
  try {
    await apiService.deleteAccount({ password: passwords.value.current })
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (err) {
    console.error('Error al eliminar cuenta:', err)
    error.value = err.response?.data?.message || 'No se pudo eliminar la cuenta. Por favor, inténtalo de nuevo.'
    showDeleteModal.value = false
    deleteConfirmation.value = ''
    deleting.value = false
  }
}

onMounted(() => {
  loadUserData()
})

const route = useRoute()
onBeforeRouteUpdate((to, from) => {
  loadUserData()
})

// Clear alerts after 5 seconds
watch(success, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      success.value = ''
    }, 5000)
  }
})

watch(error, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      error.value = ''
    }, 8000)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

:root{
  --primary:#9f54fd; --primary-dark:#7b2cbf;
  --bg:#ffffff; --text:#10002b; --muted:#6b7280; --white:#fff;
  --label:#10002b; --hairline:#ece7fb; --radius:12px;
  --shadow-sm:0 2px 6px rgba(16,0,43,.05);
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg); color:var(--text); font-family:'Inter',system-ui,Segoe UI,Roboto,Arial,sans-serif}
.app{max-width:520px;margin:0 auto; padding:20px 20px 100px; background: var(--bg); min-height: 100vh;}

/* Tabs */
.segmented{display:flex; gap:8px; padding:6px; background:var(--white); border:1px solid var(--hairline); border-radius:14px; box-shadow:var(--shadow-sm); margin-bottom:18px}
.seg-btn{appearance:none;border:0;background:transparent;cursor:pointer;flex:1;height:40px;border-radius:10px;font:600 14px/40px Inter,sans-serif;color:var(--muted);transition:color .18s,background .18s,box-shadow .18s}
.seg-btn:hover{color:var(--primary)} .seg-btn.active{background:#f6f3ff;color:var(--text);box-shadow:var(--shadow-sm)}

/* Avatar */
.avatar-wrap{display:grid;place-items:center;margin:6px 0 12px; cursor: pointer;}
.avatar-square{width:140px;height:140px;border-radius:16px;object-fit:cover;background:#fff;border:1px solid var(--hairline);box-shadow:0 6px 16px rgba(16,0,43,.08)}
.placeholder{display:grid;place-items:center;color:#7d6fb2}
.hidden-file{display:none}
.display-name{font-weight:800;font-size:22px;text-align:center;margin:8px 0 12px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto}

/* Grid */
.grid-2{display:grid;grid-template-columns:1fr;gap:12px}
@media (min-width:460px){ .grid-2{grid-template-columns:1fr 1fr} }

/* Inputs */
.h2{font-size:20px;font-weight:800;margin:6px 0 14px}
.h3{font-size:16px;font-weight:800; margin: 0;}
.group{margin-bottom:12px; min-width: 100%;}
.group>label{display:block;color:var(--label);font-weight:600;font-size:13px;margin-bottom:6px}
.input{display:flex;align-items:center;background:var(--white);border:1px solid #f1f0f0;border-radius:var(--radius);padding:12px 14px;box-shadow:var(--shadow-sm);transition:border-color .2s ease, box-shadow .2s ease}
.input:focus-within{border-color:var(--primary) !important;box-shadow:0 0 0 3px rgba(159, 84, 253, 0.15) !important}
.input:active{border-color:var(--primary) !important;box-shadow:0 0 0 3px rgba(159, 84, 253, 0.15) !important}
.input:hover:not(:focus-within):not(:active){border-color:#9ca3af}
.input input,.input textarea,.input select{width:100%;border:0;outline:0;background:transparent;font-size:15px;color:var(--text);transition:all .2s ease}
.input select{appearance:none;-webkit-appearance:none;cursor:pointer}
.input input:focus,.input textarea:focus,.input select:focus{outline:none}
.input input:active,.input textarea:active,.input select:active{outline:none}
.input textarea{resize:none;line-height:1.45}
.input.clickable{cursor:pointer}
input[type="date"]{-webkit-appearance:none;appearance:none;cursor:pointer}
input[type="date"]::-webkit-calendar-picker-indicator{opacity:0;position:absolute;left:0;top:0;width:100%;height:100%;cursor:pointer}
.input.clickable input[type="date"]{cursor:pointer}
.input.clickable{cursor:pointer;position:relative}

/* Iconos en inputs */
.has-icon{position:relative;padding-left:38px}
.i{width:18px;height:18px;display:inline-block;flex-shrink:0;color:currentColor}
.i.sm{width:16px;height:16px}
.i.md{width:24px;height:24px}
svg.i{overflow:visible}
.left{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9aa}
.input:focus-within .left{color:var(--primary)}
.with-icon{padding-right:48px;position:relative}
.icon-btn{border:0;background:transparent;cursor:pointer;border-radius:8px;padding:6px;color:#6b6882;display:inline-grid;place-items:center;position:absolute;right:8px;top:50%;transform:translateY(-50%)}
.icon-btn:hover{color:var(--primary)}

/* Select styling */
.input.select {
  position: relative;
  padding-right: 40px !important;
}
.input.select select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  cursor: pointer !important;
  width: 100% !important;
  border: none !important;
  background: transparent !important;
  outline: none !important;
  padding-right: 25px !important;
  font-size: 15px !important;
  color: var(--text) !important;
}
.select .chev {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  color: var(--muted) !important;
  pointer-events: none !important;
  font-size: 14px !important;
  z-index: 1 !important;
}

/* Unidades */
.with-suffix{padding-right:10px}
.suffix{margin:0 10px;font-weight:700;color:#3b2f5e;opacity:.7; font-size: 13px;}
.input:focus-within .suffix{opacity:1;color:var(--primary)}

/* Disponibilidad */
.availability{display:flex;align-items:center;gap:10px;padding:6px 2px;border-radius:10px}
.status-icon{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;flex-shrink:0}
.status-icon.ok{color:var(--primary) !important;background:rgba(159, 84, 253, 0.1) !important}
.status-icon.off{color:#7a7a8c;background:#f0f2f6}
.status-text{font-weight:600;flex:1}
.status-text.on{color:var(--primary) !important}.status-text.off{color:#7a7a8c}
.switch{margin-left:auto;display:inline-flex;align-items:center;flex-shrink:0}
.switch input{display:none}
.slider{width:44px;height:26px;background:#ece9fb;border-radius:999px;position:relative;border:1px solid #e2dcfb;transition:background .2s, border-color .2s}
.slider::after{content:"";position:absolute;left:4px;top:50%;width:18px;height:18px;border-radius:50%;transform:translateY(-50%);background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.12);transition:transform .2s}
.switch input:checked + .slider{background:linear-gradient(135deg,var(--primary), #7b2cbf) !important;border-color:transparent !important}
.switch input:checked + .slider::after{transform:translate(20px,-50%) !important}

/* Chips / Cards / Negocios */
.chip-input{gap:8px}
.btn-small{padding:8px 10px;border-radius:10px;border:1px solid #e6e2f6;background:#fff;font-weight:600;cursor:pointer; min-width: max-content !important;}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 16px;overflow:hidden}
.chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:#7b2cbf;border:1px solid #7b2cbf;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:max-content; font-size: 13px;}
.chip .x{font-weight:800;opacity:.55; cursor: pointer;}
.cards{display:flex;flex-direction:column;gap:12px}
.card{background:#fff;border:1px solid #efe9fb;border-radius:16px;padding:18px !important;box-shadow:0 2px 8px rgba(16,0,43,.05)}
.card-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.tt{display:flex;align-items:center;gap:8px;flex-wrap:wrap;overflow:hidden;min-width:0}
.badge{background:#f3edff;color:#472a86;border-radius:8px;padding:4px 8px;font-size:12px;font-weight:700}
.dot{opacity:.45}.place{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.meta{display:flex;align-items:center;gap:6px;color:#6b6882;font-size:13px;margin:4px 0 8px;flex-wrap:wrap;overflow:hidden}
.desc{color:#2f2946;line-height:1.5;font-size:12px;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;max-width:100%;overflow:hidden}
.tools{display:flex; justify-content:center; align-items: center; gap:6px}
.icon{border:1px solid #eee;background:#fff;border-radius:10px;padding:6px 7px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center}
.icon.danger{color:#c03645;border-color:#f1c6cf;background:#fff; margin-top: 0;}
.business .row{margin:16px 0 20px !important}
.business-info, .business-code{display:flex;align-items:center;gap:10px !important;font-size:14px !important;line-height:1.4 !important;margin-bottom:12px;flex-wrap:wrap;overflow:hidden}
.business-code{justify-content:flex-start}
.card.business{margin-bottom:20px !important; &:first-child{margin-top:20px}}
@media (min-width:768px){ 
  .business-info{margin-bottom:0}
  .business-code{justify-content:flex-end;margin-bottom:0}
}
.kbd{font:700 .9rem/1 ui-monospace,Menlo,Monaco,Consolas,"Courier New",monospace;background:#f7f4ff;border:1px solid #eadfff;border-radius:8px;padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.link{background:none;border:0;color:#9f54fd;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.pill{padding:6px 10px;border-radius:999px;font-weight:700;font-size:.85rem;border:1px solid}
.pill.ok{color:#0f8e58;border-color:#bfead6;background:#e9fbf3}
.pill.off{color:#7a7a8c;border-color:#e6e6f0;background:#f6f7fb}
.foot{display:flex !important;justify-content:flex-end !important;padding-top:14px !important;border-top:1px solid rgba(234, 223, 252, 0.8) !important;width:100% !important}

/* Botones */
.btn{border:0;cursor:pointer;font-weight:500; font-size: 14px;  min-height: 44px; width: max-content; border-radius: var(--radius);}
.btn-primary{color:#fff;border-radius:14px; font-weight:500; padding:12px 14px;background:linear-gradient(135deg,var(--primary),#7b2cbf);box-shadow:0 10px 22px rgba(159,84,253,.18);}
.btn-primary.subtle{padding:10px 12px}
.btn-primary.full{width:100%}
.btn-danger{background:#fff;color:#d23947;border:1px solid #f6cdd2;padding:10px 14px;border-radius:12px;font-weight:800}
.btn-ghost{background:#fff;border:1px solid #e8e8ee;border-radius:12px;padding:8px 12px;font-weight:700;cursor:pointer}
.btn-ghost.danger{background:#fff !important;color:#d23947 !important;border:1px solid #f6cdd2 !important;font-size:13px !important;border-radius:8px !important;padding:8px 14px !important;font-weight:600 !important;transition:all 0.2s ease !important;display:inline-flex !important;align-items:center !important;gap:6px !important;min-height:32px !important}
.btn-ghost.danger:hover{background:#fef2f2 !important;border-color:#f87171 !important;color:#dc2626 !important}
.btn-small{padding:8px 10px;border-radius:10px;border:1px solid #e6e2f6;background:#fff;font-weight:600;cursor:pointer}

/* Otros */
.head-row{display:flex;align-items:center;justify-content:space-between;margin:6px 0 14px;flex-wrap:wrap;gap:8px}
.sep{border:none;border-top:1px solid #eadffc;margin:14px 0}
.danger{margin-top:10px;padding:14px;border:1px solid #ffe4e7;background:#fff;border-radius:16px;box-shadow:var(--shadow-sm)}
.danger p{color:#4b3e66;margin:8px 0 12px;line-height:1.45;word-wrap:break-word;overflow-wrap:break-word}

/* Reglas generales para prevenir desbordamientos */
.card *{
  word-wrap:break-word;
  overflow-wrap:break-word;
  hyphens:auto;
}
.input, .input *{
  min-width:0;
}
span, p, div{
  min-width:0;
  box-sizing:border-box;
}

.mt {
  margin-top: 20px;
}

.muted {
  color: var(--muted);
}

/* Loading y alertas */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(159, 84, 253, 0.2);
  border-radius: 50%;
  border-top-color: rgb(159, 84, 253);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.alert-danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.alert-success {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #f1f0f0;
  border-radius: var(--radius);
  font-size: 15px;
  color: var(--text);
  background: var(--white);
  box-shadow: var(--shadow-sm);
  transition: border-color .2s ease, box-shadow .2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(159, 84, 253, 0.15) !important;
}

.form-control:hover:not(:focus) {
  border-color: #9ca3af;
}

.form-control:active {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(159, 84, 253, 0.15) !important;
}

/* Date inputs en modales */
.form-control[type="date"] {
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.form-control[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.delete-account-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-skill{
  background-color: #7b2cbf;
  font-size: 13px;
  color: #fff;
}
.btn-skill:focus, .btn-skill:hover{
  background-color: #63239b;
  color: #fff;
}

.chip-input{
  padding: 10px 15px 10px 10px;
  margin: 10px 0 20px 0;
}


</style>