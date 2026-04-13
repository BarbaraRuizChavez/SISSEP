# 3.4 Endpoints de Gestión de Documentos

## Resumen

Especificación completa de los endpoints para gestión de documentos: listado, subida, revisión y descarga.

## Endpoints

### 1. GET /documents

Lista documentos del estudiante autenticado o de todos (encargado).

#### Request

```http
GET /api/documents?programType=servicio_social&studentId=xxx
Authorization: Bearer {token}
```

#### Query Parameters

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| programType | string | Filtrar por programa: `servicio_social`, `residencias` | Sí para estudiantes |
| studentId | string | Filtrar por estudiante (solo encargado) | Condicional |
| status | string | Filtrar por estado | No |
| category | string | Filtrar por categoría | No |

#### Response Exitoso - Estudiante (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "code": "SS-SOL",
        "name": "Solicitud de Servicio Social",
        "description": "Formato oficial de solicitud",
        "isRequired": true
      },
      "status": "approved",
      "fileUrl": "/uploads/servicio_social/2024/201912345/SS-SOL_20240115143022.pdf",
      "fileName": "SS-SOL_20240115143022.pdf",
      "fileSize": 245000,
      "mimeType": "application/pdf",
      "uploadedAt": "2024-01-15T14:30:22Z",
      "reviewedAt": "2024-01-16T09:15:00Z",
      "reviewedBy": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Encargado SS"
      },
      "observations": [],
      "programType": "servicio_social"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "category": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "code": "SS-CARTA",
        "name": "Carta de Aceptación",
        "isRequired": true
      },
      "status": "observed",
      "fileUrl": "/uploads/servicio_social/2024/201912345/SS-CARTA_20240120110000.pdf",
      "fileName": "carta_aceptacion.pdf",
      "fileSize": 180000,
      "uploadedAt": "2024-01-20T11:00:00Z",
      "observations": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440005",
          "text": "Falta firma del representante de la institución receptora",
          "createdAt": "2024-01-21T10:30:00Z",
          "createdBy": "Encargado SS"
        }
      ],
      "programType": "servicio_social"
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440006",
    "summary": {
      "total": 5,
      "approved": 1,
      "pending": 0,
      "underReview": 0,
      "rejected": 0,
      "observed": 1,
      "draft": 3,
      "percentage": 20
    }
  }
}
```

#### Lógica

```javascript
async getDocuments(req) {
  const { programType, studentId, status, category } = req.query;
  const { user } = req;
  
  // Determinar scope de búsqueda
  let targetStudentId;
  
  if (user.role === 'estudiante') {
    targetStudentId = user.id;
  } else {
    // Encargado/admin debe especificar o ver todos
    targetStudentId = studentId;
  }
  
  const where = {};
  if (targetStudentId) where.studentId = targetStudentId;
  if (programType) where.programType = programType;
  if (status) where.status = status;
  if (category) where.categoryCode = category;
  
  const documents = await documentRepository.findMany({
    where,
    include: ['category', 'reviewedBy', 'observations'],
    orderBy: [
      { category: { sortOrder: 'asc' } },
      { createdAt: 'desc' }
    ]
  });
  
  // Calcular resumen
  const summary = calculateSummary(documents);
  
  return { data: documents.map(sanitizeDocument), meta: { summary } };
}
```

---

### 2. GET /documents/:id

Obtiene un documento específico.

#### Request

```http
GET /api/documents/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student": {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "controlNumber": "201912345",
      "name": "Juan García"
    },
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "code": "SS-SOL",
      "name": "Solicitud de Servicio Social",
      "description": "Formato oficial de solicitud",
      "templateUrl": "/templates/SS-SOL.pdf",
      "isRequired": true
    },
    "status": "under_review",
    "fileUrl": "/uploads/servicio_social/2024/201912345/SS-SOL_20240115143022.pdf",
    "fileName": "SS-SOL_20240115143022.pdf",
    "fileSize": 245000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T14:30:22Z",
    "reviewedAt": null,
    "programType": "servicio_social",
    "createdAt": "2024-01-15T14:00:00Z",
    "updatedAt": "2024-01-15T14:30:22Z",
    "observations": [],
    "statusHistory": [
      {
        "status": "draft",
        "changedAt": "2024-01-15T14:00:00Z"
      },
      {
        "status": "pending",
        "changedAt": "2024-01-15T14:30:22Z"
      },
      {
        "status": "under_review",
        "changedAt": "2024-01-16T09:00:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440008"
  }
}
```

---

### 3. POST /documents/:id/upload

Sube un archivo a un documento.

#### Request

```http
POST /api/documents/550e8400-e29b-41d4-a716-446655440000/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

