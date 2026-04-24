# 04 - Backend Domain

## Entidades principales

## `UserEntity` (`users`)

- Identidad: `id`, `control_number`, `name`.
- Seguridad: `password_hash`.
- Rol: `role` (`estudiante`|`encargado`).
- Contexto academico: `carrera`, `encargado_section`.
- Relacion: uno-a-muchos con `documents`.

## `DocumentEntity` (`documents`)

- Pertenece a estudiante: `student_id`.
- Segmentacion: `program_type`.
- Definicion documental: `category`, `description`.
- Estado: `status` (`pendiente`|`aprobado`|`rechazado`).
- Evidencia: `file_name`, `file_path`, `file_size` o `external_url`.
- Revision: `observations`, `reviewed_by`.
- Restriccion unica: (`student_id`, `program_type`, `category`).

## Reglas de negocio relevantes

- Registro:
  - No se permite duplicar `controlNumber`.
  - Password siempre almacenado hasheado.
- Login:
  - Mensaje unico para credenciales invalidas.
  - Token firmado con `userId`, `role`, `carrera`, `name`.
- Documentos:
  - Al listar, se inicializa catalogo por programa si no existe.
  - Al subir archivo se reemplaza version previa y estado vuelve a `pendiente`.
  - Encargado puede aprobar/rechazar y agregar observaciones.

## Catalogos por programa

- `servicio_social`: 18 categorias base.
- `residencias`: 10 categorias base.
- Fuente: `backend/src/utils/catalog.ts`.

## Utilidades de dominio

- `hash.ts`: hash y comparacion de password con bcrypt.
- `jwt.ts`: firmado y verificacion de JWT.
- `folders.ts`:
  - sanea nombres de carpetas,
  - crea ruta por estudiante/programa/carrera,
  - convierte rutas absolutas a relativas.
