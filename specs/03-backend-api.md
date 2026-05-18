# 03 - Backend API

Base URL: `http://localhost:4000/api/v1`

Formato de respuesta estandar: `{ ok: boolean, data?: T, message?: string }`

## Auth

### POST `/auth/register`

- Publico.
- Crea usuario estudiante o encargado.
- Body esperado:
  - `controlNumber`, `name`, `password`, `role`
  - Estudiante: `carrera`, `periodo` (ej. `ENE-JUN 2026`, `AGO-NOV 2026`)
  - Encargado: sin campos academicos obligatorios

### POST `/auth/login`

- Publico.
- Body: `controlNumber`, `password`.
- Respuesta: `token` JWT y objeto `user` (`id`, `name`, `role`, `carrera`, `periodo`).

### GET `/auth/me`

- Requiere `Authorization: Bearer <token>`.
- Retorna payload de usuario autenticado.

### GET `/auth/students`

- Requiere rol `encargado`.
- Lista estudiantes con: `id`, `controlNumber`, `name`, `carrera`, `periodo`, `studentStatus`, `createdAt`.

### POST `/auth/students/import`

- Requiere rol `encargado`.
- Multipart: archivo `file` (`.xlsx`, `.xls`, `.csv`).
- Columnas reconocidas (flexibles):
  - `No. Control` / `no_control` / `controlNumber`
  - `Nombre` / `name`
  - `Programa Educativo` / `carrera`
  - `Periodo` / `periodo`
  - `Contrasena` / `password` (opcional; default = numero de control)
- Respuesta: `{ created, skipped, errors[] }`.

## Periodos de entrega

### GET `/periods?programType=servicio_social|residencias`

- Requiere autenticacion (estudiante o encargado).
- Inicializa periodos por defecto si no existen para el programa.
- Retorna lista ordenada por `periodNumber` con `id`, `label`, `startDate`, `endDate`, `programType`.

### PATCH `/periods/:periodId`

- Requiere rol `encargado`.
- Body: `startDate`, `endDate` (formato `YYYY-MM-DD`).
- Valida que inicio < fin y que no haya traslape con otros periodos del mismo programa.

## Documents (estudiante)

### GET `/documents?programType=servicio_social|residencias`

- Requiere rol `estudiante`.
- Crea catalogo inicial si no existe y retorna expediente propio ordenado por `periodNumber`.
- Actualiza `student_status` del usuario (`activo` / `bloqueado`) segun reglas de bloqueo.

### POST `/documents/upload`

- Requiere rol `estudiante`.
- Multipart: `file`, `category`, `programType`.
- Extensiones permitidas: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`.
- Rechaza si estudiante bloqueado o periodo de entrega cerrado.
- Reinicia estado del documento a `pendiente` y limpia `externalUrl` al subir archivo.

### POST `/documents/url`

- Requiere rol `estudiante`.
- Body: `category`, `programType`, `externalUrl`.
- Valida formato URL `http/https`.
- Mismas restricciones de bloqueo y periodo abierto que upload.
- Al guardar URL, limpia campos de archivo fisico.

## Documents (encargado)

### GET `/documents/progress?programType=...`

- Requiere rol `encargado`.
- Retorna agregados por estudiante: `controlNumber`, `name`, `carrera`, `periodo`, `studentStatus`, `total`, `approved`, `pending`, `rejected`.

### GET `/documents/student/:studentId?programType=...`

- Requiere rol `encargado`.
- Retorna expediente completo del estudiante indicado.

### PATCH `/documents/:docId/review`

- Requiere rol `encargado`.
- Body: `status` (`aprobado`|`rechazado`), `observations`.
- Guarda `reviewedBy` con el usuario autenticado.

## Middleware y errores

- `authenticate`: valida JWT.
- `authorize(...roles)`: aplica RBAC por rol.
- `upload` (documentos): multer en disco con limites por tamano.
- Importacion estudiantes: multer `memoryStorage` en ruta auth.
- `errorHandler`: respuesta 500 de ultimo recurso.

## Health check (fuera de /api/v1)

- `GET /health` — estado del servidor.
