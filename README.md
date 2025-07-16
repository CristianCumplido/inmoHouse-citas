# Sistema de Gestión de Citas Inmobiliarias - Microfrontend

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema completo de gestión de citas para un negocio inmobiliario utilizando:

- **Backend**: Node.js + Express + MongoDB con arquitectura cebolla
- **Microfrontend**: Angular 16 con Module Federation para gestión de citas
- **Aplicación Principal**: Angular con integración del microfrontend

## 🏗️ Arquitectura del Sistema

```
├── Backend (Puerto 3000)
│   ├── Arquitectura Cebolla
│   ├── MongoDB
│   └── API RESTful
│
├── Aplicación Principal (Puerto 4200)
│   ├── Dashboard
│   ├── Propiedades
│   ├── Usuarios
│   └── Host para Microfrontends
│
└── Microfrontend Citas (Puerto 4201)
    ├── Lista de Citas
    ├── Crear/Editar Citas
    └── Detalle de Citas
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js v18 o superior
- MongoDB v6 o superior
- Angular CLI v16
- Git

### 1. Clonar y Configurar Backend

```bash
# Crear directorio del proyecto
mkdir real-estate-system
cd real-estate-system

# Crear backend
mkdir backend
cd backend

# Inicializar proyecto Node.js
npm init -y

# Instalar dependencias
npm install express mongoose cors helmet express-rate-limit bcryptjs jsonwebtoken joi dotenv

# Instalar dependencias de desarrollo
npm install --save-dev @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/node typescript ts-node-dev jest @types/jest

# Crear tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Crear estructura de directorios
mkdir -p src/{domain/{entities,repositories},application/usecases,infrastructure/{database/{models,connection},middleware,repositories,routes},presentation/controllers}

# Crear archivo .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/real_estate_db
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4201
EOF

# Agregar scripts a package.json
npm pkg set scripts.dev="ts-node-dev --respawn --transpile-only src/main.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/main.js"
```

### 2. Implementar Código del Backend

Copie todos los archivos de código TypeScript generados anteriormente en la estructura correspondiente:

```bash
# Entidades de dominio
# Copiar appointment.entities.ts a src/domain/entities/

# Modelos de MongoDB
# Copiar appointment.model.ts a src/infrastructure/database/models/

# Casos de uso
# Copiar appointment.usecase.ts a src/application/usecases/

# Controladores
# Copiar appointment.controller.ts a src/presentation/controllers/

# Repositorios
# Copiar appointment.repository.ts (interface) a src/domain/repositories/
# Copiar appointment.repository.ts (implementation) a src/infrastructure/repositories/

# Rutas
# Copiar appointment.routes.ts a src/infrastructure/routes/

# Archivo principal
# Copiar main.ts a src/
```

### 3. Crear Microfrontend de Citas

```bash
# Volver al directorio raíz
cd ..

# Crear proyecto Angular para microfrontend
ng new appointments-microfrontend --routing --style=scss --skip-git
cd appointments-microfrontend

# Instalar Module Federation
ng add @angular-architects/module-federation --project appointments-microfrontend --port 4201

# Instalar dependencias adicionales
npm install @angular/forms
```

### 4. Configurar Module Federation - Microfrontend

Reemplazar el contenido de `webpack.config.js`:

```javascript
const ModuleFederationPlugin = require("@module-federation/webpack");

module.exports = {
  mode: "development",
  plugins: [
    new ModuleFederationPlugin({
      name: "appointments",
      filename: "remoteEntry.js",
      exposes: {
        "./AppointmentsModule": "./src/app/appointments/appointments.module.ts",
      },
      shared: {
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/forms": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        rxjs: { singleton: true, strictVersion: true, requiredVersion: "auto" },
      },
    }),
  ],
  devServer: {
    port: 4201,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
};
```

### 5. Implementar Código del Microfrontend

Crear la estructura de directorios y copiar todos los archivos TypeScript, HTML y SCSS generados anteriormente:

```bash
# Crear estructura
mkdir -p src/app/{core/{domain/entities,application/services,infrastructure/services},appointments/{components/{appointments-list,appointment-form,appointment-detail}}}

# Copiar archivos según la estructura mostrada en los artefactos anteriores
```

### 6. Configurar Aplicación Principal (Host)

```bash
# Volver al directorio raíz y crear aplicación principal
cd ..
ng new real-estate-main --routing --style=scss --skip-git
cd real-estate-main

# Instalar Module Federation
ng add @angular-architects/module-federation --project real-estate-main --port 4200
```

Configurar `webpack.config.js` del host:

```javascript
const ModuleFederationPlugin = require("@module-federation/webpack");

module.exports = {
  mode: "development",
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",
      remotes: {
        appointments: "appointments@http://localhost:4201/remoteEntry.js",
      },
      shared: {
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: "auto" },
        rxjs: { singleton: true, strictVersion: true, requiredVersion: "auto" },
      },
    }),
  ],
};
```

Actualizar `src/app/app-routing.module.ts`:

```typescript
const routes: Routes = [
  {
    path: "appointments",
    loadChildren: () => import("appointments/AppointmentsModule").then((m) => m.AppointmentsModule),
  },
  // ... otras rutas
];
```

### 7. Configurar MongoDB

```bash
# Iniciar MongoDB
mongod

