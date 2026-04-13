# 2.3 Almacenamiento de Archivos

## Resumen

Este documento especifica la estrategia de almacenamiento de archivos digitales (PDF, imágenes) en SISSEP, incluyendo estructura de carpetas, validaciones y acceso.

## Arquitectura de Almacenamiento

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FILE STORAGE                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐              ┌─────────────────────┐
│    DESARROLLO       │              │     PRODUCCIÓN      │
├─────────────────────┤              ├─────────────────────┤
│  Local Filesystem   │              │  Cloud Storage      │
│  /uploads/          │              │  (AWS S3 / MinIO)   │
│                     │              │                     │
│  Pros:              │              │  Pros:              │
│  - Simple           │              │  - Escalable        │
│  - Sin costos       │              │  - Backup automático│
│  - Fácil debug      │              │  - CDN disponible   │
│                     │              │                     │
│  Cons:              │              │  Cons:              │
│  - No escalable     │              │  - Costos           │
│  - Sin backup       │              │  - Configuración    │
└─────────────────────┘              └─────────────────────┘
```

## Estructura de Carpetas (Development)

```
/uploads/                               ← Raíz (configurable via env)
├── servicio_social/
│   ├── 2024/
│   │   ├── 12345/                      ← Número de control del estudiante
│   │   │   ├── SS-SOL_20240115.pdf     ← {category-code}_{timestamp}.{ext}
│   │   │   ├── SS-CARTA_20240120.pdf
│   │   │   └── SS-CONST_20240601.pdf
│   │   └── 12346/
│   └── 2025/
│
├── residencias/
│   ├── 2024/
│   │   ├── 12345/
│   │   │   ├── RES-PROP_20240201.pdf
│   │   │   ├── RES-ASES_20240215.pdf
│   │   │   └── RES-INFORME_20240615.pdf
│   │   └── ...
│   └── 2025/
│
└── temp/                               ← Archivos temporales durante upload
    └── {uuid}.tmp
```

## Especificación de Paths

### Formato de Path

```
{base_path}/{program_type}/{year}/{control_number}/{category_code}_{timestamp}.{ext}

Ejemplo:
/uploads/servicio_social/2024/12345/SS-SOL_20240115143022.pdf
```

### Componentes

| Componente | Descripción | Ejemplo |
|------------|-------------|---------|
| base_path | Raíz configurable | `/uploads` o `s3://bucket` |
| program_type | Tipo de programa | `servicio_social`, `residencias` |
| year | Año del proceso | `2024` |
| control_number | ID del estudiante | `12345` |
| category_code | Código de categoría | `SS-SOL` |
| timestamp | YYYYMMDDHHmmSS | `20240115143022` |
| ext | Extensión del archivo | `pdf`, `jpg`, `png` |

## Implementación del Service

```typescript
// backend/src/services/fileStorage.service.js - SPEC

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageService {
  constructor() {
    this.basePath = process.env.UPLOAD_PATH || './uploads';
    this.allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Valida un archivo antes de subirlo
   * @param {Buffer} fileBuffer - Contenido del archivo
   * @param {string} mimeType - MIME type reportado
   * @param {number} fileSize - Tamaño en bytes
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateFile(fileBuffer, mimeType, fileSize) {
    // 1. Validar tamaño
    if (fileSize > this.maxFileSize) {
      return { valid: false, error: 'Archivo excede el tamaño máximo de 10MB' };
    }

    // 2. Validar MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      return { valid: false, error: 'Tipo de archivo no permitido. Solo PDF, JPG, PNG' };
    }

    // 3. Validar firma mágica (magic bytes) para seguridad
    const magicBytes = fileBuffer.slice(0, 4).toString('hex');
    const validSignatures = {
      '25504446': 'application/pdf',  // %PDF
      'ffd8ffe0': 'image/jpeg',       // JPEG
      'ffd8ffe1': 'image/jpeg',       // JPEG (Exif)
      '89504e47': 'image/png'         // PNG
    };

    if (validSignatures[magicBytes] !== mimeType) {
      return { valid: false, error: 'El contenido del archivo no coincide con su extensión' };
    }

    return { valid: true };
  }

  /**
   * Genera el path de almacenamiento
   * @param {string} controlNumber - Número de control del estudiante
   * @param {string} programType - Tipo de programa
   * @param {string} categoryCode - Código de categoría
   * @param {string} originalName - Nombre original del archivo
   * @returns {string} - Path relativo para almacenamiento
   */
  generateStoragePath(controlNumber, programType, categoryCode, originalName) {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    
    const extension = path.extname(originalName).toLowerCase();
    const fileName = `${categoryCode}_${timestamp}${extension}`;
    
    return path.join(
      programType,
      year.toString(),
      controlNumber,
      fileName
    );
  }

  /**
   * Guarda un archivo en el storage
   * @param {Buffer} fileBuffer - Contenido del archivo
   * @param {string} relativePath - Path relativo generado
   * @returns {Promise<{success: boolean, url: string, error?: string}>}
   */
  async saveFile(fileBuffer, relativePath) {
    try {
      const fullPath = path.join(this.basePath, relativePath);
      const directory = path.dirname(fullPath);

      // Crear directorios si no existen
      await fs.mkdir(directory, { recursive: true });

      // Escribir archivo
      await fs.writeFile(fullPath, fileBuffer);

      return {
        success: true,
        url: relativePath, // Guardamos el path relativo en la BD
        fullPath
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al guardar archivo: ${error.message}`
      };
    }
  }

  /**
   * Elimina un archivo del storage
   * @param {string} relativePath - Path relativo del archivo
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteFile(relativePath) {
    try {
      const fullPath = path.join(this.basePath, relativePath);
      await fs.unlink(fullPath);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, warning: 'Archivo no existía' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el stream de un archivo para descarga
   * @param {string} relativePath - Path relativo del archivo
   * @returns {Promise<ReadStream>}
   */
  async getFileStream(relativePath) {
    const fullPath = path.join(this.basePath, relativePath);
    const { createReadStream } = require('fs');
    return createReadStream(fullPath);
  }

  /**
   * Calcula el hash SHA-256 de un archivo para integridad
   * @param {Buffer} fileBuffer - Contenido del archivo
   * @returns {string} - Hash hexadecimal
   */
  calculateHash(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }
}

