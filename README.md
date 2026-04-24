# SISSEP

Sistema de Seguimiento de Servicios Escolares y Procesos.

Este proyecto gestiona expedientes documentales para estudiantes en dos programas:

- Servicio Social
- Residencias Profesionales

Permite que estudiantes suban documentos (archivo o URL) y que encargados revisen/aprueben/rechacen evidencias.

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

## 1) Base de datos

Levanta PostgreSQL con Docker:

```bash
docker-compose up -d
```

Esto crea la base e inicializa tablas con `database/init.sql`.

## 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API por defecto: `http://localhost:4000`

Health check: `http://localhost:4000/health`

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

App por defecto: `http://localhost:3000`

## Variables de Entorno (Backend)

Archivo base: `backend/.env.example`

Variables principales:

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `UPLOAD_BASE`
- `MAX_FILE_MB`

## API Principal

Base URL: `http://localhost:4000/api/v1`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/students` (encargado)

Documentos:

- `GET /documents` (estudiante)
- `POST /documents/upload` (estudiante)
- `POST /documents/url` (estudiante)
- `GET /documents/progress` (encargado)
- `GET /documents/student/:studentId` (encargado)
- `PATCH /documents/:docId/review` (encargado)

## Roles del Sistema

- `estudiante`: gestiona su expediente.
- `encargado`: revisa expedientes y monitorea progreso.

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
