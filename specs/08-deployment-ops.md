# 08 - Deployment and Ops

## Variables de entorno backend

Definidas en `backend/.env.example`:

- `PORT`, `NODE_ENV`, `FRONTEND_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `UPLOAD_BASE`, `MAX_FILE_MB`

Variables opcionales frontend (`.env.local`):

- `NEXT_PUBLIC_API_URL` — default `http://localhost:4000/api/v1`
- `NEXT_PUBLIC_STORAGE_URL` — default `http://localhost:4000`

## Ejecucion local recomendada

### 1) Base de datos

```bash
docker-compose up -d
```

- Contenedor: `sissep_postgres`
- Puerto host: **5433** (mapeo `5433:5432`)
- Volumen: `pgdata`
- Script inicial: `database/init.sql`

En `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=sissep_user
DB_PASS=sissep_pass
DB_NAME=sissep_db
```

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
# Ajustar DB_PORT=5433 si usas Docker
npm run dev
```

API: `http://localhost:4000`  
Health: `http://localhost:4000/health`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

## Dependencias destacadas

- Backend: `xlsx` para importacion masiva de estudiantes.
- Backend: `typeorm`, `pg`, `multer`, `jsonwebtoken`, `bcryptjs`.

## Scripts relevantes

Backend:

- `npm run dev` — desarrollo con `ts-node-dev`
- `npm run build` — compila TypeScript
- `npm run start` — ejecuta `dist/server.js`

Frontend:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Consideraciones operativas

- Asegurar persistencia de volumen `pgdata`.
- Respaldar base de datos y directorio `uploads`.
- Vigilar crecimiento de `uploads` y politicas de retencion.
- Tras cambios de esquema en entidades, evaluar recrear volumen Docker o ejecutar migraciones.
- Configurar dominios/URLs correctas para CORS y almacenamiento en despliegues reales.
- Los periodos de entrega por defecto usan fechas 2026; el encargado debe validarlas al inicio de cada ciclo.
