# 05 - Frontend App

## Enrutamiento

- `/` redirige a `/login`.
- `/login`: autenticacion.
- `/register`: alta de usuarios.
- `/dashboard`: layout protegido (requiere sesion).
  - Vista estudiante: `/dashboard/(student)/student`
  - Vista encargado: `/dashboard/(admin)/admin`

## Manejo de sesion

- `AuthProvider` vive en el layout raiz.
- Persistencia local:
  - `sissep_token`
  - `sissep_user`
- `login()` consume `/auth/login`.
- `logout()` limpia almacenamiento y estado.

## Cliente API

- Base API: `NEXT_PUBLIC_API_URL` o `http://localhost:4000/api/v1`.
- Base storage: `NEXT_PUBLIC_STORAGE_URL` o `http://localhost:4000`.
- `api.get/post/patch` usa JSON y Bearer token.
- `uploadFile()` envia multipart para archivos.

## Vista de estudiante

- Cambia entre `servicio_social` y `residencias`.
- Lista documentos requeridos y estado por categoria.
- Acciones:
  - subir archivo local,
  - registrar enlace externo,
  - consultar observaciones del encargado.
- Muestra progreso por porcentaje de aprobados.

## Vista de encargado

- Lista estudiantes con buscador y progreso agregado.
- Permite abrir expediente de un estudiante.
- Sobre cada documento:
  - ver archivo o URL,
  - aprobar o rechazar,
  - guardar observaciones en modal.

## Componentes UI reutilizados

- `StatusPill`: badge visual por estado documental.
- `Spinner`: indicador de carga.
- `Modal`: dialogos para acciones y detalle.
