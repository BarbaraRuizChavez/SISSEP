# 5.3 Servicios (Business Logic)

## Resumen

Los servicios contienen la lógica de negocio del sistema. Son independientes de HTTP y de la base de datos. Orquestan las operaciones entre modelos y aplican reglas de negocio.

## Principios

1. **No** conocen nada de HTTP (requests/responses)
2. **No** implementan endpoints directamente
3. **Sí** aplican reglas de negocio
4. **Sí** orquestan operaciones entre múltiples modelos
5. **Sí** manejan transacciones de BD

## Servicio de Autenticación

```javascript
// src/services/auth.service.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const refreshTokenModel = require('../models/refreshToken.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

class AuthService {
  /**
   * Autenticar usuario
   */
  async login(controlNumber, password, requestedRole) {
    // 1. Buscar usuario
    const user = await userModel.findByControlNumber(controlNumber);
    
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales incorrectas', 401);
    }
    
    // 2. Verificar cuenta activa
    if (!user.isActive) {
      throw new AppError('ACCOUNT_INACTIVE', 'Cuenta desactivada', 403);
    }
    
    // 3. Verificar contraseña
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      // Log intento fallido
      await this.logFailedAttempt(controlNumber);
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales incorrectas', 401);
    }
    
    // 4. Verificar rol
    if (user.role !== requestedRole && user.role !== 'admin') {
      throw new AppError('ROLE_MISMATCH', 'El usuario no tiene el rol seleccionado', 403);
    }
    
    // 5. Generar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // 6. Guardar refresh token
    await refreshTokenModel.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    });
    
    // 7. Actualizar último login
    await userModel.update(user.id, { lastLogin: new Date() });
    
    logger.info(`Login successful: ${controlNumber}`);
    
    return {
      token: accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
      expiresIn: 3600 // 1 hora
    };
  }
  
  /**
   * Cerrar sesión
   */
  async logout(userId, refreshToken) {
    await refreshTokenModel.revoke(refreshToken);
    logger.info(`Logout: ${userId}`);
  }
  
  /**
   * Refrescar token
   */
  async refreshToken(oldRefreshToken) {
    // 1. Verificar token existe
    const stored = await refreshTokenModel.findByToken(oldRefreshToken);
    
    if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Token inválido', 401);
    }
    
    // 2. Verificar firma JWT
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    
    // 3. Verificar usuario
    const user = await userModel.findById(decoded.sub);
    
    if (!user || !user.isActive) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Token inválido', 401);
    }
    
    // 4. Revocar token anterior
    await refreshTokenModel.revoke(oldRefreshToken);
    
    // 5. Generar nuevos tokens
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    
    // 6. Guardar nuevo refresh token
    await refreshTokenModel.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    return {
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600
    };
  }
  
  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userModel.findById(userId);
    
    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('INVALID_CURRENT_PASSWORD', 'Contraseña actual incorrecta', 400);
    }
    
    // Validar nueva contraseña
    if (!this.isValidPassword(newPassword)) {
      throw new AppError('WEAK_PASSWORD', 'La contraseña no cumple los requisitos', 400);
    }
    
    // Hash y guardar
    const newHash = await bcrypt.hash(newPassword, 12);
    await userModel.update(userId, { passwordHash: newHash });
    
    // Revocar todas las sesiones
    await refreshTokenModel.revokeAllForUser(userId);
    
    logger.info(`Password changed: ${userId}`);
  }
  
  /**
   * Generar access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  
  /**
   * Generar refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { sub: user.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  /**
   * Validar fortaleza de contraseña
   */
  isValidPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasNumber;
  }
  
  /**
   * Sanitizar datos de usuario
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
  
  /**
   * Log de intento fallido
   */
  async logFailedAttempt(controlNumber) {
    // Implementar rate limiting/failed attempts tracking
    logger.warn(`Failed login attempt: ${controlNumber}`);
  }
}

module.exports = new AuthService();
```

