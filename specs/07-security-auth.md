# 07 - Security and Auth

## Controles implementados

- `helmet` para hardening de headers HTTP.
- CORS restringido a `ENV.FRONTEND_URL`.
- JWT Bearer obligatorio en rutas protegidas.
- Hash de passwords con `bcrypt` (cost factor 12).
- RBAC por roles con middleware `authorize`.

## Flujo de autenticacion

1. Usuario envia credenciales a `/auth/login`.
2. Backend valida usuario y password.
3. Si es correcto, firma JWT con expiracion configurable.
4. Frontend guarda token y datos de usuario en `localStorage`.
5. Requests subsecuentes agregan `Authorization: Bearer`.

## Flujo de autorizacion

- `authenticate` valida token y popular `req.user`.
- `authorize('estudiante')` protege operaciones propias del expediente.
- `authorize('encargado')` protege operaciones de revision y reportes.

## Seguridad de carga de archivos

- Tipos permitidos por extension.
- Limite de tamano configurable (`MAX_FILE_MB`).
- Guardado en directorios saneados para evitar nombres peligrosos.
- Ruta expuesta via `/uploads` con policy `cross-origin`.

## Riesgos actuales y mejoras recomendadas

- Token en `localStorage`: susceptible a XSS si existiera vulnerabilidad en frontend.
- No hay refresh token ni revocacion activa.
- Validaciones de entrada son manuales; conviene esquema central (ej. zod/joi).
- Para produccion:
  - `JWT_SECRET` robusto y rotado.
  - `synchronize=false` y migraciones formales.
