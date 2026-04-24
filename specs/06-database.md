# 06 - Database

## Motor y esquema base

- Motor: PostgreSQL 16.
- Inicializacion: `database/init.sql`.
- Extension requerida: `uuid-ossp`.

## Tipos enumerados

- `user_role`: `estudiante`, `encargado`.
- `program_type`: `servicio_social`, `residencias`.
- `doc_status`: `pendiente`, `aprobado`, `rechazado`.

## Tabla `users`

Campos clave:

- `id` UUID PK
- `control_number` UNIQUE
- `name`
- `password_hash`
- `role`
- `carrera`
- `encargado_section`
- `created_at`, `updated_at`

Indices:

- `idx_users_control`
- `idx_users_role`

## Tabla `documents`

Campos clave:

- `id` UUID PK
- `student_id` FK -> `users(id)` con `ON DELETE CASCADE`
- `program_type`
- `category`
- `description`
- `status`
- `file_name`, `file_path`, `file_size`
- `external_url`
- `observations`
- `reviewed_by` FK -> `users(id)`
- `created_at`, `updated_at`

Restriccion critica:

- `uq_student_doc`: evita duplicidad de categoria por estudiante/programa.

Indices:

- `idx_docs_student`
- `idx_docs_status`
- `idx_docs_program`

## Trigger de auditoria temporal

- Funcion `set_updated_at()`.
- Triggers en `users` y `documents` para mantener `updated_at`.

## Relacion con TypeORM

- Entidades reflejadas en:
  - `backend/src/models/UserEntity.ts`
  - `backend/src/models/DocumentEntity.ts`
- `synchronize` activo solo en desarrollo (`ENV.NODE_ENV === 'development'`).