## Servicio de Usuarios

```javascript
// src/services/user.service.js

const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const documentService = require('./document.service');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class UserService {
  /**
   * Listar usuarios
   */
  async getUsers(filters) {
    const { page, perPage, role, search, isActive } = filters;
    
    const where = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
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
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          controlNumber: true,
          name: true,
          email: true,
          role: true,
          career: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
          // Excluir passwordHash
        }
      }),
      userModel.count({ where })
    ]);
    
    return {
      data: users,
      pagination: {
        page,
        perPage,
        totalItems: total,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }
  
  /**
   * Obtener usuario por ID
   */
  async getUserById(id, options = {}) {
    const user = await userModel.findById(id, {
      select: {
        id: true,
        controlNumber: true,
        name: true,
        email: true,
        role: true,
        career: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });
    
    if (!user) return null;
    
    // Incluir progreso si se solicita
    if (options.includeProgress && user.role === 'estudiante') {
      user.documentsProgress = await documentService.getUserProgress(id);
    }
    
    return user;
  }
  
  /**
   * Crear usuario
   */
  async createUser(userData) {
    // Validar controlNumber único
    const existingControl = await userModel.findByControlNumber(userData.controlNumber);
    if (existingControl) {
      throw new AppError('DUPLICATE_CONTROL_NUMBER', 
        'El número de control ya está registrado', 409);
    }
    
    // Validar email único
    const existingEmail = await userModel.findByEmail(userData.email);
    if (existingEmail) {
      throw new AppError('DUPLICATE_EMAIL', 
        'El email ya está registrado', 409);
    }
    
    // Validar email institucional
    if (!userData.email.endsWith('@ejemplo.edu.mx')) {
      throw new AppError('INVALID_EMAIL', 
        'El email debe ser institucional (@ejemplo.edu.mx)', 400);
    }
    
    // Validar carrera para estudiantes
    if (userData.role === 'estudiante' && !userData.career) {
      throw new AppError('MISSING_CAREER', 
        'La carrera es requerida para estudiantes', 400);
    }
    
    // Hash de contraseña
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    // Crear usuario en transacción
    const user = await userModel.create({
      ...userData,
      passwordHash,
      isActive: true
    });
    
    // Si es estudiante, generar documentos iniciales
    if (userData.role === 'estudiante') {
      try {
        await documentService.createInitialDocuments(user.id, 'servicio_social');
        await documentService.createInitialDocuments(user.id, 'residencias');
      } catch (error) {
        logger.error(`Error creating documents for user ${user.id}:`, error);
        // No fallar la creación del usuario si los documentos fallan
      }
    }
    
    logger.info(`User created: ${userData.controlNumber}`);
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Actualizar usuario
   */
  async updateUser(id, updateData) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    
    // No permitir cambiar controlNumber
    if (updateData.controlNumber && updateData.controlNumber !== user.controlNumber) {
      throw new AppError('IMMUTABLE_FIELD', 
        'No se puede cambiar el número de control', 400);
    }
    
    // Validar email si se cambia
    if (updateData.email && updateData.email !== user.email) {
      const existing = await userModel.findByEmail(updateData.email);
      if (existing) {
        throw new AppError('DUPLICATE_EMAIL', 
          'El email ya está registrado', 409);
      }
    }
    
    const updated = await userModel.update(id, updateData);
    
    return this.sanitizeUser(updated);
  }
  
  /**
   * Eliminar/desactivar usuario
   */
  async deleteUser(id, hard = false) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    
    // Prevenir eliminación del último admin
    if (user.role === 'admin') {
      const adminCount = await userModel.count({
        role: 'admin',
        isActive: true,
        id: { not: id }
      });
      
      if (adminCount === 0) {
        throw new AppError('CANNOT_DELETE_LAST_ADMIN', 
          'No se puede eliminar el último administrador', 400);
      }
    }
    
    if (hard) {
      // Eliminar documentos físicos primero
      await documentService.deleteAllUserDocuments(id);
      await userModel.delete(id);
    } else {
      // Soft delete
      await userModel.update(id, { 
        isActive: false, 
        deactivatedAt: new Date() 
      });
    }
    
    logger.info(`User ${hard ? 'deleted' : 'deactivated'}: ${id}`);
  }
  
  /**
   * Reactivar usuario
   */
  async activateUser(id, newPassword) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    
    // Actualizar password y reactivar
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const updated = await userModel.update(id, {
      isActive: true,
      passwordHash,
      activatedAt: new Date()
    });
    
    return this.sanitizeUser(updated);
  }
  
  /**
   * Sanitizar datos de usuario
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new UserService();
```

