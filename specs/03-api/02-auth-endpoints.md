# 3.2 Endpoints de Autenticación

## Resumen

Especificación de los endpoints para autenticación, autorización y gestión de sesiones en SISSEP.

## Endpoints

### 1. POST /auth/login

Inicia sesión en el sistema.

#### Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "controlNumber": "201912345",
  "password": "miPasswordSeguro123",
  "role": "estudiante"
}
```

#### Validaciones

| Campo | Reglas |
|-------|--------|
| controlNumber | Requerido, alfanumérico, 5-20 caracteres |
| password | Requerido, mínimo 8 caracteres |
| role | Requerido, enum: `"estudiante"`, `"encargado"` |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "controlNumber": "201912345",
      "name": "Juan Pérez García",
      "email": "201912345@ejemplo.edu.mx",
      "role": "estudiante",
      "career": "Ingeniería en Sistemas"
    },
    "expiresIn": 3600
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

#### Response Error (401)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Número de control o contraseña incorrectos"
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

#### Response Error (403) - Role mismatch

```json
{
  "success": false,
  "error": {
    "code": "ROLE_MISMATCH",
    "message": "El usuario no tiene el rol seleccionado"
  }
}
```

#### Lógica de Negocio

```javascript
// auth.service.js - SPEC

async login(controlNumber, password, requestedRole) {
  // 1. Buscar usuario por controlNumber
  const user = await userRepository.findByControlNumber(controlNumber);
  
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
  }
  
  // 2. Verificar que la cuenta esté activa
  if (!user.isActive) {
    throw new AppError('ACCOUNT_INACTIVE', 'Cuenta desactivada', 403);
  }
  
  // 3. Verificar password con bcrypt
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    // Log de intento fallido (para prevención de fuerza bruta)
    await logFailedAttempt(controlNumber, ip);
    throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
  }
  
  // 4. Verificar que el rol solicitado coincida
  if (user.role !== requestedRole && user.role !== 'admin') {
    throw new AppError('ROLE_MISMATCH', 'El usuario no tiene el rol seleccionado', 403);
  }
  
  // 5. Generar tokens
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  // 6. Guardar refresh token (para revocación)
  await refreshTokenRepository.create(user.id, refreshToken, ip);
  
  // 7. Limpiar intentos fallidos
  await clearFailedAttempts(controlNumber);
  
  return {
    token,
    refreshToken,
    user: sanitizeUser(user),
    expiresIn: 3600
  };
}
```

---

### 2. POST /auth/logout

Cierra la sesión actual.

#### Request

```http
POST /api/auth/logout
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "message": "Sesión cerrada exitosamente"
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440003"
  }
}
```

#### Lógica

```javascript
async logout(userId, refreshToken) {
  // Revocar refresh token
  await refreshTokenRepository.revoke(refreshToken);
  
  // Opcional: Invalidar access token (requiere blacklist)
  await tokenBlacklist.add(token, exp);
  
  return { message: 'Sesión cerrada exitosamente' };
}
```

---

### 3. POST /auth/refresh

Obtiene un nuevo access token usando el refresh token.

#### Request

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440004"
  }
}
```

