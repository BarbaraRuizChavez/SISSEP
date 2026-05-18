# 01 - Project Overview

## Objetivo del sistema

SISSEP (Sistema de Seguimiento de Servicios Escolares y Procesos) administra expedientes documentales de estudiantes para dos programas:

- `servicio_social`
- `residencias`

Permite:

- Registro e inicio de sesion de usuarios (estudiante y encargado).
- Alta manual o importacion masiva de estudiantes (Excel/CSV) por encargados.
- Carga de evidencias por estudiantes (archivo o URL externa) dentro de periodos de entrega.
- Configuracion de fechas de entrega por periodo (encargado).
- Bloqueo de expediente si hay documentos sin entregar en periodos ya cerrados.
- Revision y dictamen por encargados (aprobado/rechazado).
- Seguimiento de progreso por estudiante.

## Roles

- `estudiante`: carga y consulta sus documentos; su estado puede ser `activo` o `bloqueado`.
- `encargado`: revisa expedientes, administra periodos de entrega y gestiona altas de estudiantes.

## Modulos principales

- Backend API (`backend/src`): autenticacion, documentos, periodos de entrega, reglas de negocio.
- Frontend web (`frontend/app`): login, registro, dashboard de estudiante y panel administrativo con pestanas.
- Base de datos PostgreSQL (`database/init.sql` + entidades TypeORM): usuarios, documentos, periodos de entrega.
- Infraestructura local (`docker-compose.yml`): servicio PostgreSQL en puerto host `5433`.

## Stack tecnologico

- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT, Multer, SheetJS (`xlsx`).
- Frontend: Next.js App Router, React, TypeScript.
- Seguridad: `helmet`, CORS restringido, JWT Bearer, hash de password con bcrypt.

## Flujo funcional resumido

1. Encargado configura periodos de entrega (`GET/PATCH /periods`) o da de alta estudiantes (registro o importacion).
2. Estudiante inicia sesion y accede a su expediente por programa.
3. Solo puede subir documentos cuyo periodo de entrega este abierto (fecha actual entre `startDate` y `endDate`).
4. Si un periodo ya cerro y quedaron documentos sin entregar, el expediente se bloquea (`student_status = bloqueado`).
5. Encargado revisa documentos, aprueba o rechaza con observaciones.
6. Estudiante visualiza observaciones y reenvia evidencias cuando el periodo correspondiente este abierto.
