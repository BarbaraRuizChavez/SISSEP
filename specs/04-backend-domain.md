# 04 - Backend Domain

## Entidades principales

### `UserEntity` (`users`)

- Identidad: `id`, `control_number`, `name`.
- Seguridad: `password_hash`.
- Rol: `role` (`estudiante`|`encargado`).
- Contexto academico: `carrera`, `periodo` (ciclo escolar del servicio, ej. `ENE-JUN 2026`).
- Estado operativo: `student_status` (`activo`|`bloqueado`) — solo relevante para estudiantes.
- Relacion: uno-a-muchos con `documents`.

### `DocumentEntity` (`documents`)

- Pertenece a estudiante: `student_id`.
- Segmentacion: `program_type`.
- Definicion documental: `category`, `description`, `period_number`.
- Estado: `status` (`pendiente`|`aprobado`|`rechazado`).
- Evidencia: `file_name`, `file_path`, `file_size` o `external_url`.
- Revision: `observations`, `reviewed_by`.
- Restriccion unica: (`student_id`, `program_type`, `category`).

### `DeliveryPeriodEntity` (`delivery_periods`)

- `period_number`, `label`, `start_date`, `end_date`, `program_type`.
- Define ventanas calendario en las que el estudiante puede entregar documentos de ese numero de periodo.
- Se inicializan valores por defecto al primer `GET /periods` por programa.

## Reglas de negocio relevantes

### Registro y usuarios

- No se permite duplicar `controlNumber`.
- Password siempre almacenado hasheado (bcrypt, factor 12).
- Importacion masiva: registra fila a fila; duplicados se cuentan como `skipped`.

### Login

- Mensaje unico para credenciales invalidas.
- Token JWT incluye: `userId`, `role`, `carrera`, `name`.

### Catalogo documental

- Cada item del catalogo tiene `category`, `description`, `periodNumber`.
- Fuente: `backend/src/utils/catalog.ts`.
- `servicio_social`: 18 documentos en 6 periodos de entrega.
- `residencias`: 10 documentos en 3 periodos de entrega.

### Periodos de entrega (`period.service`)

- `getPeriods`: crea periodos por defecto si la tabla esta vacia para el programa.
- `updatePeriod`: encargado puede cambiar fechas sin traslapes.
- `isPeriodOpen(category, programType)`: true si hoy esta entre `startDate` y `endDate` del periodo del documento.
- `isStudentBlocked(studentId, programType)`: true si existe un periodo ya vencido con documentos sin archivo ni URL.

### Documentos (`document.service`)

- Al listar, se inicializa catalogo por programa si no existe (`seedCatalog`).
- Al listar expediente propio, sincroniza `student_status` con resultado de `isStudentBlocked`.
- `submitFile` / `submitUrl`: rechazan si bloqueado o periodo cerrado.
- Al subir archivo reemplaza version previa en disco; estado vuelve a `pendiente`.
- Encargado aprueba/rechaza con observaciones.

## Utilidades de dominio

- `hash.ts`: hash y comparacion de password.
- `jwt.ts`: firmado y verificacion de JWT.
- `catalog.ts`: catalogos por programa con `periodNumber`.
- `folders.ts`: rutas de upload saneadas por programa/carrera/nombre.
- `period.service.ts`: logica de ventanas, traslapes y bloqueo.