## Servicio de Documentos

```javascript
// src/services/document.service.js

const path = require('path');
const documentModel = require('../models/document.model');
const categoryModel = require('../models/category.model');
const observationModel = require('../models/observation.model');
const fileStorageService = require('./fileStorage.service');
const AppError = require('../utils/AppError');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DocumentService {
  /**
   * Obtener documentos
   */
  async getDocuments(filters) {
    const { programType, studentId, status, category } = filters;
    
    const where = {};
    if (programType) where.programType = programType;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (category) where.category = { code: category };
    
    const documents = await documentModel.findMany({
      where,
      include: {
        category: true,
        observations: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Solo la última observación
        },
        reviewedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } }
      ]
    });
    
    return documents;
  }
  
  /**
   * Obtener documento por ID
   */
  async getDocumentById(id) {
    const document = await documentModel.findById(id, {
      include: {
        category: true,
        observations: {
          include: {
            createdBy: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        reviewedBy: {
          select: { id: true, name: true }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return document;
  }
  
  /**
   * Subir archivo a documento
   */
  async uploadDocument(documentId, userId, file) {
    // Obtener documento
    const document = await documentModel.findById(documentId);
    if (!document) {
      throw new AppError('DOCUMENT_NOT_FOUND', 'Documento no encontrado', 404);
    }
    
    // Verificar propiedad
    if (document.studentId !== userId) {
      throw new AppError('FORBIDDEN', 'No puedes modificar este documento', 403);
    }
    
    // Verificar estado
    if (document.status === 'approved') {
      throw new AppError('DOCUMENT_LOCKED', 
        'No se puede modificar un documento aprobado', 422);
    }
    
    // Validar archivo
    const validation = await fileStorageService.validateFile(
      file.buffer, 
      file.mimetype, 
      file.size
    );
    
    if (!validation.valid) {
      throw new AppError('INVALID_FILE', validation.error, 400);
    }
    
    // Generar path
    const student = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { controlNumber: true }
    });
    
    const category = await categoryModel.findById(document.categoryId);
    
    const filePath = fileStorageService.generateStoragePath(
      student.controlNumber,
      document.programType,
      category.code,
      file.originalname
    );
    
    // Eliminar archivo anterior si existe
    if (document.fileUrl) {
      await fileStorageService.deleteFile(document.fileUrl);
    }
    
    // Guardar archivo
    const saveResult = await fileStorageService.saveFile(file.buffer, filePath);
    if (!saveResult.success) {
      throw new AppError('SAVE_FAILED', saveResult.error, 500);
    }
    
    // Actualizar documento
    const updated = await documentModel.update(documentId, {
      fileUrl: filePath,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending',
      uploadedAt: new Date()
    });
    
    return updated;
  }
  
  /**
   * Revisar documento
   */
  async reviewDocument(documentId, reviewerId, reviewData) {
    const { status, observations } = reviewData;
    
    const document = await documentModel.findById(documentId);
    if (!document) {
      throw new AppError('DOCUMENT_NOT_FOUND', 'Documento no encontrado', 404);
    }
    
    // Estados permitidos para revisión
    const allowedStatuses = ['pending', 'under_review'];
    if (!allowedStatuses.includes(document.status)) {
      throw new AppError('INVALID_STATUS', 
        `No se puede revisar un documento en estado: ${document.status}`, 400);
    }
    
    // Verificar que tenga archivo
    if (!document.fileUrl) {
      throw new AppError('NO_FILE_UPLOADED', 
        'El documento no tiene archivo subido', 400);
    }
    
    // Ejecutar en transacción
    const result = await prisma.$transaction(async (trx) => {
      // Actualizar documento
      const updated = await documentModel.update(documentId, {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }, { transaction: trx });
      
      // Crear observación si aplica
      if (observations && (status === 'rejected' || status === 'observed')) {
        await observationModel.create({
          documentId,
          text: observations,
          createdBy: reviewerId,
          isResolved: false
        }, { transaction: trx });
      }
      
      // Marcar observaciones como resueltas si se aprueba
      if (status === 'approved') {
        await observationModel.resolveAll(documentId, { transaction: trx });
      }
      
      // Registrar historial
      await prisma.documentStatusHistory.create({
        data: {
          documentId,
          previousStatus: document.status,
          newStatus: status,
          changedBy: reviewerId
        }
      }, { transaction: trx });
      
      return updated;
    });
    
    return result;
  }
  
  /**
   * Crear documentos iniciales para estudiante
   */
  async createInitialDocuments(studentId, programType) {
    // Obtener categorías para este programa
    const categories = await categoryModel.findMany({
      where: {
        OR: [
          { programType },
          { programType: 'both' }
        ]
      }
    });
    
    // Crear documentos en estado draft
    const documents = categories.map(category => ({
      studentId,
      categoryId: category.id,
      programType,
      status: 'draft'
    }));
    
    await documentModel.createMany(documents);
  }
  
  /**
   * Obtener progreso de estudiantes
   */
  async getStudentsProgress(programType) {
    const progress = await prisma.$queryRaw`
      SELECT 
        u.id as student_id,
        u.control_number,
        u.name,
        u.career,
        COUNT(d.id) as total,
        COUNT(d.id) FILTER (WHERE d.status = 'approved') as approved,
        COUNT(d.id) FILTER (WHERE d.status = 'pending') as pending,
        COUNT(d.id) FILTER (WHERE d.status IN ('rejected', 'observed')) as rejected
      FROM users u
      JOIN documents d ON u.id = d.student_id
      WHERE u.role = 'estudiante'
        AND u.is_active = true
        AND d.program_type = ${programType}
      GROUP BY u.id, u.control_number, u.name, u.career
      ORDER BY u.control_number
    `;
    
    return progress.map(p => ({
      studentId: p.student_id,
      controlNumber: p.control_number,
      name: p.name,
      career: p.career,
      total: parseInt(p.total),
      approved: parseInt(p.approved),
      pending: parseInt(p.pending),
      rejected: parseInt(p.rejected),
      percentage: p.total > 0 
        ? Math.round((p.approved / p.total) * 100) 
        : 0
    }));
  }
  
  /**
   * Eliminar todos los documentos de un usuario
   */
  async deleteAllUserDocuments(userId) {
    const documents = await documentModel.findMany({
      where: { studentId: userId }
    });
    
    // Eliminar archivos físicos
    for (const doc of documents) {
      if (doc.fileUrl) {
        await fileStorageService.deleteFile(doc.fileUrl);
      }
    }
    
    // Eliminar registros (cascade delete se encarga de observaciones)
    await documentModel.deleteMany({ studentId: userId });
  }
}

module.exports = new DocumentService();
```

## AppError (Custom Error)

```javascript
// src/utils/AppError.js

class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

---

**Ver también:**
- [01. Estructura](./01-folder-structure.md) - Organización
- [02. Controladores](./02-controllers.md) - Uso de servicios
