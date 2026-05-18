# 07 - Security and Auth

## Controles implementados

- `helmet` para hardening de headers HTTP.
- CORS restringido a `ENV.FRONTEND_URL`.
- JWT Bearer obligatorio en rutas protegidas.
- Hash de passwords con `bcrypt` (cost factor 12).
- RBAC por roles con middleware `authorize`.
- Validacion de ventanas de entrega antes de aceptar uploads (regla de negocio, no solo UI).
- Bloqueo de expediente por incumplimiento en periodos vencidos.

## Flujo de autenticacion

1. Usuario envia credenciales a `/auth/login`.
2. Backend valida usuario y password.
3. Si es correcto, firma JWT con expiracion configurable (`JWT_EXPIRES_IN`, default `8h`).
4. Frontend guarda token y datos de usuario en `localStorage`.
5. Requests subsecuentes agregan `Authorization: Bearer`.

## Flujo de autorizacion

- `authenticate` valida token y popula `req.user`.
- `authorize('estudiante')` protege operaciones del expediente propio.
- `authorize('encargado')` protege revision, reportes, periodos e importacion de estudiantes.

## Reglas de acceso a documentos

Un estudiante solo puede enviar evidencia si:

1. `student_status` no esta efectivamente bloqueado (`isStudentBlocked` = false), y
2. La fecha actual cae dentro del periodo de entrega del documento (`isPeriodOpen` = true).

El backend rechaza la operacion con mensaje explicito si falla alguna condicion.

## Seguridad de carga de archivos

- Tipos permitidos por extension en documentos.
- Limite de tamano configurable (`MAX_FILE_MB`, default 20).
- Guardado en directorios saneados (`utils/folders.ts`).
- Ruta expuesta via `/uploads` con policy `cross-origin`.
- Importacion de estudiantes: archivo en memoria (`multer.memoryStorage`), procesado con `xlsx` sin persistir el archivo fuente.

## Riesgos actuales y mejoras recomendadas

- Token en `localStorage`: susceptible a XSS si existiera vulnerabilidad en frontend.
- No hay refresh token ni revocacion activa.
- Validaciones de entrada son manuales; conviene esquema central (ej. zod/joi).
- `init.sql` puede quedar desfasado respecto a entidades si no se recrea el volumen Docker.
- Para produccion:
  - `JWT_SECRET` robusto y rotado.
  - `synchronize=false` y migraciones formales.
  - Validar y sanitizar archivos Excel en importacion (tamano, filas maximas).
