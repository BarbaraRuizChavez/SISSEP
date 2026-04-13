# 3.1 Especificación General de la API

## Resumen

Este documento define los estándares, convenciones y estructura general para todas las APIs REST de SISSEP.

## Base URL

```
Desarrollo:  http://localhost:3000/api
Producción:  https://api.sissep.edu.mx/api
Staging:     https://api-staging.sissep.edu.mx/api
```

## Convenciones de Diseño

### Principios REST

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REST PRINCIPLES                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Stateless: Cada request contiene toda la información necesaria
2. Cacheable: Respuestas incluyen headers de cache apropiados
3. Uniform Interface: URL + HTTP Methods consistentes
4. Resource-Based: Los endpoints representan recursos, no acciones
```

### Convenciones de Nomenclatura

| Aspecto | Convención | Ejemplo |
|---------|------------|---------|
| Endpoints | Plural, kebab-case | `/api/users`, `/api/documents` |
| Recursos | Sustantivos, no verbos | `/documents` no `/getDocuments` |
| Acciones | Usar métodos HTTP | `POST /documents` (crear), `GET /documents` (listar) |
| IDs | UUID en path | `/documents/:id` |
| Sub-recursos | Nesting limitado a 1 nivel | `/documents/:id/observations` |
| Query params | camelCase | `?programType=servicio_social` |
| Headers | kebab-case | `Content-Type`, `X-Request-Id` |

### Métodos HTTP

| Método | Uso | Ejemplo |
|--------|-----|---------|
| `GET` | Obtener recurso(s) | `GET /api/documents` |
| `POST` | Crear recurso | `POST /api/documents` |
| `PUT` | Reemplazar recurso completo | `PUT /api/documents/:id` |
| `PATCH` | Actualizar parcialmente | `PATCH /api/documents/:id/status` |
| `DELETE` | Eliminar recurso | `DELETE /api/documents/:id` |

## Estructura de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    // Datos del recurso o lista
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "uuid-de-la-request"
  }
}
```

### Respuesta de Lista (Paginada)

```json
{
  "success": true,
  "data": [
    { /* item 1 */ },
    { /* item 2 */ }
  ],
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "uuid-de-la-request",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": [
      {
        "field": "email",
        "message": "El email debe ser institucional (@ejemplo.edu.mx)"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "uuid-de-la-request"
  }
}
```

## Códigos de Estado HTTP

| Código | Uso | Ejemplo |
|--------|-----|---------|
| `200 OK` | Éxito | GET exitoso |
| `201 Created` | Recurso creado | POST exitoso |
| `204 No Content` | Sin contenido | DELETE exitoso |
| `400 Bad Request` | Datos inválidos | Validación fallida |
| `401 Unauthorized` | No autenticado | Token faltante |
| `403 Forbidden` | Sin permisos | Estudiante intenta ver docs de otro |
| `404 Not Found` | No existe | ID inválido |
| `409 Conflict` | Conflicto de datos | Email duplicado |
| `422 Unprocessable` | Lógica de negocio | Subir archivo a doc aprobado |
| `500 Server Error` | Error interno | Excepción no controlada |

## Headers Requeridos

### Request Headers

| Header | Requerido | Descripción |
|--------|-----------|-------------|
| `Content-Type` | Sí (POST/PUT/PATCH) | `application/json` o `multipart/form-data` |
| `Authorization` | Sí (endpoints protegidos) | `Bearer {jwt_token}` |
| `Accept` | No | `application/json` (default) |
| `X-Client-Version` | No | Versión del frontend |

### Response Headers

| Header | Descripción |
|--------|-------------|
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Request-Id` | UUID para trazabilidad |
| `X-RateLimit-Limit` | Límite de requests |
| `X-RateLimit-Remaining` | Requests restantes |

## Autenticación

### JWT Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Estructura del Token

```json
{
  "sub": "uuid-del-usuario",
  "role": "estudiante|encargado|admin",
  "iat": 1705326622,
  "exp": 1705330222
}
```

### Endpoints Públicos vs Protegidos

```yaml
# Públicos (sin token)
POST /api/auth/login
POST /api/auth/refresh

# Protegidos (requieren token)
GET  /api/users/me
GET  /api/documents
POST /api/documents
# ...
```

## Validación y Sanitización

### Validación de Inputs

```javascript
// Middleware de validación - SPEC
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: error.details.map(d => ({
            field: d.path[0],
            message: d.message
          }))
        }
      });
    }
    
    req.body = value; // Datos sanitizados
    next();
  };
};

module.exports = { validate };
```

### Esquemas de Validación (Joi)

```javascript
// validationSchemas.js - SPEC

const Joi = require('joi');

const loginSchema = Joi.object({
  controlNumber: Joi.string().alphanum().min(5).max(20).required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('estudiante', 'encargado').required()
});

