# 5.2 Controladores (Controllers)

## Resumen

Los controladores manejan las peticiones HTTP, delegan la lógica a los servicios y formatean las respuestas. Son la capa de presentación del backend.

## Principios

1. **Reciben** requests HTTP
2. **Extraen** datos del request (params, body, query)
3. **Llaman** a los servicios
4. **Formatean** la respuesta
5. **No** contienen lógica de negocio

## Controlador de Autenticación

```javascript
// src/controllers/auth.controller.js

const authService = require('../services/auth.service');
const { success, error } = require('../utils/responses');
const logger = require('../utils/logger');

class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { controlNumber, password, role } = req.body;
      
      const result = await authService.login(controlNumber, password, role);
      
      logger.info(`User logged in: ${controlNumber}`);
      
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;
      
      await authService.logout(userId, refreshToken);
      
      logger.info(`User logged out: ${userId}`);
      
      res.json(success({ message: 'Sesión cerrada exitosamente' }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);
      
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getUserById(userId);
      
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, currentPassword, newPassword);
      
      res.json(success({ message: 'Contraseña actualizada exitosamente' }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
```

## Controlador de Usuarios

```javascript
// src/controllers/user.controller.js

const userService = require('../services/user.service');
const { success, error } = require('../utils/responses');

class UserController {
  /**
   * GET /api/users
   * Lista usuarios con paginación y filtros
   */
  async getUsers(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        perPage: parseInt(req.query.perPage) || 20,
        role: req.query.role,
        search: req.query.search,
        isActive: req.query.isActive !== undefined 
          ? req.query.isActive === 'true' 
          : undefined
      };
      
      const result = await userService.getUsers(filters);
      
      res.json(success(result.data, { pagination: result.pagination }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/users/:id
   * Obtiene un usuario específico
   */
  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;
      
      // Validar permisos
      if (id !== requesterId && requesterRole === 'estudiante') {
        return res.status(403).json(
          error('FORBIDDEN', 'No puedes ver información de otros usuarios')
        );
      }
      
      const user = await userService.getUserById(id, { includeProgress: true });
      
      if (!user) {
        return res.status(404).json(error('USER_NOT_FOUND', 'Usuario no encontrado'));
      }
      
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users
   * Crea un nuevo usuario (solo admin)
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      
      const user = await userService.createUser(userData);
      
      res.status(201).json(success(user));
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/users/:id
   * Actualiza un usuario
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;
      
      // Estudiantes solo pueden editar ciertos campos de sí mismos
      if (requesterRole === 'estudiante') {
        if (id !== requesterId) {
          return res.status(403).json(error('FORBIDDEN', 'No puedes editar otros usuarios'));
        }
        
        // Filtrar campos permitidos para estudiantes
        const allowedFields = ['name', 'phone'];
        const filteredData = {};
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            filteredData[field] = updateData[field];
          }
        });
        
        const user = await userService.updateUser(id, filteredData);
        return res.json(success(user));
      }
      
      // Encargados y admins pueden editar más campos
      const user = await userService.updateUser(id, updateData);
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/users/:id
   * Elimina o desactiva un usuario
   */
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

  /**
   * POST /api/users/:id/activate
   * Reactiva un usuario desactivado
   */
  async activateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      const user = await userService.activateUser(id, newPassword);
      
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
```

## Controlador de Documentos