# En otra terminal, crear base de datos e índices
mongosh
use real_estate_db
db.createCollection('users')
db.createCollection('properties')
db.createCollection('appointments')

# Crear índices
db.users.createIndex({ email: 1 }, { unique: true })
db.appointments.createIndex({ propertyId: 1 })
db.appointments.createIndex({ clientId: 1 })
db.appointments.createIndex({ date: 1 })
```

### 8. Ejecutar en Desarrollo

Crear script de inicio `start-dev.sh`:

```bash
#!/bin/bash
echo "Iniciando aplicación Real Estate..."

# Backend
cd backend && npm run dev &

# Esperar 3 segundos
sleep 3

# Microfrontend de citas
cd ../appointments-microfrontend && ng serve --port 4201 &

# Aplicación principal
cd ../real-estate-main && ng serve --port 4200 &

echo "Servicios iniciados:"
echo "Backend API: http://localhost:3000"
echo "Aplicación Principal: http://localhost:4200"
echo "Microfrontend Citas: http://localhost:4201"

wait
```

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## 📚 Funcionalidades Implementadas

### Backend

- ✅ Arquitectura cebolla completa
- ✅ CRUD de citas con validaciones
- ✅ Validación de disponibilidad horaria
- ✅ Permisos por roles (Cliente, Agente, Admin)
- ✅ Estados de cita (Pendiente, Confirmada, Completada, Cancelada)
- ✅ Relaciones con propiedades y usuarios

### Microfrontend de Citas

- ✅ Lista de citas con filtros y paginación
- ✅ Formulario de crear/editar citas
- ✅ Vista detallada de citas
- ✅ Permisos basados en roles
- ✅ Validaciones de formulario
- ✅ Estados visuales de citas

### Integración

- ✅ Module Federation configurado
- ✅ Comunicación entre microfrontends
- ✅ Autenticación compartida
- ✅ Estilos consistentes

## 🔧 Configuraciones Adicionales

### Variables de Entorno

**Backend (.env):**

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/real_estate_db
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
```

**Frontend (environment.ts):**

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
};
```

### Rutas de la API

- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/:id` - Obtener cita
- `PUT /api/appointments/:id` - Actualizar cita
- `PATCH /api/appointments/:id/cancel` - Cancelar cita
- `PATCH /api/appointments/:id/confirm` - Confirmar cita
- `PATCH /api/appointments/:id/complete` - Completar cita

### Permisos por Rol

**Cliente:**

- Crear citas
- Ver sus propias citas
- Cancelar citas pendientes/confirmadas

**Agente:**

- Ver todas las citas
- Confirmar citas
- Completar citas
- Modificar notas de agente

**Administrador:**

- Acceso completo a todas las funcionalidades

## 🚀 Despliegue en Producción

### Opción 2: Manual

```bash
# Construir backend
cd backend && npm run build

# Construir microfrontend
cd ../appointments-microfrontend && ng build --prod

# Construir aplicación principal
cd ../real-estate-main && ng build --prod

# Servir con nginx o servidor web preferido
```

## 🐛 Troubleshooting

### Errores Comunes

1. **Module Federation no funciona:**

   - Verificar que ambos puertos estén corriendo
   - Revisar configuración CORS en backend
   - Verificar versiones de Angular coincidan

2. **Base de datos no conecta:**

   - Verificar que MongoDB esté corriendo
   - Revisar URI de conexión en .env

3. **Errores de autenticación:**
   - Verificar JWT_SECRET en backend
   - Revisar almacenamiento de tokens en frontend

## 📞 Soporte

Para dudas o problemas:

1. Revisar logs del backend en consola
2. Verificar errores en DevTools del navegador
3. Comprobar que todos los servicios estén corriendo

## 🎯 Próximos Pasos

- [ ] Implementar notificaciones en tiempo real
- [ ] Agregar sistema de recordatorios
- [ ] Integrar calendario de disponibilidad de agentes
- [ ] Implementar métricas y analytics
- [ ] Agregar tests unitarios y e2e