const createUserSchema = Joi.object({
  controlNumber: Joi.string().alphanum().min(5).max(20).required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().pattern(/@ejemplo\.edu\.mx$/).required(),
  role: Joi.string().valid('estudiante', 'encargado', 'admin').required(),
  career: Joi.when('role', {
    is: 'estudiante',
    then: Joi.string().required(),
    otherwise: Joi.optional()
  })
});

const updateDocumentStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'observed').required(),
  observations: Joi.when('status', {
    is: Joi.string().valid('rejected', 'observed'),
    then: Joi.string().min(10).required(),
    otherwise: Joi.optional()
  })
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateDocumentStatusSchema
};
```

## Rate Limiting

```javascript
// rateLimiter.middleware.js - SPEC

const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas peticiones, intenta más tarde'
      }
    });
  }
});

// Estricto para auth (prevención de fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos de login
  skipSuccessfulRequests: true, // No cuenta logins exitosos
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Demasiados intentos de login. Intenta en 1 hora.'
      }
    });
  }
});

module.exports = { apiLimiter, authLimiter };
```

## Manejo de Errores

```javascript
// errorHandler.middleware.js - SPEC

class AppError extends Error {
  constructor(code, message, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores predefinidos
const Errors = {
  UNAUTHORIZED: new AppError('UNAUTHORIZED', 'No autenticado', 401),
  FORBIDDEN: new AppError('FORBIDDEN', 'No tienes permisos', 403),
  NOT_FOUND: new AppError('NOT_FOUND', 'Recurso no encontrado', 404),
  VALIDATION: new AppError('VALIDATION_ERROR', 'Datos inválidos', 400),
  CONFLICT: new AppError('CONFLICT', 'Conflicto de datos', 409),
  SERVER_ERROR: new AppError('SERVER_ERROR', 'Error interno del servidor', 500)
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // Log del error
  console.error({
    timestamp: new Date().toISOString(),
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id
  });
  
  // Respuesta al cliente
  if (err.isOperational) {
    // Errores esperados (controlados)
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  } else {
    // Errores inesperados (bugs)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error interno'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }
};

module.exports = { AppError, Errors, errorHandler };
```

## Documentación de API con OpenAPI/Swagger

```yaml
# openapi.yaml - SPEC

openapi: 3.0.0
info:
  title: SISSEP API
  description: API del Sistema de Servicio Social y Estancias Profesionales
  version: 1.0.0
  contact:
    name: Soporte SISSEP
    email: soporte@sissep.edu.mx

servers:
  - url: http://localhost:3000/api
    description: Desarrollo local
  - url: https://api.sissep.edu.mx/api
    description: Producción

security:
  - bearerAuth: []

paths:
  /auth/login:
    post:
      summary: Iniciar sesión
      security: []  # Público
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        200:
          description: Login exitoso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        401:
          description: Credenciales inválidas

  /documents:
    get:
      summary: Listar documentos del estudiante
      parameters:
        - name: programType
          in: query
          schema:
            type: string
            enum: [servicio_social, residencias]
      responses:
        200:
          description: Lista de documentos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Document'

components:
  schemas:
    LoginRequest:
      type: object
      required: [controlNumber, password, role]
      properties:
        controlNumber:
          type: string
          example: "201912345"
        password:
          type: string
          example: "********"
        role:
          type: string
          enum: [estudiante, encargado]
    
    LoginResponse:
      type: object
      properties:
        token:
          type: string
        user:
          $ref: '#/components/schemas/User'
    
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        controlNumber:
          type: string
        name:
          type: string
        email:
          type: string
        role:
          type: string
          enum: [estudiante, encargado, admin]
        career:
          type: string
    
    Document:
      type: object
      properties:
        id:
          type: string
          format: uuid
        category:
          $ref: '#/components/schemas/Category'
        status:
          type: string
          enum: [draft, pending, under_review, approved, rejected, observed]
        fileUrl:
          type: string
        uploadedAt:
          type: string
          format: date-time
    
    Category:
      type: object
      properties:
        id:
          type: string
        code:
          type: string
        name:
          type: string

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## CORS Configuration

```javascript
// cors.config.js - SPEC

const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',    // Vite dev
  'http://localhost:3000',    // Next.js dev
  'https://sissep.edu.mx',    // Producción
  'https://app.sissep.edu.mx' // Producción alterna
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

module.exports = cors(corsOptions);
```

## Checklist de Implementación

- [ ] Todas las respuestas siguen el formato estándar
- [ ] Headers de seguridad configurados
- [ ] Rate limiting implementado
- [ ] Validación de inputs en todos los endpoints
- [ ] Manejo de errores centralizado
- [ ] CORS configurado correctamente
- [ ] Documentación OpenAPI/Swagger actualizada
- [ ] Tests de endpoints principales

---

**Ver también:**
- [02. Autenticación](./02-auth-endpoints.md) - Endpoints de auth
- [03. Gestión de Usuarios](./03-user-endpoints.md) - CRUD de usuarios
- [04. Gestión de Documentos](./04-document-endpoints.md) - Documentos y upload
