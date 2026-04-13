# Roadmap SISSEP - Spec-Driven Development

## Enfoque SDD (Spec-Driven Development)

> **Principio**: Las specs definen el comportamiento esperado. Cada feature se implementa escribiendo primero los tests basados en specs, luego el código que los hace pasar.

```
Spec → Test → Implementación → Validación contra Spec
```

---

## Fase 0: Fundamentos y Setup (Sprint 0)

**Objetivo**: Establecer la infraestructura base del proyecto según las especificaciones de arquitectura.

### 0.1 Setup de Proyecto Backend
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Inicializar proyecto Node.js con Express
- [ ] Configurar TypeScript (opcional pero recomendado)
- [ ] Instalar dependencias base (express, cors, helmet, dotenv)
- [ ] Configurar ESLint y Prettier
- [ ] Crear estructura de carpetas según `specs/05-backend/01-folder-structure.md`
- [ ] Crear archivo `.env.example` con todas las variables requeridas
- [ ] **Spec Reference**: [05-backend/01-folder-structure.md](./05-backend/01-folder-structure.md)

**Definition of Done**:
- Servidor corre en `localhost:3000`
- Health check endpoint `/health` responde 200
- Estructura de carpetas lista para desarrollo

---

### 0.2 Setup de Base de Datos
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Instalar PostgreSQL local (o usar Docker)
- [ ] Crear base de datos `sissep_dev`
- [ ] Configurar conexión con `pg` según `specs/02-domain/02-postgres-schema.md`
- [ ] Crear tablas: `users`, `categories`, `documents`, `observations`
- [ ] Crear índices especificados
- [ ] Configurar migraciones (usar node-pg-migrate o Prisma)
- [ ] **Spec Reference**: [02-domain/02-postgres-schema.md](./02-domain/02-postgres-schema.md)

**Definition of Done**:
- Conexión a BD exitosa desde Node.js
- Tablas creadas según esquema
- Script de migración funciona

---

### 0.3 Setup de Proyecto Frontend
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear proyecto Next.js con `create-next-app`
- [ ] Configurar TypeScript
- [ ] Instalar Tailwind CSS
- [ ] Instalar dependencias: axios, react-query (opcional)
- [ ] Crear estructura de carpetas según `specs/04-frontend/01-folder-structure.md`
- [ ] Configurar path aliases (`@/components`, `@/viewmodels`, etc.)
- [ ] Configurar ESLint y Prettier
- [ ] **Spec Reference**: [04-frontend/01-folder-structure.md](./04-frontend/01-folder-structure.md)

**Definition of Done**:
- Frontend corre en `localhost:5173` (o puerto de Next.js)
- Tailwind CSS funciona
- Estructura de carpetas lista

---

### 0.4 Configuración de Docker
**Prioridad**: Media | **Estimado**: 1 día

- [ ] Crear `Dockerfile` para backend
- [ ] Crear `Dockerfile` para frontend
- [ ] Crear `docker-compose.yml` con PostgreSQL
- [ ] Configurar red entre contenedores
- [ ] **Spec Reference**: [07-deployment/02-docker.md](./07-deployment/02-docker.md)

**Definition of Done**:
- `docker-compose up` levanta toda la aplicación
- Servicios se comunican entre sí

---

## Fase 1: Backend Core - Autenticación y Usuarios

**Objetivo**: Implementar el núcleo del backend: autenticación, autorización y gestión de usuarios.

### 1.1 Implementar Modelo de Usuario
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/models/user.model.js` con operaciones CRUD
- [ ] Implementar métodos: `create`, `findById`, `findByControlNumber`, `findByEmail`, `update`
- [ ] Agregar tests unitarios para el modelo
- [ ] **Spec Reference**: [02-domain/01-domain-model.md](./02-domain/01-domain-model.md) - Entidad User

**Tests a implementar**:
- Crear usuario con datos válidos
- Rechazar duplicados (controlNumber, email)
- Buscar por ID

---

### 1.2 Servicio de Autenticación
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/services/auth.service.js`
- [ ] Implementar `login()` con validación de credenciales
- [ ] Implementar generación de JWT (access + refresh)
- [ ] Implementar `logout()` y revocación de tokens
- [ ] Implementar `refreshToken()`
- [ ] Agregar bcrypt para hasheo de contraseñas (12 rounds)
- [ ] **Spec Reference**: [03-api/02-auth-endpoints.md](./03-api/02-auth-endpoints.md)

