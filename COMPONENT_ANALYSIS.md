# Análisis Completo de Componentes Frontend

## 📋 **Inventario Completo**

### `/UI/` - Componentes de Interfaz Base
- `BaseButton.vue` - Botón base reutilizable
- `BaseInput.vue` - Input base reutilizable  
- `BaseModal.vue` - Modal base reutilizable
- `BottomSheet.vue` - Hoja inferior para móviles
- `NotificationBell.vue` - Campana de notificaciones
- `SendNotificationModal.vue` - Modal para enviar notificaciones
- `Navbar.vue` - Barra de navegación
- `InputModal.vue` - Modal con input
- `SkeletonLoader.vue` - Loader de skeleton
- `DebugPanel.vue` - Panel de debug

### `/layout/` - Componentes de Layout
- `AppHeader.vue` - Header principal de la app
- `AppOffcanvas.vue` - Menu lateral tipo offcanvas
- `OffCanvasNavbar.vue` - Navbar con offcanvas
- `NotificationsSidebar.vue` - Sidebar de notificaciones

### `/skeletons/` - Componentes de Loading
- `MenuCardSkeleton.vue` - Skeleton para tarjetas de menú
- `TableListItemSkeleton.vue` - Skeleton para items de tabla
- `StaffCardSkeleton.vue` - Skeleton para tarjetas de staff
- `RequestCardSkeleton.vue` - Skeleton para tarjetas de request

### `/icons/` - Iconos
- `MozoIcon.vue` - Sistema de iconos de la app

### `/Public/` - Componentes Públicos
- `CallWaiterButton.vue` - Botón para llamar mozo (vista pública)

### `/Admin/` - Específicos de Admin
- `BusinessSetup.vue` - Configuración de negocios

### `/Waiter/` - Específicos de Waiter
[Lista de componentes de waiter que analicemos]

### Componentes Raíz (sin carpeta específica)
- `EditableField.vue` - Campo editable inline
- `GoogleSignInBtn.vue` - Botón de Google Sign In
- `ProfileAvatar.vue` - Avatar de perfil de usuario
- `ReviewCard.vue` - Tarjeta de reseña
- `RequestCard.vue` - Tarjeta de solicitud
- `StaffCard.vue` - Tarjeta de staff
- `NotificationPanel.vue` - Panel de notificaciones
- `NotificationDebugPanel.vue` - Panel debug de notificaciones

---

## 🔍 **Análisis de Uso**

### Componentes Base (UI) - **MUY UTILIZADOS** ✅
- `BaseButton.vue` - Usado en 12+ archivos (Admin/Staff, Profile, Settings, etc.)
- `BaseModal.vue` - Usado en 10+ archivos (múltiples vistas y componentes)  
- `BaseInput.vue` - Usado en SendNotificationModal
- **VEREDICTO**: Bien organizados, mantener en `/UI/`

### Componentes de Perfil - **DUPLICADOS** ⚠️
- `ProfileAvatar.vue` - Usado en Waiter/Profile y Admin/StaffDetail
- **PROBLEMA**: Ambos roles usan el mismo componente de avatar
- **ACCIÓN**: Mover a `/shared/` ya que es compartido

### Componentes de Tarjetas - **ESPECÍFICOS POR ROL** 📋
- `StaffCard.vue` - Solo usado en Admin/Staff
- `RequestCard.vue` - Solo usado en Admin/Staff  
- `ReviewCard.vue` - Solo usado en Admin/StaffDetail
- **VEREDICTO**: Son específicos de Admin, mover a `/Admin/`

### Componentes de Layout - **COMPARTIDOS** 🏗️
- `AppHeader.vue` - Usado en múltiples layouts
- `OffCanvasNavbar.vue` - Usado en App.vue principal
- `NotificationsSidebar.vue` - Usado en Admin/Dashboard y Waiter/Dashboard
- **VEREDICTO**: Son compartidos entre roles, bien ubicados

