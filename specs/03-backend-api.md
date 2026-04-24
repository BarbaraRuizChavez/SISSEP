# 03 - Backend API

Base URL: `http://localhost:4000/api/v1`

## Auth

### POST `/auth/register`

- Publico.
- Crea usuario estudiante o encargado.
- Body esperado:
  - `controlNumber`, `name`, `password`, `role`
  - Opcionales: `carrera`, `encargadoSection`

### POST `/auth/login`

- Publico.
- Body: `controlNumber`, `password`.
- Respuesta: `token` JWT y objeto `user`.

### GET `/auth/me`

- Requiere `Authorization: Bearer <token>`.
- Retorna payload de usuario autenticado.

### GET `/auth/students`

- Requiere rol `encargado`.
- Lista estudiantes (campos acotados).

## Documents (estudiante)

### GET `/documents?programType=servicio_social|residencias`

- Requiere rol `estudiante`.
- Crea catalogo inicial si no existe y retorna expediente propio.

### POST `/documents/upload`

- Requiere rol `estudiante`.
- Multipart: `file`, `category`, `programType`.
- Extensiones permitidas: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`.
- Reinicia estado del documento a `pendiente`.

### POST `/documents/url`

- Requiere rol `estudiante`.
- Body: `category`, `programType`, `externalUrl`.
- Valida formato URL `http/https`.

## Documents (encargado)

### GET `/documents/progress?programType=...`

- Requiere rol `encargado`.
- Retorna agregados por estudiante: total, approved, pending, rejected.

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
- `upload`: multer para disco con limites por tamano.
- `errorHandler`: respuesta 500 de ultimo recurso.
