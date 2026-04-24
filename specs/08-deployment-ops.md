# 08 - Deployment and Ops

## Variables de entorno backend

Definidas en `backend/.env.example`:

- `PORT`, `NODE_ENV`, `FRONTEND_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `UPLOAD_BASE`, `MAX_FILE_MB`

## Ejecucion local recomendada

## 1) Base de datos

- Levantar postgres con `docker-compose up -d`.
- Inicializa esquema desde `database/init.sql`.

## 2) Backend

- En `backend`:
  - `npm install`
  - `npm run dev`
- API disponible en `http://localhost:4000`.

## 3) Frontend

- En `frontend`:
  - `npm install`
  - `npm run dev`
- App disponible en `http://localhost:3000`.

## Scripts relevantes

- Backend:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
- Frontend:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run lint`

## Consideraciones operativas

- Asegurar persistencia de volumen `pgdata`.
- Respaldar base de datos y directorio `uploads`.
- Vigilar crecimiento de `uploads` y politicas de retencion.
- Configurar dominios/URLs correctas para CORS y almacenamiento en despliegues reales.
