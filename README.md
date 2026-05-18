# SISSEP

Sistema de Seguimiento de Servicios Escolares y Procesos.

Este proyecto gestiona expedientes documentales para estudiantes en dos programas:

- Servicio Social
- Residencias Profesionales

Permite que estudiantes suban documentos (archivo o URL) dentro de ventanas de entrega por periodo, y que encargados revisen/aprueben/rechacen evidencias, configuren fechas de entrega e importen alumnos de forma masiva.

## Arquitectura General

- `frontend`: aplicacion web (Next.js + React + TypeScript)
- `backend`: API REST (Node.js + Express + TypeScript + TypeORM)
- `database`: esquema SQL inicial para PostgreSQL
- `specs`: documentacion tecnica detallada del sistema

## Requisitos

- Node.js 20+
- npm 10+
- Docker (opcional, recomendado para PostgreSQL)
- PostgreSQL 16 (si no se usa Docker)

## Estructura del Proyecto

```text
sissep/
  backend/
  frontend/
  database/
  specs/
  docker-compose.yml
```

## Configuracion Rapida

### 1) Base de datos

Levanta PostgreSQL con Docker:

```bash
docker-compose up -d
```

El contenedor expone PostgreSQL en el puerto **5433** del host (mapeo `5433:5432`).

En `backend/.env` usa:

```env
DB_PORT=5433
```

En desarrollo, TypeORM puede sincronizar el esquema automaticamente (`synchronize: true`). El archivo `database/init.sql` sirve como referencia y para la primera inicializacion del contenedor.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
# Ajusta DB_PORT=5433 si usas Docker
npm run dev
```

API por defecto: `http://localhost:4000`

Health check: `http://localhost:4000/health`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

App por defecto: `http://localhost:3000`

## Variables de Entorno (Backend)

Archivo base: `backend/.env.example`

Variables principales:

- `PORT`, `NODE_ENV`, `FRONTEND_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `UPLOAD_BASE`, `MAX_FILE_MB`

## API Principal

Base URL: `http://localhost:4000/api/v1`

### Auth

- `POST /auth/register` — registro (estudiante con `carrera` y `periodo`, o encargado)
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/students` (encargado)
- `POST /auth/students/import` (encargado) — importacion masiva desde Excel/CSV

### Periodos de entrega

- `GET /periods?programType=servicio_social|residencias` — lista periodos (autenticado)
- `PATCH /periods/:periodId` (encargado) — actualiza `startDate` y `endDate`

### Documentos

- `GET /documents` (estudiante) — expediente propio; actualiza `student_status` si aplica bloqueo
- `POST /documents/upload` (estudiante) — solo si el periodo del documento esta abierto y el estudiante no esta bloqueado
- `POST /documents/url` (estudiante)
- `GET /documents/progress` (encargado)
- `GET /documents/student/:studentId` (encargado)
- `PATCH /documents/:docId/review` (encargado)

## Roles del Sistema

- `estudiante`: gestiona su expediente dentro de las ventanas de entrega; puede quedar `bloqueado` si deja documentos sin entregar en un periodo vencido.
- `encargado`: revisa expedientes, configura periodos de entrega, da de alta estudiantes manualmente o por importacion Excel.

## Funcionalidades destacadas

- Catalogo de documentos por programa, agrupado por numero de periodo de entrega.
- Ventanas de entrega configurables por encargado (sin traslape de fechas).
- Bloqueo automatico del expediente por entregas faltantes en periodos cerrados.
- Importacion masiva de estudiantes (columnas: No. Control, Nombre, Programa Educativo, Periodo, Contrasena opcional).

## Documentacion Detallada

Revisa `specs/README.md` para la documentacion completa:

- arquitectura
- dominio backend
- contratos API
- frontend
- base de datos
- seguridad
- despliegue
- trazabilidad
