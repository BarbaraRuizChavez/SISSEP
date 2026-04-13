# 6.3 Seguridad

## Resumen

Este documento especifica las medidas de seguridad implementadas en SISSEP para proteger datos, autenticación y comunicaciones.

## Amenazas y Contramedidas

| Amenaza | Probabilidad | Impacto | Contramedida |
|---------|--------------|---------|--------------|
| **Robo de credenciales** | Alta | Alto | JWT con expiración, bcrypt, HTTPS |
| **Fuerza bruta** | Media | Alto | Rate limiting, captcha, bloqueo temporal |
| **XSS** | Media | Alto | Sanitización de input, CSP headers |
| **CSRF** | Baja | Alto | Tokens CSRF, SameSite cookies |
| **SQL Injection** | Baja | Crítico | Queries parametrizadas, ORM |
| **Exposición de datos** | Media | Alto | Autorización por roles, RLS en BD |
| **Upload de malware** | Media | Alto | Validación de archivos, magic bytes |
| **Man-in-the-Middle** | Media | Alto | TLS 1.3, certificados válidos |

## Autenticación y Autorización

### JWT (JSON Web Tokens)

```javascript
// Token structure
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID
    "role": "estudiante",
    "iat": 1705326622,  // Issued at
    "exp": 1705330222   // Expires in 1 hour
  },
  "signature": "..."
}
```

### Implementación

```javascript
// middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Token requerido' }
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar usuario existe y está activo
    const user = await userModel.findById(decoded.sub);
    if (!user?.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token inválido' }
      });
    }
    
    req.user = {
      id: user.id,
      controlNumber: user.controlNumber,
      role: user.role
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

// Autorización por roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Acceso denegado' }
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

### Contraseñas

```javascript
// services/auth.service.js
const bcrypt = require('bcrypt');

// Hash de contraseña (12 rounds = ~250ms)
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// Verificación
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Requisitos de contraseña
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers;
};
```

## Rate Limiting

```javascript
// middlewares/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Login: Máximo 10 intentos por hora
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body.controlNumber || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Demasiados intentos. Intenta en 1 hora.'
      }
    });
  }
});

// API general: 100 requests por 15 minutos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

// Upload de archivos: 20 por hora
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20
});

module.exports = { loginLimiter, apiLimiter, uploadLimiter };
```

## Validación de Inputs

```javascript
// middlewares/validate.middleware.js

const Joi = require('joi');

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
          message: 'Datos inválidos',
          details: error.details.map(d => ({
            field: d.path[0],
            message: d.message
          }))
        }
      });
    }
    
    req.body = value; // Sanitizado
    next();
  };
};

// Schemas de validación
const schemas = {
  login: Joi.object({
    controlNumber: Joi.string().alphanum().min(5).max(20).required(),
    password: Joi.string().min(8).max(100).required(),
    role: Joi.string().valid('estudiante', 'encargado').required()
  }),
  
  createUser: Joi.object({
    controlNumber: Joi.string().alphanum().min(5).max(20).required(),
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).required(),
    email: Joi.string().email().pattern(/@ejemplo\.edu\.mx$/).required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('estudiante', 'encargado', 'admin').required(),
    career: Joi.when('role', {
      is: 'estudiante',
      then: Joi.string().required(),
      otherwise: Joi.optional()
    })
  })
};

module.exports = { validate, schemas };
```

## Protección contra SQL Injection

```javascript
// ✅ CORRECTO - Queries parametrizadas
const getUserById = async (id) => {
  return db.query('SELECT * FROM users WHERE id = $1', [id]);
};

// ❌ INCORRECTO - Concatenación de strings
const getUserByIdBad = async (id) => {
  return db.query(`SELECT * FROM users WHERE id = '${id}'`);
};

// ✅ CORRECTO - Usando ORM
const user = await prisma.user.findUnique({
  where: { id }
});
```

## Protección XSS

```javascript
// Sanitización de output
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Headers de seguridad
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind necesita inline
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.API_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Protección CSRF

```javascript
// Para formularios tradicionales (no aplica a SPA con JWT)
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// En cookies
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,      // Solo HTTPS
    httpOnly: true,    // No accesible por JS
    sameSite: 'strict'  // Protección CSRF
  }
}));
```

## Validación de Archivos

```javascript
// services/fileStorage.service.js

const validateFile = async (buffer, mimetype, filename) => {
  // 1. Validar extensión
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Extensión no permitida' };
  }
  
  // 2. Validar MIME type
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedMimes.includes(mimetype)) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }
  
  // 3. Validar magic bytes (firma del archivo)
  const magicBytes = buffer.slice(0, 4).toString('hex');
  const signatures = {
    '25504446': 'application/pdf',  // %PDF
    'ffd8ffe0': 'image/jpeg',
    'ffd8ffe1': 'image/jpeg',
    '89504e47': 'image/png'
  };
  
  if (signatures[magicBytes] !== mimetype) {
    return { valid: false, error: 'El archivo no coincide con su extensión' };
  }
  
  // 4. Validar tamaño (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { valid: false, error: 'Archivo demasiado grande (máx 10MB)' };
  }
  
  return { valid: true };
};
```

## Row Level Security (PostgreSQL)

```sql
-- Activar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Política: Estudiantes solo ven sus documentos
CREATE POLICY student_documents_isolation ON documents
  FOR ALL
  USING (student_id = current_setting('app.current_user_id')::UUID);

-- Política: Encargados ven todos los documentos
CREATE POLICY admin_documents_access ON documents
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = current_setting('app.current_user_id')::UUID 
    AND role IN ('encargado', 'admin')
  ));

-- Aplicar en la aplicación
await db.query(`SET app.current_user_id = '${userId}'`);
```

## Headers de Seguridad

```javascript
// app.js

// CORS seguro
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers adicionales
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## Logging de Seguridad

```javascript
// utils/security-logger.js

const securityLogger = {
  logFailedLogin: (controlNumber, ip, reason) => {
    logger.warn({
      event: 'FAILED_LOGIN',
      controlNumber,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (userId, activity, details) => {
    logger.warn({
      event: 'SUSPICIOUS_ACTIVITY',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logDataAccess: (userId, resource, action) => {
    logger.info({
      event: 'DATA_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString()
    });
  }
};

// Uso
if (!isValid) {
  securityLogger.logFailedLogin(controlNumber, req.ip, 'INVALID_PASSWORD');
}
```

## Checklist de Seguridad

### Pre-deployment

- [ ] JWT_SECRET es fuerte (≥ 32 caracteres aleatorios)
- [ ] JWT_REFRESH_SECRET diferente a JWT_SECRET
- [ ] HTTPS obligatorio en producción
- [ ] Rate limiting configurado
- [ ] Headers de seguridad (Helmet) activados
- [ ] CORS restrictivo (no `*`)
- [ ] Validación de inputs en todos los endpoints
- [ ] Sanitización de output
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS protection (CSP headers)
- [ ] File upload validation (magic bytes)
- [ ] Contraseñas hasheadas con bcrypt (≥12 rounds)
- [ ] Tokens con expiración
- [ ] Logs de seguridad configurados
- [ ] Dependencias auditadas (`npm audit`)

---

**Ver también:**
- [01. Matriz de Calidad](./01-quality-matrix.md) - Atributos de calidad
- [02. Escalabilidad](./02-scalability.md) - Escalado seguro
