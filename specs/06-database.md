# 06 - Database

## Motor y esquema base

- Motor: PostgreSQL 16.
- Referencia SQL: `database/init.sql`.
- En desarrollo, TypeORM `synchronize: true` puede crear/alterar tablas segun entidades (`backend/src/config/database.ts`).
- Extension requerida: `uuid-ossp`.

> **Nota:** Si el contenedor Docker ya fue inicializado con un esquema antiguo, puede ser necesario recrear el volumen `pgdata` o aplicar migraciones manuales para alinear columnas nuevas.

## Tipos enumerados (init.sql)

- `user_role`: `estudiante`, `encargado`.
- `program_type`: `servicio_social`, `residencias`.
- `doc_status`: `pendiente`, `aprobado`, `rechazado`.

## Tabla `users`

Campos clave (segun entidad TypeORM):

- `id` UUID PK
- `control_number` UNIQUE
- `name`
- `password_hash`
- `role`
- `carrera`
- `periodo` — ciclo escolar del estudiante
- `student_status` — `activo` o `bloqueado` (default `activo`)
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
- `period_number` — numero de periodo de entrega al que pertenece
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

## Tabla `delivery_periods`

Campos clave:

- `id` UUID PK
- `period_number` INT
- `label` VARCHAR(100)
- `start_date` DATE
- `end_date` DATE
- `program_type` VARCHAR(30)
- `created_at`, `updated_at`

Periodos por defecto (servicio social: 6; residencias: 3) se insertan via `period.service` al primer acceso.

## Trigger de auditoria temporal

- Funcion `set_updated_at()`.
- Triggers en `users` y `documents` para mantener `updated_at`.

## Relacion con TypeORM

Entidades registradas en `AppDataSource`:

- `backend/src/models/UserEntity.ts`
- `backend/src/models/DocumentEntity.ts`
- `backend/src/models/DeliveryPeriodEntity.ts`

`synchronize` activo solo en desarrollo (`ENV.NODE_ENV === 'development'`).