**Tests a implementar**:
- Login exitoso retorna tokens
- Login fallido con credenciales incorrectas
- Refresh token válido genera nuevos tokens
- Refresh token inválido rechazado

---

### 1.3 Middleware de Autenticación
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/middlewares/auth.middleware.js`
- [ ] Implementar verificación de JWT
- [ ] Implementar `authorize()` para roles
- [ ] Manejar errores: token expirado, token inválido, sin token
- [ ] **Spec Reference**: [06-quality/03-security.md](./06-quality/03-security.md) - JWT Section

**Tests a implementar**:
- Request con token válido pasa
- Request sin token retorna 401
- Request con token expirado retorna 401
- Request a ruta protegida con rol incorrecto retorna 403

---

### 1.4 Controladores de Autenticación
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/controllers/auth.controller.js`
- [ ] Implementar `POST /auth/login`
- [ ] Implementar `POST /auth/logout`
- [ ] Implementar `POST /auth/refresh`
- [ ] Implementar `GET /auth/me`
- [ ] Implementar manejo de errores consistente
- [ ] **Spec Reference**: [05-backend/02-controllers.md](./05-backend/02-controllers.md) - Auth Controller

**Tests a implementar**:
- Tests de integración para cada endpoint
- Verificar formato de respuesta según spec

---

### 1.5 Servicio y Controlador de Usuarios
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/services/user.service.js`
- [ ] Implementar CRUD de usuarios
- [ ] Validar reglas de negocio (email institucional, campos requeridos)
- [ ] Crear `src/controllers/user.controller.js`
- [ ] Implementar endpoints: GET, POST, PUT, DELETE `/users`
- [ ] Implementar filtrado y paginación
- [ ] **Spec Reference**: [03-api/03-user-endpoints.md](./03-api/03-user-endpoints.md)

**Tests a implementar**:
- Crear usuario con éxito
- Validar duplicados
- Filtrado por rol
- Paginación funciona correctamente

---

### 1.6 Seed Data
**Prioridad**: Media | **Estimado**: 1 día

- [ ] Crear `scripts/seed.js`
- [ ] Crear usuario admin inicial
- [ ] Crear categorías de documentos (SS-SOL, SS-CARTA, etc.)
- [ ] Crear usuario de prueba (estudiante)
- [ ] **Spec Reference**: [02-domain/02-postgres-schema.md](./02-domain/02-postgres-schema.md) - Seeds Section

---

## Fase 2: Backend Core - Documentos y Archivos

**Objetivo**: Implementar gestión de documentos, upload y revisiones.

### 2.1 Modelos de Documentos y Categorías
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/models/category.model.js`
- [ ] Crear `src/models/document.model.js`
- [ ] Crear `src/models/observation.model.js`
- [ ] Implementar relaciones entre modelos
- [ ] **Spec Reference**: [02-domain/01-domain-model.md](./02-domain/01-domain-model.md)

---

### 2.2 Servicio de Almacenamiento de Archivos
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/services/fileStorage.service.js`
- [ ] Implementar validación de archivos (magic bytes, mime type)
- [ ] Implementar generación de paths según especificación
- [ ] Implementar `saveFile()`, `deleteFile()`, `getFileStream()`
- [ ] Configurar límites: max 10MB, extensiones permitidas
- [ ] **Spec Reference**: [02-domain/03-file-storage.md](./02-domain/03-file-storage.md)

**Tests a implementar**:
- Validar archivo PDF válido pasa
- Rechazar archivo ejecutable
- Rechazar archivo > 10MB
- Guardar archivo genera path correcto

---

### 2.3 Servicio de Documentos
**Prioridad**: Alta | **Estimado**: 3 días

- [ ] Crear `src/services/document.service.js`
- [ ] Implementar `getDocuments()` con filtros
- [ ] Implementar `uploadDocument()` con transacciones
- [ ] Implementar `reviewDocument()` (aprobar/rechazar)
- [ ] Implementar `getStudentsProgress()` para dashboard admin
- [ ] Implementar `createInitialDocuments()` para nuevos estudiantes
- [ ] **Spec Reference**: [05-backend/03-services.md](./05-backend/03-services.md) - Document Service

**Tests a implementar**:
- Listar documentos con filtros
- Subir archivo cambia estado a pending
- Revisar documento actualiza estado y crea observación
- No se puede modificar documento aprobado

---

### 2.4 Controlador de Documentos
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/controllers/document.controller.js`
- [ ] Implementar `GET /documents`
- [ ] Implementar `POST /documents/:id/upload` con Multer
- [ ] Implementar `PATCH /documents/:id/review`
- [ ] Implementar `GET /documents/progress`
- [ ] Implementar `GET /documents/:id/download`
- [ ] Implementar validación de permisos (propietario/admin)
- [ ] **Spec Reference**: [03-api/04-document-endpoints.md](./03-api/04-document-endpoints.md)