#### Response Error (401) - Refresh token inválido

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token inválido o expirado"
  }
}
```

#### Lógica

```javascript
async refreshToken(oldRefreshToken) {
  // 1. Verificar que el refresh token existe y es válido
  const stored = await refreshTokenRepository.findByToken(oldRefreshToken);
  
  if (!stored || stored.revokedAt) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Token inválido', 401);
  }
  
  // 2. Verificar firma JWT
  const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  
  // 3. Obtener usuario
  const user = await userRepository.findById(decoded.sub);
  
  if (!user || !user.isActive) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Token inválido', 401);
  }
  
  // 4. Revocar token anterior
  await refreshTokenRepository.revoke(oldRefreshToken);
  
  // 5. Generar nuevos tokens
  const newToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const newRefreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  // 6. Guardar nuevo refresh token
  await refreshTokenRepository.create(user.id, newRefreshToken, ip);
  
  return { token: newToken, refreshToken: newRefreshToken, expiresIn: 3600 };
}
```

---

### 4. GET /auth/me

Obtiene información del usuario autenticado.

#### Request

```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "controlNumber": "201912345",
    "name": "Juan Pérez García",
    "email": "201912345@ejemplo.edu.mx",
    "role": "estudiante",
    "career": "Ingeniería en Sistemas",
    "phone": "4491234567",
    "isActive": true,
    "createdAt": "2023-08-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440005"
  }
}
```

---

### 5. POST /auth/change-password

Cambia la contraseña del usuario autenticado.

#### Request

```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "currentPassword": "miPasswordActual123",
  "newPassword": "miPasswordNuevo456",
  "confirmPassword": "miPasswordNuevo456"
}
```

#### Validaciones

| Campo | Reglas |
|-------|--------|
| currentPassword | Requerido |
| newPassword | Requerido, mínimo 8 caracteres, al menos 1 mayúscula, 1 número |
| confirmPassword | Debe coincidir con newPassword |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "message": "Contraseña actualizada exitosamente"
  }
}
```

#### Response Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": [
      {
        "field": "newPassword",
        "message": "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
      }
    ]
  }
}
```

#### Lógica

```javascript
async changePassword(userId, currentPassword, newPassword) {
  // 1. Obtener usuario con password hash
  const user = await userRepository.findByIdWithPassword(userId);
  
  // 2. Verificar password actual
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('INVALID_CURRENT_PASSWORD', 'Contraseña actual incorrecta', 400);
  }
  
  // 3. Validar nueva contraseña
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new AppError('WEAK_PASSWORD', 'Contraseña no cumple requisitos', 400);
  }
  
  // 4. Hash y guardar nueva contraseña
  const newHash = await bcrypt.hash(newPassword, 12);
  await userRepository.updatePassword(userId, newHash);
  
  // 5. Revocar todos los tokens de sesión
  await refreshTokenRepository.revokeAllForUser(userId);
  
  return { message: 'Contraseña actualizada exitosamente' };
}
```

---

## Middleware de Autenticación

```javascript
// auth.middleware.js - SPEC

const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Token de autenticación requerido' }
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar en blacklist (si existe)
    const isBlacklisted = await tokenBlacklist.exists(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_REVOKED', message: 'Token revocado' }
      });
    }
    
    // Obtener usuario
    const user = await userRepository.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado o inactivo' }
      });
    }
    
    // Agregar usuario al request
    req.user = {
      id: user.id,
      controlNumber: user.controlNumber,
      role: user.role,
      email: user.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token expirado' }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido' }
    });
  }
};

// Middleware de autorización por rol
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tienes permisos para esta acción' }
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

## Uso de Middleware en Rutas

```javascript
// routes.js - SPEC

const { authenticate, authorize } = require('./middlewares/auth.middleware');

// Públicos
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', authController.refreshToken);

// Protegidos
router.use(authenticate); // Aplica a todas las rutas siguientes

router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/change-password', authController.changePassword);

// Solo encargados/admins
router.get('/users', authorize('encargado', 'admin'), userController.getAll);
router.patch('/documents/:id/review', authorize('encargado', 'admin'), documentController.review);

// Solo admins
router.post('/users', authorize('admin'), userController.create);
router.delete('/users/:id', authorize('admin'), userController.delete);
```

## Esquema de Base de Datos para Tokens

```sql
-- Tabla para refresh tokens (revocación)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash del token, no el token completo
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by_token UUID -- Referencia a la sesión que lo reemplazó
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

---

**Ver también:**
- [01. Especificación General](./01-api-spec.md) - Estándares de API
- [05-backend/02-controllers.md](../05-backend/02-controllers.md) - Implementación
