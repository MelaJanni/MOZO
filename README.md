# MOZO - Sistema de Gestión para Restaurantes

## Descripción
MOZO es una aplicación web desarrollada con Vue.js para gestionar mesas, pedidos y personal en restaurantes. La aplicación permite a los administradores gestionar el negocio, generar códigos QR para las mesas, y a los mozos atender las solicitudes de los clientes.

## Características

### Para Administradores
- Dashboard con vista general del negocio
- Gestión de códigos QR para mesas
- Gestión de menús digitales
- Gestión de personal (mozos)
- Configuración del negocio

### Para Mozos
- Dashboard con vista de mesas asignadas
- Notificaciones en tiempo real de solicitudes de clientes
- Perfiles de mesas para agrupar y gestionar fácilmente
- Gestión de perfil personal

### Para Clientes
- Escaneo de códigos QR en mesas
- Visualización de menús digitales
- Posibilidad de llamar al mozo

## Tecnologías Utilizadas
- Vue.js 3 (Composition API)
- Bootstrap 5 
- Sass para estilos personalizados
- Vite como bundler
- Axios para peticiones HTTP

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/MOZO.git
cd MOZO

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Estructura del Proyecto

```
MOZO/
├── public/                # Archivos estáticos
├── src/                   # Código fuente
│   ├── assets/            # Recursos (imágenes, estilos)
│   │   └── styles/        # Archivos SCSS
│   ├── components/        # Componentes Vue reutilizables
│   │   ├── UI/            # Componentes de interfaz de usuario
│   │   └── ...            
│   ├── router/            # Configuración de rutas
│   ├── services/          # Servicios (API, autenticación)
│   ├── views/             # Vistas/páginas principales
│   │   ├── admin/         # Vistas para administradores
│   │   ├── auth/          # Vistas de autenticación
│   │   └── waiter/        # Vistas para mozos
│   ├── App.vue            # Componente raíz
│   └── main.js            # Punto de entrada
├── package.json           # Dependencias y scripts
└── vite.config.js         # Configuración de Vite
```

## API Endpoints

La aplicación se comunica con un backend a través de API REST. Los principales endpoints son:

### Rutas Públicas
- `POST /api/login`: Inicio de sesión
- `POST /api/forgot-password`: Solicitud de recuperación de contraseña
- `POST /api/reset-password`: Restablecimiento de contraseña
- `POST /api/tables/{table_id}/call-waiter`: Llamada al mozo desde una mesa

### Rutas Autenticadas Generales
- `GET /api/user`: Obtiene información del usuario actual
- `POST /api/logout`: Cierra sesión
- `POST /api/role/select`: Selecciona un rol (mozo o administrador)

### Rutas para Mozos
- `POST /api/waiter/onboard`: Unirse a un negocio con código
- `GET /api/waiter/tables`: Obtener las mesas del negocio
- `POST /api/waiter/tables/toggle-notifications`: Activar/desactivar notificaciones

### Rutas para Administradores
- `GET /api/admin/business`: Información del negocio
- `GET /api/admin/menus`: Obtener menús
- `POST /api/admin/menus`: Subir un nuevo menú
- `PUT /api/admin/menus/{id}/default`: Establecer menú predeterminado
- `GET /api/admin/tables`: Obtener mesas
- `POST /api/admin/tables`: Añadir mesa
- `POST /api/admin/tables/{id}/qr`: Generar código QR

## Personalización

La aplicación utiliza una paleta de colores violeta, pero puede ser personalizada fácilmente editando las variables SCSS en `src/assets/styles/variables.scss`.

## Licencia

MIT 