module.exports = new FileStorageService();
```

## API Endpoints

### Subir Archivo

```yaml
# SPEC: POST /api/documents/:id/upload

Request:
  Content-Type: multipart/form-data
  Body:
    file: File (required) - Archivo a subir (PDF, JPG, PNG, max 10MB)
    
Response 200:
  Body:
    success: true
    data:
      documentId: UUID
      fileUrl: string - Path relativo del archivo
      fileName: string - Nombre original
      fileSize: number - Tamaño en bytes
      uploadedAt: timestamp
      
Response 400:
  Body:
    success: false
    error:
      code: "INVALID_FILE"
      message: "El archivo excede el tamaño máximo permitido"
      
Response 403:
  Body:
    success: false
    error:
      code: "FORBIDDEN"
      message: "No tienes permiso para modificar este documento"
```

### Descargar Archivo

```yaml
# SPEC: GET /api/documents/:id/download

Request:
  Headers:
    Authorization: Bearer {token}

Response 200:
  Content-Type: application/octet-stream
  Content-Disposition: attachment; filename="documento.pdf"
  Body: <file stream>

Response 404:
  Body:
    success: false
    error:
      code: "FILE_NOT_FOUND"
      message: "El archivo no existe"
```

### Ver Archivo (Inline)

```yaml
# SPEC: GET /api/documents/:id/view

Request:
  Headers:
    Authorization: Bearer {token}

Response 200:
  Content-Type: application/pdf | image/jpeg | image/png
  Body: <file stream>
  
Response 404:
  Body:
    success: false
    error:
      code: "FILE_NOT_FOUND"
```

## Middleware de Upload

```javascript
// backend/src/middlewares/upload.middleware.js - SPEC

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Guarda en memoria temporalmente

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG, PNG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Solo un archivo por request
  }
});

// Middleware para manejar errores de multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'El archivo excede el tamaño máximo de 10MB'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message }
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE', message: err.message }
    });
  }
  
  next();
};

module.exports = { upload, handleUploadError };
```

## Controller de Documentos

```javascript
// backend/src/controllers/document.controller.js - SPEC (file operations)

const fileStorageService = require('../services/fileStorage.service');
const documentService = require('../services/document.service');