```
FormData:
  - file: File (required, PDF/JPG/PNG, max 10MB)
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileUrl": "/uploads/servicio_social/2024/201912345/SS-SOL_20240115143022.pdf",
    "fileName": "SS-SOL_20240115143022.pdf",
    "fileSize": 245000,
    "status": "pending",
    "uploadedAt": "2024-01-15T14:30:22Z"
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440009"
  }
}
```

#### Response Error (400) - Archivo inválido

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "El archivo no cumple con los requisitos",
    "details": [
      { "constraint": "size", "max": "10MB", "actual": "15MB" }
    ]
  }
}
```

#### Response Error (422) - Documento bloqueado

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_LOCKED",
    "message": "No se puede modificar un documento aprobado",
    "currentStatus": "approved"
  }
}
```

Ver detalle completo en [02-domain/03-file-storage.md](../02-domain/03-file-storage.md).

---

### 4. PATCH /documents/:id/review

Revisa un documento (aprobar, rechazar, observar).

#### Request

```http
PATCH /api/documents/550e8400-e29b-41d4-a716-446655440000/review
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "status": "approved"
}
```

O con observaciones:

```json
{
  "status": "observed",
  "observations": "Falta la firma del representante legal de la institución. Por favor suba el documento corregido."
}
```

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| status | string | Sí | Nuevo estado: `approved`, `rejected`, `observed` |
| observations | string | Condicional | Requerido si status = `rejected` u `observed`. Mínimo 10 caracteres |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "previousStatus": "under_review",
    "status": "approved",
    "reviewedAt": "2024-01-16T09:15:00Z",
    "reviewedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Encargado SS"
    },
    "observations": []
  },
  "meta": {
    "timestamp": "2024-01-16T09:15:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440010"
  }
}
```

#### Response Error (400) - Validación

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El documento debe estar pendiente para ser revisado",
    "currentStatus": "draft"
  }
}
```

#### Lógica

```javascript
async reviewDocument(documentId, reviewerId, reviewData) {
  const { status, observations } = reviewData;
  
  // 1. Obtener documento
  const document = await documentRepository.findById(documentId);
  if (!document) {
    throw new AppError('DOCUMENT_NOT_FOUND', 'Documento no encontrado', 404);
  }
  
  // 2. Verificar que el documento esté en estado revisable
  const allowedStatuses = ['pending', 'under_review'];
  if (!allowedStatuses.includes(document.status)) {
    throw new AppError('INVALID_STATUS', 
      `No se puede revisar un documento en estado: ${document.status}`, 400);
  }
  
  // 3. Verificar que tenga archivo subido
  if (!document.fileUrl) {
    throw new AppError('NO_FILE_UPLOADED', 'El documento no tiene archivo subido', 400);
  }
  
  // 4. Validar observaciones si es necesario
  if ((status === 'rejected' || status === 'observed') && !observations) {
    throw new AppError('OBSERVATIONS_REQUIRED', 
      'Debe proporcionar observaciones al rechazar o solicitar correcciones', 400);
  }
  
  if (observations && observations.length < 10) {
    throw new AppError('OBSERVATIONS_TOO_SHORT', 
      'Las observaciones deben tener al menos 10 caracteres', 400);
  }
  
  // 5. Ejecutar transacción
  await db.transaction(async (trx) => {
    // Actualizar documento
    await documentRepository.update(documentId, {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    }, { trx });
    
    // Crear observación si aplica
    if (observations) {
      await observationRepository.create({
        documentId,
        text: observations,
        createdBy: reviewerId,
        isResolved: false
      }, { trx });
    }
    
    // Marcar observaciones anteriores como resueltas si se aprueba
    if (status === 'approved') {
      await observationRepository.resolveAll(documentId, { trx });
    }
    
    // Registrar en historial de estados
    await statusHistoryRepository.create({
      documentId,
      previousStatus: document.status,
      newStatus: status,
      changedBy: reviewerId
    }, { trx });
  });
  
  // 6. Notificar al estudiante (async)
  notificationService.sendDocumentReviewed(document.studentId, {
    documentId,
    newStatus: status,
    observations
  }).catch(console.error);
  
  return {
    id: documentId,
    previousStatus: document.status,
    status,
    reviewedAt: new Date(),
    reviewedBy: await userRepository.findById(reviewerId),
    observations: status !== 'approved' ? observations : null
  };
}
```

