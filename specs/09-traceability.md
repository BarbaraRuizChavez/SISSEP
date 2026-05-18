# 09 - Traceability

## Mapa modulo -> archivos

### Backend API — nucleo

- Entrada y bootstrap: `backend/src/server.ts`
- Enrutamiento:
  - `backend/src/routes/index.ts`
  - `backend/src/routes/auth.routes.ts`
  - `backend/src/routes/document.routes.ts`
  - `backend/src/routes/period.routes.ts`
- Controladores:
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/controllers/document.controller.ts`
  - `backend/src/controllers/period.controller.ts`
- Servicios:
  - `backend/src/services/auth.service.ts`
  - `backend/src/services/document.service.ts`
  - `backend/src/services/period.service.ts`

### Seguridad backend

- JWT: `backend/src/utils/jwt.ts`
- Auth middleware: `backend/src/middlewares/auth.middleware.ts`
- Password: `backend/src/utils/hash.ts`
- Errores: `backend/src/middlewares/error.middleware.ts`
- Upload documentos: `backend/src/middlewares/upload.middleware.ts`
- Rutas de archivo: `backend/src/utils/folders.ts`
- Respuestas API: `backend/src/utils/response.ts`

### Modelo de dominio

- Entidades:
  - `backend/src/models/UserEntity.ts`
  - `backend/src/models/DocumentEntity.ts`
  - `backend/src/models/DeliveryPeriodEntity.ts`
- Tipos: `backend/src/types/index.ts`
- Catalogos: `backend/src/utils/catalog.ts`

### Frontend

- Layout y auth global:
  - `frontend/app/layout.tsx`
  - `frontend/context/AuthContext.tsx`
- Auth:
  - `frontend/app/(auth)/login/page.tsx`
  - `frontend/app/(auth)/register/page.tsx`
- Dashboard:
  - `frontend/app/dashboard/layout.tsx`
  - `frontend/app/dashboard/page.tsx`
  - `frontend/app/dashboard/(student)/student/page.tsx`
  - `frontend/app/dashboard/(admin)/admin/page.tsx`
- Cliente API y tipos:
  - `frontend/lib/api.ts`
  - `frontend/types/index.ts`
- UI:
  - `frontend/components/ui/StatusPill.tsx`
  - `frontend/components/ui/Spinner.tsx`
  - `frontend/components/ui/Modal.tsx`

### Base de datos e infraestructura

- Esquema SQL: `database/init.sql`
- Docker: `docker-compose.yml`
- Config backend:
  - `backend/src/config/env.ts`
  - `backend/src/config/database.ts`
  - `backend/.env.example`

## Matriz funcionalidad -> endpoint -> archivo

| Funcionalidad | Endpoint | Servicio / pagina |
|---------------|----------|-------------------|
| Registro | `POST /auth/register` | `auth.service.ts`, `register/page.tsx` |
| Login | `POST /auth/login` | `auth.service.ts`, `AuthContext.tsx` |
| Importar estudiantes | `POST /auth/students/import` | `auth.service.ts`, `admin/page.tsx` |
| Listar periodos | `GET /periods` | `period.service.ts`, `student/page.tsx`, `admin/page.tsx` |
| Editar periodo | `PATCH /periods/:id` | `period.service.ts`, `admin/page.tsx` |
| Mi expediente | `GET /documents` | `document.service.ts`, `student/page.tsx` |
| Subir archivo | `POST /documents/upload` | `document.service.ts`, `student/page.tsx` |
| Subir URL | `POST /documents/url` | `document.service.ts`, `student/page.tsx` |
| Progreso global | `GET /documents/progress` | `document.service.ts`, `admin/page.tsx` |
| Revisar documento | `PATCH /documents/:id/review` | `document.service.ts`, `admin/page.tsx` |