---

### 2.5 Configuración de Upload (Multer)
**Prioridad**: Media | **Estimado**: 1 día

- [ ] Crear `src/middlewares/upload.middleware.js`
- [ ] Configurar Multer con límites
- [ ] Configurar almacenamiento temporal
- [ ] Manejar errores de upload
- [ ] **Spec Reference**: [02-domain/03-file-storage.md](./02-domain/03-file-storage.md) - Middleware Section

---

## Fase 3: Frontend - Autenticación y Navegación

**Objetivo**: Implementar login y estructura base del frontend.

### 3.1 Servicios API (Frontend)
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/services/api.ts` configuración base de Axios
- [ ] Crear `src/services/auth.ts` con métodos login/logout
- [ ] Configurar interceptores para JWT y refresh token
- [ ] Crear tipos TypeScript para requests/responses
- [ ] **Spec Reference**: [04-frontend/04-services.md](./04-frontend/04-services.md)

---

### 3.2 Context de Autenticación (ViewModel)
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/contexts/AuthContext.tsx`
- [ ] Implementar estado de autenticación
- [ ] Implementar `login()`, `logout()`, `refreshToken()`
- [ ] Persistir sesión en localStorage
- [ ] Crear hook `useAuthViewModel()`
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - useAuthViewModel

---

### 3.3 Componentes UI Base
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/components/ui/Button.tsx`
- [ ] Crear `src/components/ui/Input.tsx`
- [ ] Crear `src/components/ui/Spinner.tsx`
- [ ] Crear `src/components/ui/StatusPill.tsx`
- [ ] Implementar variantes y estados (loading, disabled)
- [ ] **Spec Reference**: [04-frontend/03-view-components.md](./04-frontend/03-view-components.md)

---

### 3.4 Página de Login
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/app/(auth)/login/page.tsx`
- [ ] Implementar formulario con campos: controlNumber, password, role
- [ ] Implementar validaciones en tiempo real
- [ ] Integrar con `useLoginViewModel()`
- [ ] Mostrar errores de autenticación
- [ ] Implementar redirección post-login
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - useLoginViewModel

---

### 3.5 Layout de Dashboard
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Crear `src/app/dashboard/layout.tsx`
- [ ] Implementar protección de ruta (redirect si no hay sesión)
- [ ] Crear Navbar con logo y botón logout
- [ ] Implementar estructura responsive
- [ ] **Spec Reference**: [04-frontend/03-view-components.md](./04-frontend/03-view-components.md) - Navbar

---

## Fase 4: Frontend - Panel del Estudiante

**Objetivo**: Implementar funcionalidad completa para estudiantes.

### 4.1 ViewModel de Estudiante
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/viewmodels/useStudentViewModel.ts`
- [ ] Implementar carga de documentos
- [ ] Implementar cambio de sección (servicio_social/residencias)
- [ ] Implementar lógica de progreso
- [ ] Manejar estados de loading/error
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - useStudentViewModel

---

### 4.2 Componente DocumentList
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/components/documents/DocumentList.tsx`
- [ ] Implementar tabla de documentos con categorías
- [ ] Mostrar estado con StatusPill
- [ ] Mostrar última observación si existe
- [ ] Implementar botón "Subir" para documentos sin archivo
- [ ] **Spec Reference**: [04-frontend/03-view-components.md](./04-frontend/03-view-components.md) - DocumentList

---