```javascript
// src/controllers/document.controller.js

const documentService = require('../services/document.service');
const fileStorageService = require('../services/fileStorage.service');
const { success, error } = require('../utils/responses');

class DocumentController {
  /**
   * GET /api/documents
   * Lista documentos del usuario o de todos (encargado)
   */
  async getDocuments(req, res, next) {
    try {
      const { programType, studentId, status, category } = req.query;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;
      
      // Determinar scope
      let targetStudentId = studentId;
      if (requesterRole === 'estudiante') {
        targetStudentId = requesterId;
      }
      
      const filters = {
        programType,
        studentId: targetStudentId,
        status,
        category
      };
      
      const documents = await documentService.getDocuments(filters);
      
      res.json(success(documents));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/documents/:id
   * Obtiene un documento específico
   */
  async getDocument(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;
      
      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json(error('DOCUMENT_NOT_FOUND', 'Documento no encontrado'));
      }
      
      // Verificar permisos
      if (document.studentId !== requesterId && requesterRole === 'estudiante') {
        return res.status(403).json(error('FORBIDDEN', 'No tienes acceso a este documento'));
      }
      
      res.json(success(document));
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/documents/:id/upload
   * Sube un archivo a un documento
   */
  async uploadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json(error('NO_FILE', 'No se proporcionó archivo'));
      }
      
      const result = await documentService.uploadDocument(id, userId, file);
      
      res.json(success(result));
    } catch (err) {
      // Eliminar archivo temporal si falló
      if (req.file?.path) {
        await fileStorageService.deleteFile(req.file.path).catch(() => {});
      }
      next(err);
    }
  }

  /**
   * PATCH /api/documents/:id/review
   * Revisa un documento (aprobar/rechazar)
   */
  async reviewDocument(req, res, next) {
    try {
      const { id } = req.params;
      const reviewerId = req.user.id;
      const { status, observations } = req.body;
      
      const result = await documentService.reviewDocument(id, reviewerId, {
        status,
        observations
      });
      
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/documents/progress
   * Obtiene progreso de estudiantes (para admin)
   */
  async getProgress(req, res, next) {
    try {
      const { programType } = req.query;
      
      const progress = await documentService.getStudentsProgress(programType);
      
      res.json(success(progress));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/documents/:id/download
   * Descarga el archivo de un documento
   */
  async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const document = await documentService.getDocumentById(id);
      
      if (!document || !document.fileUrl) {
        return res.status(404).json(error('FILE_NOT_FOUND', 'Archivo no encontrado'));
      }
      
      // Verificar permisos
      if (document.studentId !== userId && userRole === 'estudiante') {
        return res.status(403).json(error('FORBIDDEN', 'No tienes acceso a este archivo'));
      }
      
      // Obtener file stream
      const stream = await fileStorageService.getFileStream(document.fileUrl);
      
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/documents/:id/view
   * Visualiza el archivo inline
   */
  async viewDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const document = await documentService.getDocumentById(id);
      
      if (!document || !document.fileUrl) {
        return res.status(404).json(error('FILE_NOT_FOUND', 'Archivo no encontrado'));
      }
      
      if (document.studentId !== userId && userRole === 'estudiante') {
        return res.status(403).json(error('FORBIDDEN', 'No tienes acceso a este archivo'));
      }
      
      const stream = await fileStorageService.getFileStream(document.fileUrl);
      
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', 'inline');
      
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();
```

## Helper de Respuestas

```javascript
// src/utils/responses.js

/**
 * Crea una respuesta exitosa
 */
function success(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: meta.requestId,
      ...meta
    }
  };
}

/**
 * Crea una respuesta de error
 */
function error(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = { success, error };
```

## Testing de Controllers

```javascript
// tests/unit/controllers/auth.controller.test.js

const authController = require('../../../src/controllers/auth.controller');
const authService = require('../../../src/services/auth.service');

jest.mock('../../../src/services/auth.service');

describe('AuthController', () => {
  describe('login', () => {
    it('should return token on successful login', async () => {
      const req = {
        body: {
          controlNumber: '201912345',
          password: 'password',
          role: 'estudiante'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const next = jest.fn();
      
      authService.login.mockResolvedValue({
        token: 'access-token',
        user: { id: '1', name: 'Test' }
      });
      
      await authController.login(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'access-token' })
      }));
    });
  });
});
```

---

**Ver también:**
- [01. Estructura de Carpetas](./01-folder-structure.md) - Organización
- [03. Servicios](./03-services.md) - Lógica de negocio
