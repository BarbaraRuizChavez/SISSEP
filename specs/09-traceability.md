# 09 - Traceability

## Mapa modulo -> archivos

## Backend API

- Entrada y bootstrap:
  - `backend/src/server.ts`
- Enrutamiento:
  - `backend/src/routes/index.ts`
  - `backend/src/routes/auth.routes.ts`
  - `backend/src/routes/document.routes.ts`
- Controladores:
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/controllers/document.controller.ts`
- Servicios:
  - `backend/src/services/auth.service.ts`
  - `backend/src/services/document.service.ts`

## Seguridad backend

- JWT y autenticacion:
  - `backend/src/utils/jwt.ts`
  - `backend/src/middlewares/auth.middleware.ts`
- Password hashing:
  - `backend/src/utils/hash.ts`
- Manejo de errores:
  - `backend/src/middlewares/error.middleware.ts`
- Carga de archivos:
  - `backend/src/middlewares/upload.middleware.ts`
  - `backend/src/utils/folders.ts`

## Modelo de dominio

- Entidades:
  - `backend/src/models/UserEntity.ts`
  - `backend/src/models/DocumentEntity.ts`
- Tipos:
  - `backend/src/types/index.ts`
- Catalogos:
  - `backend/src/utils/catalog.ts`

## Frontend

- Layout global y estado de auth:
  - `frontend/app/layout.tsx`
  - `frontend/context/AuthContext.tsx`
- Auth:
  - `frontend/app/(auth)/login/page.tsx`
  - `frontend/app/(auth)/register/page.tsx`
- Dashboard:
  - `frontend/app/dashboard/layout.tsx`
  - `frontend/app/dashboard/(student)/student/page.tsx`
  - `frontend/app/dashboard/(admin)/admin/page.tsx`
- Cliente API y tipos:
  - `frontend/lib/api.ts`
  - `frontend/types/index.ts`

## Base de datos e infraestructura

- Esquema SQL:
  - `database/init.sql`
- Orquestacion local:
  - `docker-compose.yml`
- Configuracion backend:
  - `backend/src/config/env.ts`
  - `backend/src/config/database.ts`
  - `backend/.env.example`