### Componentes Waiter - **ELIMINADOS** 🗑️
- `TableSelector.vue` - **FALTA** (referenciado en Waiter/Dashboard pero eliminado)
- `BusinessSelector.vue` - **FALTA** (referenciado pero eliminado)
- `BusinessTablesManager.vue` - **FALTA** (referenciado pero eliminado)
- `TableProfilesManager.vue` - **FALTA** (referenciado pero eliminado)
- `TableCard.vue` - **FALTA** (referenciado pero eliminado)  
- `AllTablesModal.vue` - **FALTA** (referenciado pero eliminado)

### Componentes de Iconos y Skeletons - **BIEN ORGANIZADOS** ✅
- `MozoIcon.vue` - Sistema de iconos centralizado
- Skeletons organizados por tipo (Staff, Request, Table, Menu)
- **VEREDICTO**: Mantener estructura actual

---

## 📋 **PLAN DE REORGANIZACIÓN**

### 🎯 **ACCIONES INMEDIATAS REQUERIDAS**

#### 1. **CREAR CARPETA `/shared/`** 
```
/components/shared/
├── ProfileAvatar.vue      (mover desde raíz)
├── EditableField.vue      (mover desde raíz) 
└── GoogleSignInBtn.vue    (mover desde raíz)
```

#### 2. **REORGANIZAR CARPETA `/Admin/`**
```
/components/Admin/
├── BusinessSetup.vue      (ya existe)
├── StaffCard.vue          (mover desde raíz)
├── RequestCard.vue        (mover desde raíz)
└── ReviewCard.vue         (mover desde raíz)
```

#### 3. **MANTENER BIEN ORGANIZADOS**
- `/UI/` - Componentes base (BaseButton, BaseModal, etc.)
- `/layout/` - Componentes de layout (AppHeader, etc.)
- `/skeletons/` - Loaders específicos
- `/icons/` - Sistema de iconos
- `/Public/` - Componentes públicos

#### 4. **LIMPIAR COMPONENTES RAÍZ**
- Mover `NotificationPanel.vue` a `/UI/`
- Mover `NotificationDebugPanel.vue` a `/UI/`

#### 5. **PROBLEMA CRÍTICO - Waiter Dashboard**
- El `Waiter/Dashboard.vue` tiene imports rotos
- Faltan 6 componentes eliminados
- **DECISIÓN NECESARIA**: ¿Recrear componentes o refactorizar Dashboard?

---

## 🚨 **ESTRUCTURA FINAL PROPUESTA**

```
/components/
├── /UI/                    # Componentes base reutilizables
│   ├── BaseButton.vue
│   ├── BaseModal.vue
│   ├── BaseInput.vue
│   ├── BottomSheet.vue
│   ├── Navbar.vue
│   ├── NotificationBell.vue
│   ├── SendNotificationModal.vue
│   ├── InputModal.vue
│   ├── SkeletonLoader.vue
│   ├── DebugPanel.vue
│   ├── NotificationPanel.vue          # MOVER AQUÍ
│   └── NotificationDebugPanel.vue     # MOVER AQUÍ
├── /shared/                # Componentes compartidos entre roles
│   ├── ProfileAvatar.vue   # MOVER AQUÍ
│   ├── EditableField.vue   # MOVER AQUÍ
│   └── GoogleSignInBtn.vue # MOVER AQUÍ
├── /Admin/                 # Específicos del rol Admin
│   ├── BusinessSetup.vue
│   ├── StaffCard.vue       # MOVER AQUÍ
│   ├── RequestCard.vue     # MOVER AQUÍ
│   └── ReviewCard.vue      # MOVER AQUÍ
├── /Waiter/                # Específicos del rol Waiter
│   └── [VACÍO - componentes eliminados]
├── /layout/                # Componentes de layout
│   ├── AppHeader.vue
│   ├── AppOffcanvas.vue
│   ├── OffCanvasNavbar.vue
│   └── NotificationsSidebar.vue
├── /skeletons/             # Componentes de loading
│   ├── MenuCardSkeleton.vue
│   ├── TableListItemSkeleton.vue
│   ├── StaffCardSkeleton.vue
│   └── RequestCardSkeleton.vue
├── /icons/
│   └── MozoIcon.vue
└── /Public/
    └── CallWaiterButton.vue
```