class DocumentController {
  /**
   * POST /api/documents/:id/upload
   */
  async uploadFile(req, res, next) {
    try {
      const { id: documentId } = req.params;
      const { id: userId, role } = req.user; // Del JWT
      
      // 1. Verificar que el documento existe y pertenece al usuario
      const document = await documentService.getById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento no encontrado' }
        });
      }
      
      // 2. Verificar permisos (solo el estudiante dueño puede subir)
      if (document.student_id !== userId && role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'No tienes permiso para modificar este documento' }
        });
      }
      
      // 3. Validar que no esté ya aprobado
      if (document.status === 'approved') {
        return res.status(400).json({
          success: false,
          error: { code: 'DOCUMENT_LOCKED', message: 'No se puede modificar un documento aprobado' }
        });
      }
      
      // 4. El archivo está en req.file (del middleware multer)
      const { buffer, mimetype, size, originalname } = req.file;
      
      // 5. Validar archivo
      const validation = await fileStorageService.validateFile(buffer, mimetype, size);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: validation.error }
        });
      }
      
      // 6. Generar path de almacenamiento
      const { control_number } = await documentService.getStudentInfo(document.student_id);
      const { program_type, category_code } = await documentService.getCategoryInfo(document.category_id);
      
      const relativePath = fileStorageService.generateStoragePath(
        control_number,
        program_type,
        category_code,
        originalname
      );
      
      // 7. Eliminar archivo anterior si existe
      if (document.file_url) {
        await fileStorageService.deleteFile(document.file_url);
      }
      
      // 8. Guardar nuevo archivo
      const saveResult = await fileStorageService.saveFile(buffer, relativePath);
      if (!saveResult.success) {
        return res.status(500).json({
          success: false,
          error: { code: 'SAVE_FAILED', message: saveResult.error }
        });
      }
      
      // 9. Calcular hash de integridad
      const fileHash = fileStorageService.calculateHash(buffer);
      
      // 10. Actualizar registro en BD
      const updatedDocument = await documentService.updateFileInfo(documentId, {
        fileUrl: relativePath,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
        status: 'pending', // Cambia de draft a pending
        fileHash
      });
      
      res.json({
        success: true,
        data: {
          documentId: updatedDocument.id,
          fileUrl: updatedDocument.file_url,
          fileName: updatedDocument.file_name,
          fileSize: updatedDocument.file_size,
          status: updatedDocument.status,
          uploadedAt: updatedDocument.uploaded_at
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/documents/:id/download
   */
  async downloadFile(req, res, next) {
    try {
      const { id: documentId } = req.params;
      const { id: userId, role } = req.user;
      
      const document = await documentService.getById(documentId);
      
      if (!document || !document.file_url) {
        return res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: 'Archivo no encontrado' }
        });
      }
      
      // Verificar permisos (estudiante solo sus docs, encargado todos)
      if (document.student_id !== userId && role === 'estudiante') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'No tienes acceso a este archivo' }
        });
      }
      
      // Stream del archivo
      const stream = await fileStorageService.getFileStream(document.file_url);
      
      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      
      stream.pipe(res);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/documents/:id/view (inline)
   */
  async viewFile(req, res, next) {
    try {
      const { id: documentId } = req.params;
      const { id: userId, role } = req.user;
      
      const document = await documentService.getById(documentId);
      
      if (!document || !document.file_url) {
        return res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: 'Archivo no encontrado' }
        });
      }
      
      // Verificar permisos
      if (document.student_id !== userId && role === 'estudiante') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'No tienes acceso a este archivo' }
        });
      }
      
      const stream = await fileStorageService.getFileStream(document.file_url);
      
      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', 'inline');
      
      stream.pipe(res);
      
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
```

## Seguridad

### Validaciones Implementadas

| Validación | Descripción | Implementación |
|------------|-------------|----------------|
| Tamaño máximo | 10MB por archivo | multer.limits + DB check |
| Tipos permitidos | PDF, JPG, PNG | MIME type + Magic bytes |
| Extensiones | .pdf, .jpg, .jpeg, .png | path.extname() |
| Path traversal | Prevenir `../../../etc/passwd` | path.join() normalizado |
| Hash de integridad | SHA-256 para verificación | crypto.createHash() |
| Permisos | Estudiante solo sus archivos | Middleware JWT + DB check |

### Variables de Entorno

```bash
# .env
UPLOAD_PATH=/var/www/sissep/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png
```

## Backup y Recuperación

### Estrategia de Backup

```bash
#!/bin/bash
# backup-files.sh

BACKUP_DIR=/backups/sissep/files
DATE=$(date +%Y%m%d_%H%M%S)

# Backup incremental con rsync
rsync -av --delete /var/www/sissep/uploads/ $BACKUP_DIR/current/

# Snapshot comprimido semanal
tar -czf $BACKUP_DIR/sissep_files_$DATE.tar.gz -C $BACKUP_DIR current/

# Eliminar backups antiguos (>30 días)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Recuperación

```bash
# Restaurar desde backup
rsync -av /backups/sissep/files/current/ /var/www/sissep/uploads/

# Verificar integridad de archivos
# (comparar hashes SHA-256 almacenados en BD)
```

---

**Ver también:**
- [02. Esquema PostgreSQL](./02-postgres-schema.md) - Tablas de metadatos
- [03-api/04-document-endpoints.md](../03-api/04-document-endpoints.md) - API completa