---

### 5. GET /documents/progress

Obtiene el progreso de documentos por estudiante (para panel de admin).

#### Request

```http
GET /api/documents/progress?programType=servicio_social
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": [
    {
      "studentId": "550e8400-e29b-41d4-a716-446655440007",
      "controlNumber": "201912345",
      "name": "Juan García",
      "career": "Ingeniería en Sistemas",
      "total": 5,
      "approved": 3,
      "pending": 1,
      "rejected": 0,
      "observed": 1,
      "draft": 0,
      "percentage": 60
    },
    {
      "studentId": "550e8400-e29b-41d4-a716-446655440011",
      "controlNumber": "201912346",
      "name": "María López",
      "career": "Ingeniería Industrial",
      "total": 5,
      "approved": 5,
      "pending": 0,
      "rejected": 0,
      "observed": 0,
      "draft": 0,
      "percentage": 100
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440012"
  }
}
```

---

### 6. GET /documents/:id/download

Descarga el archivo del documento.

#### Request

```http
GET /api/documents/550e8400-e29b-41d4-a716-446655440000/download
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="SS-SOL_20240115143022.pdf"

<file stream>
```

---

### 7. GET /documents/:id/view

Visualiza el archivo en línea (inline).

#### Request

```http
GET /api/documents/550e8400-e29b-41d4-a716-446655440000/view
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline

<file stream>
```

## Modelo de Datos

```typescript
// types/document.ts

type DocumentStatus = 
  | 'draft'      // Sin archivo, no subido
  | 'pending'    // Archivo subido, esperando revisión
  | 'under_review' // En proceso de revisión
  | 'approved'   // Aprobado
  | 'rejected'   // Rechazado, debe subir de nuevo
  | 'observed';  // Con observaciones menores

type ProgramType = 'servicio_social' | 'residencias';

interface Document {
  id: string;
  studentId: string;
  categoryId: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  programType: ProgramType;
  createdAt: string;
  updatedAt: string;
}

interface DocumentResponse extends Document {
  category: Category;
  reviewedBy?: UserSummary;
  observations: Observation[];
  statusHistory?: StatusHistory[];
}

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  programType: ProgramType | 'both';
  isRequired: boolean;
  sortOrder: number;
  templateUrl?: string;
}

interface Observation {
  id: string;
  documentId: string;
  text: string;
  createdBy: string;
  createdByName?: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

interface ReviewRequest {
  status: 'approved' | 'rejected' | 'observed';
  observations?: string;
}

interface ProgressSummary {
  studentId: string;
  controlNumber: string;
  name: string;
  career: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  observed: number;
  draft: number;
  percentage: number;
}
```

---

**Ver también:**
- [01. Especificación General](./01-api-spec.md) - Estándares REST
- [02-domain/03-file-storage.md](../02-domain/03-file-storage.md) - Almacenamiento de archivos
