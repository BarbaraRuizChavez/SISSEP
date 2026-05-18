# 05 - Frontend App

## Enrutamiento

- `/` redirige a `/login`.
- `/login`: autenticacion.
- `/register`: alta de usuarios (estudiante con programa educativo y periodo de servicio).
- `/dashboard`: layout protegido (requiere sesion).
- `/dashboard` (page): redirige por rol a `/dashboard/student` o `/dashboard/admin`.
- Vista estudiante: `/dashboard/student` — `app/dashboard/(student)/student/page.tsx`
- Vista encargado: `/dashboard/admin` — `app/dashboard/(admin)/admin/page.tsx`

## Manejo de sesion

- `AuthProvider` vive en el layout raiz.
- Persistencia local:
  - `sissep_token`
  - `sissep_user` (incluye `periodo` para estudiantes)
- `login()` consume `/auth/login`.
- `logout()` limpia almacenamiento y estado.

## Cliente API

- Base API: `NEXT_PUBLIC_API_URL` o `http://localhost:4000/api/v1`.
- Base storage: `NEXT_PUBLIC_STORAGE_URL` o `http://localhost:4000`.
- `api.get/post/patch` usa JSON y Bearer token.
- `uploadFile()` envia multipart para documentos.
- `importStudents()` envia multipart a `/auth/students/import`.

## Tipos compartidos (`frontend/types/index.ts`)

- `PERIODOS`: `['ENE-JUN 2026', 'AGO-NOV 2026']` — ciclo escolar en registro de estudiante.
- `DeliveryPeriod`: ventana de entrega configurada por encargado.
- `StudentStatus`: `activo` | `bloqueado`.
- `DocumentRecord` incluye `periodNumber`.

## Vista de estudiante

- Cambia entre `servicio_social` y `residencias`.
- Carga en paralelo documentos (`/documents`) y periodos (`/periods`).
- Muestra documentos agrupados por periodo de entrega con estado del periodo (proximo / abierto / cerrado).
- Calcula y muestra alerta si el expediente esta bloqueado.
- Acciones por documento (solo si periodo abierto y no bloqueado):
  - subir archivo local,
  - registrar enlace externo,
  - consultar observaciones del encargado.
- Barra de progreso por porcentaje de documentos aprobados.

## Vista de encargado

Panel con pestanas (`activeTab`):

### `estudiantes`

- Lista con buscador, progreso y `studentStatus`.
- Abre expediente de un estudiante para revisar/aprobar/rechazar.

### `periodos`

- Lista periodos de entrega del programa seleccionado.
- Edicion inline de `startDate` / `endDate` con `PATCH /periods/:id`.
- Badges: Proximo / Abierto / Cerrado segun fecha actual.

### `alta`

- Registro manual de estudiante (`POST /auth/register`).
- Importacion masiva desde Excel (`importStudents` → `POST /auth/students/import`).
- Muestra resumen: creados, omitidos, errores por fila.

## Componentes UI reutilizados

- `StatusPill`: badge visual por estado documental.
- `Spinner`: indicador de carga.
- `Modal`: dialogos para revision, URL externa y observaciones.
