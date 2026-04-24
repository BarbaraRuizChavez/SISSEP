# 01 - Project Overview

## Objetivo del sistema

SISSEP (Sistema de Seguimiento de Servicios Escolares y Procesos) administra expedientes documentales de estudiantes para dos programas:

- `servicio_social`
- `residencias`

Permite:

- Registro e inicio de sesion de usuarios.
- Carga de evidencias por estudiantes (archivo o URL externa).
- Revision y dictamen por encargados (aprobado/rechazado).
- Seguimiento de progreso por estudiante.

## Roles

- `estudiante`: carga y consulta sus documentos.
- `encargado`: consulta progreso global y revisa expedientes.

## Modulos principales

- Backend API (`backend/src`): autenticacion, documentos, reglas de negocio.
- Frontend web (`frontend/app`): flujo de login, dashboard de estudiante y dashboard administrativo.
- Base de datos PostgreSQL (`database/init.sql`): usuarios, documentos, tipos y restricciones.
- Infraestructura local (`docker-compose.yml`): servicio postgres.

## Stack tecnologico

- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT, Multer.
- Frontend: Next.js App Router, React, TypeScript.
- Seguridad: `helmet`, CORS restringido, JWT Bearer, hash de password con bcrypt.

## Flujo funcional resumido

1. Usuario se registra (`/api/v1/auth/register`) y luego inicia sesion (`/api/v1/auth/login`).
2. Estudiante entra a dashboard, lista documentos requeridos y sube archivo o URL.
3. Encargado consulta avance general y revisa cada documento.
4. Estudiante visualiza observaciones y reenvia evidencias si procede.