### 4.3 Upload de Archivos
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear componente de upload con input file oculto
- [ ] Implementar drag & drop (opcional)
- [ ] Mostrar progreso de upload
- [ ] Validar tipo de archivo antes de enviar
- [ ] Integrar con servicio de upload
- [ ] Actualizar lista tras upload exitoso
- [ ] **Spec Reference**: [03-api/04-document-endpoints.md](./03-api/04-document-endpoints.md) - Upload Section

---

### 4.4 Panel de Progreso
**Prioridad**: Media | **Estimado**: 1 día

- [ ] Mostrar avatar con iniciales
- [ ] Mostrar barra de progreso circular/lineal
- [ ] Mostrar contador "X de Y documentos aprobados"
- [ ] Implementar selector de programa (SS/Residencias)
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - Progress tracking

---

## Fase 5: Frontend - Panel del Administrador

**Objetivo**: Implementar funcionalidad para encargados y admins.

### 5.1 ViewModel de Admin
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/viewmodels/useAdminViewModel.ts`
- [ ] Implementar carga de lista de estudiantes
- [ ] Implementar filtrado y búsqueda
- [ ] Implementar selección de estudiante para ver detalle
- [ ] Implementar estadísticas resumidas
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - useAdminViewModel

---

### 5.2 Lista de Estudiantes
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear `src/components/documents/StudentProgressList.tsx`
- [ ] Implementar tabla con: controlNumber, progreso, aprobados, pendientes
- [ ] Mostrar barra de progreso visual
- [ ] Implementar búsqueda en tiempo real
- [ ] Agregar columna "Ver expediente"
- [ ] **Spec Reference**: [04-frontend/03-view-components.md](./04-frontend/03-view-components.md) - StudentProgressList

---

### 5.3 Detalle de Expediente
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear vista de detalle para estudiante seleccionado
- [ ] Mostrar todos los documentos del estudiante
- [ ] Implementar botones Aprobar/Rechazar
- [ ] Mostrar visor de PDF/imagen inline
- [ ] Implementar formulario de observaciones
- [ ] **Spec Reference**: [03-api/04-document-endpoints.md](./03-api/04-document-endpoints.md) - Review Section

---

### 5.4 Gestión de Usuarios (Admin)
**Prioridad**: Media | **Estimado**: 2 días

- [ ] Crear página de gestión de usuarios
- [ ] Implementar tabla con paginación
- [ ] Implementar creación de usuario (modal)
- [ ] Implementar activación/desactivación
- [ ] Filtrado por rol y búsqueda
- [ ] **Spec Reference**: [03-api/03-user-endpoints.md](./03-api/03-user-endpoints.md)

---

## Fase 6: Calidad y Testing

**Objetivo**: Asegurar calidad mediante tests y cumplimiento de atributos.

### 6.1 Tests Backend
**Prioridad**: Alta | **Estimado**: 3 días

- [ ] Configurar Jest para backend
- [ ] Crear tests unitarios para services
- [ ] Crear tests de integración para controllers
- [ ] Crear tests para autenticación
- [ ] Configurar coverage > 70%
- [ ] **Spec Reference**: [05-backend/03-services.md](./05-backend/03-services.md) - Testing Section

---

### 6.2 Tests Frontend
**Prioridad**: Alta | **Estimado**: 3 días

- [ ] Configurar Jest + React Testing Library
- [ ] Tests para componentes UI
- [ ] Tests para ViewModels (hooks)
- [ ] Tests para servicios (mock de API)
- [ ] Configurar coverage > 70%
- [ ] **Spec Reference**: [04-frontend/02-viewmodels.md](./04-frontend/02-viewmodels.md) - Testing

---

### 6.3 Accesibilidad (WCAG)
**Prioridad**: Media | **Estimado**: 2 días

- [ ] Agregar ARIA labels a componentes
- [ ] Verificar navegación por teclado
- [ ] Verificar contraste de colores (4.5:1)
- [ ] Agregar skip links
- [ ] Test con axe-core
- [ ] **Spec Reference**: [06-quality/04-accessibility.md](./06-quality/04-accessibility.md)

---

### 6.4 Seguridad
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Configurar Helmet.js con headers seguros
- [ ] Configurar CORS restrictivo
- [ ] Implementar rate limiting en endpoints críticos
- [ ] Validar todas las entradas con Joi
- [ ] Revisar permisos en cada endpoint
- [ ] **Spec Reference**: [06-quality/03-security.md](./06-quality/03-security.md)

---

## Fase 7: Deployment y Producción

**Objetivo**: Preparar y desplegar a producción.

### 7.1 Configuración de Producción
**Prioridad**: Alta | **Estimado**: 2 días

- [ ] Crear archivos `.env.production`
- [ ] Configurar variables seguras (secrets)
- [ ] Configurar SSL/TLS
- [ ] Preparar scripts de build
- [ ] **Spec Reference**: [07-deployment/01-environments.md](./07-deployment/01-environments.md)

---

### 7.2 Docker Production
**Prioridad**: Alta | **Estimado**: 1 día

- [ ] Optimizar Dockerfiles (multi-stage)
- [ ] Configurar `docker-compose.prod.yml`
- [ ] Configurar Nginx reverse proxy
- [ ] Configurar healthchecks
- [ ] **Spec Reference**: [07-deployment/02-docker.md](./07-deployment/02-docker.md)

---

### 7.3 CI/CD Pipeline
**Prioridad**: Media | **Estimado**: 2 días

- [ ] Configurar GitHub Actions
- [ ] Workflow de tests en PR
- [ ] Workflow de deploy a staging
- [ ] Workflow de deploy a producción
- [ ] Configurar notificaciones de deploy
- [ ] **Spec Reference**: [07-deployment/01-environments.md](./07-deployment/01-environments.md) - CI/CD Section

---

### 7.4 Monitoreo
**Prioridad**: Media | **Estimado**: 1 día

- [ ] Configurar logs estructurados
- [ ] Configurar endpoint `/health`
- [ ] Agregar métricas básicas (requests, errores)
- [ ] Configurar alertas de error
- [ ] **Spec Reference**: [06-quality/02-scalability.md](./06-quality/02-scalability.md) - Monitoring

---

## Resumen de Timelines

| Fase | Duración Estimada | Entregable Principal |
|------|-------------------|---------------------|
| Fase 0: Fundamentos | 6 días | Proyectos corriendo localmente |
| Fase 1: Backend Auth | 9 días | API de autenticación funcional |
| Fase 2: Backend Docs | 9 días | API de documentos completa |
| Fase 3: Frontend Auth | 8 días | Login funcional, protección de rutas |
| Fase 4: Frontend Estudiante | 7 días | Panel de estudiante completo |
| Fase 5: Frontend Admin | 8 días | Panel de admin completo |
| Fase 6: Testing | 10 días | >70% coverage, accesibilidad OK |
| Fase 7: Deployment | 6 días | App en producción |
| **Total** | **63 días (~3 meses)** | **Producción lista** |

---

## Priorización de Tareas (MVP)

Para un MVP funcional, priorizar en este orden:

### Sprint 1 (Semanas 1-2): Fundamentos + Auth
1. Setup proyectos (backend + frontend)
2. Database schema
3. Login/Logout API
4. Login UI
5. Protección de rutas

### Sprint 2 (Semanas 3-4): Documentos Estudiante
1. Modelo de documentos
2. Upload de archivos
3. Lista de documentos (estudiante)
4. Progreso visual

### Sprint 3 (Semanas 5-6): Admin + Revisión
1. Lista de estudiantes (admin)
2. Detalle de documentos
3. Aprobar/Rechazar documentos
4. Observaciones

### Sprint 4 (Semanas 7-8): Testing + Deploy
1. Tests críticos
2. Seguridad básica
3. Docker
4. Producción

---

## Seguimiento del Proyecto

### Métricas de Progreso

```
Specs Implementadas: ___/23
Tests Pasando: ___/___
Coverage: ___%
Endpoints Funcionales: ___/___
Componentes UI: ___/___
```

### Definición de Done (DoD)

Para cada tarea:
- [ ] Código escrito siguiendo la spec correspondiente
- [ ] Tests escritos y pasando
- [ ] Validado contra criterios de aceptación de la spec
- [ ] Revisado por pares (code review)
- [ ] Documentación actualizada (si aplica)
- [ ] Funciona en ambiente de desarrollo

---

**Nota**: Este roadmap es una guía. Las estimaciones pueden ajustarse según el equipo y la velocidad de desarrollo. Lo importante es mantener el enfoque SDD: specs → tests → implementación.
