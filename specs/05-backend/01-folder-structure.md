# 5.1 Estructura de Carpetas del Backend

## Resumen

Este documento define la organización de archivos y carpetas para el backend de SISSEP, siguiendo una arquitectura por capas (Layered Architecture) con Node.js y Express.

## Estructura General

```
backend/
├── src/
│   ├── server.js                 # Punto de entrada
│   ├── app.js                    # Configuración de Express
│   ├── config/                   # Configuraciones
│   │   ├── database.js           # Configuración de BD
│   │   ├── env.js                # Variables de entorno
│   │   └── cors.js               # Configuración CORS
│   ├── routes/                   # Rutas API
│   │   ├── index.js              # Router principal
│   │   ├── auth.routes.js        # Rutas de autenticación
│   │   ├── user.routes.js        # Rutas de usuarios
│   │   └── document.routes.js    # Rutas de documentos
│   ├── controllers/              # Controladores (Request Handlers)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── document.controller.js
│   ├── services/                 # Lógica de negocio
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── document.service.js
│   │   ├── fileStorage.service.js
│   │   └── email.service.js
│   ├── models/                   # Acceso a datos
│   │   ├── index.js              # Export de modelos
│   │   ├── user.model.js
│   │   ├── document.model.js
│   │   ├── category.model.js
│   │   └── observation.model.js
│   ├── middlewares/              # Middlewares Express
│   │   ├── auth.middleware.js    # JWT auth
│   │   ├── error.middleware.js   # Manejo de errores
│   │   ├── upload.middleware.js  # Multer config
│   │   └── validate.middleware.js # Validación de requests
│   ├── utils/                    # Utilidades
│   │   ├── logger.js             # Logging
│   │   ├── responses.js          # Helpers de respuesta
│   │   └── validators.js         # Validaciones
│   └── constants/                # Constantes
│       └── http-status.js        # Códigos HTTP
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                 # Datos de prueba
├── uploads/                      # Archivos subidos (dev)
├── logs/                         # Logs de aplicación
├── scripts/                      # Scripts de utilidad
│   ├── seed.js                   # Datos iniciales
│   └── migrate.js                # Migraciones
├── .env                          # Variables de entorno
├── .env.example                  # Ejemplo de variables
├── .eslintrc.js                  # Config ESLint
├── .prettierrc                   # Config Prettier
├── jest.config.js                # Config Jest
├── package.json
└── README.md
```

## Convenciones de Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos | camelCase | `userController.js` |
| Clases | PascalCase | `UserService` |
| Funciones | camelCase | `getUsers()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Rutas API | kebab-case | `/api/users/me` |
| Variables | camelCase | `userId` |

## Responsabilidades por Capa

### 1. Routes (Routes Layer)

Define los endpoints y sus handlers.

```javascript
// src/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createUserSchema } = require('../validators/user.validator');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/users - Listar (solo encargados/admin)
router.get('/', authorize('encargado', 'admin'), userController.getUsers);

// GET /api/users/:id - Obtener uno
router.get('/:id', userController.getUser);

// POST /api/users - Crear (solo admin)
router.post('/', 
  authorize('admin'), 
  validate(createUserSchema), 
  userController.createUser
);

// PUT /api/users/:id - Actualizar
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Eliminar (solo admin)
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
```

### 2. Controllers (Presentation Layer)

Manejan HTTP requests/responses. **Solo** reciben requests, llaman services, envían responses.

```javascript
// src/controllers/user.controller.js

const userService = require('../services/user.service');
const { success, error } = require('../utils/responses');

class UserController {
  async getUsers(req, res, next) {
    try {
      const { page, perPage, role, search } = req.query;
      
      const result = await userService.getUsers({
        page: parseInt(page) || 1,
        perPage: parseInt(perPage) || 20,
        role,
        search
      });
      
      res.json(success(result.data, { pagination: result.pagination }));
    } catch (err) {
      next(err);
    }
  }

  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json(error('USER_NOT_FOUND', 'Usuario no encontrado'));
      }
      
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(success(user));
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const { hard } = req.query;
      
      await userService.deleteUser(id, hard === 'true');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
```

### 3. Services (Business Logic Layer)

Contienen la lógica de negocio. No saben nada de HTTP.

```javascript
// src/services/user.service.js

const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');

class UserService {
  async getUsers(filters) {
    const { page, perPage, role, search } = filters;
    
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { controlNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      userModel.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' }
      }),
      userModel.count({ where })
    ]);
    
    return {
      data: users.map(this.sanitizeUser),
      pagination: {
        page,
        perPage,
        totalItems: total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }

  async createUser(userData) {
    // Validar controlNumber único
    const existing = await userModel.findByControlNumber(userData.controlNumber);
    if (existing) {
      throw new AppError('DUPLICATE_CONTROL_NUMBER', 'Número de control ya existe', 409);
    }
    
    // Validar email único
    const existingEmail = await userModel.findByEmail(userData.email);
    if (existingEmail) {
      throw new AppError('DUPLICATE_EMAIL', 'Email ya registrado', 409);
    }
    
    // Hash de password
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    // Crear usuario
    const user = await userModel.create({
      ...userData,
      passwordHash
    });
    
    return this.sanitizeUser(user);
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new UserService();
```

### 4. Models (Data Access Layer)

Acceden a la base de datos. Operaciones CRUD puras.

```javascript
// src/models/user.model.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userModel = {
  async findMany(options) {
    return prisma.user.findMany(options);
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByControlNumber(controlNumber) {
    return prisma.user.findUnique({ where: { controlNumber } });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async count(options) {
    return prisma.user.count(options);
  },

  async create(data) {
    return prisma.user.create({ data });
  },

  async update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
};

module.exports = userModel;
```

### 5. Middlewares

```javascript
// src/middlewares/error.middleware.js

const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    requestId: req.id
  });

  // Error operacional (controlado)
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }

  // Error no controlado (bug)
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
};

module.exports = errorMiddleware;
```

## Flujo de Datos

```
HTTP Request
    ↓
Routes
    ↓
Middlewares (auth, validation)
    ↓
Controller (HTTP layer)
    ↓
Service (Business logic)
    ↓
Model (Database access)
    ↓
PostgreSQL
```

## Configuración de la App

```javascript
// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use((req, res, next) => {
  req.id = require('crypto').randomUUID();
  next();
});

// Logging
app.use(require('morgan')('combined', { stream: require('./utils/logger').stream }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' }
  });
});

module.exports = app;
```

```javascript
// src/server.js

require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Conectar a BD
    await connectDatabase();
    logger.info('Database connected');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Scripts npm

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "seed": "node scripts/seed.js",
    "migrate": "node scripts/migrate.js"
  }
}
```

---

**Ver también:**
- [02. Controladores](./02-controllers.md) - Implementación de controllers
- [03. Servicios](./03-services.md) - Lógica de negocio
