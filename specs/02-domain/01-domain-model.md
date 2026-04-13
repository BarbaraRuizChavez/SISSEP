# 2.1 Modelo de Dominio

## Resumen

Este documento define las entidades del dominio de SISSEP, sus atributos, relaciones y reglas de negocio.

## Entidades Principales

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN MODEL                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      USER        │         │    DOCUMENT      │         │    CATEGORY      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ PK id: UUID      │──────┐  │ PK id: UUID      │──────┐  │ PK id: UUID      │
│    controlNumber │      │  │ FK student_id    │──────┘  │    code: string  │
│    password_hash │      │  │ FK category_id   │────────>│    name: string  │
│    name: string  │      │  │    status: enum  │         │    description   │
│    email: string │      │  │    fileUrl: url  │         │    programType   │
│    role: enum    │      │  │    uploadedAt    │         │    isRequired    │
│    career: ?     │      │  │    reviewedAt    │         │    order: int    │
│    createdAt     │      │  │    observations[]│         │    createdAt     │
│    isActive      │      │  │    fileSize      │         └──────────────────┘
└──────────────────┘      │  └──────────────────┘
         │                │           │
         │                │           │
         │    ┌───────────┘           │
         │    │                       │
         ▼    ▼                       ▼
    ┌──────────────────┐         ┌──────────────────┐
    │  OBSERVATION     │         │  DOCUMENT_STATUS │
    ├──────────────────┤         ├──────────────────┤
    │ PK id: UUID      │         │ Enum:            │
    │ FK document_id   │         │ - draft          │
    │    text: string  │         │ - pending        │
    │    createdBy     │         │ - under_review   │
    │    createdAt     │         │ - approved       │
    │    isResolved    │         │ - rejected       │
    └──────────────────┘         │ - observed       │
                                   └──────────────────┘
```

## Entidad: User

Representa a cualquier persona que interactúa con el sistema.

### Atributos

| Atributo | Tipo | Requerido | Descripción | Reglas |
|----------|------|-----------|-------------|--------|
| id | UUID | Sí | Identificador único | Generado automáticamente |
| controlNumber | string(20) | Sí | Número de control institucional | Único, no editable |
| passwordHash | string(255) | Sí | Contraseña hasheada (bcrypt) | Mínimo 60 caracteres |
| name | string(100) | Sí | Nombre completo | No vacío |
| email | string(100) | Sí | Correo institucional | Formato válido, único |
| role | enum | Sí | Rol en el sistema | Valores: `estudiante`, `encargado`, `admin` |
| career | string(50) | Condicional | Carrera (solo estudiantes) | Requerido si role = estudiante |
| phone | string(20) | No | Teléfono de contacto | Opcional |
| isActive | boolean | Sí | Estado de la cuenta | Default: true |
| createdAt | timestamp | Sí | Fecha de creación | Auto-generado |
| updatedAt | timestamp | Sí | Última actualización | Auto-actualizado |

### Estados

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  ACTIVE  │───→│ INACTIVE │←───│  PENDING │
│          │    │          │    │ (email   │
│          │    │          │    │  verify) │
└──────────┘    └──────────┘    └──────────┘
```

### Reglas de Negocio

1. **RN-USER-001:** El controlNumber debe ser único en todo el sistema
2. **RN-USER-002:** Solo los usuarios con role="encargado" pueden revisar documentos
3. **RN-USER-003:** Un estudiante solo puede ver sus propios documentos
4. **RN-USER-004:** El email debe pertenecer al dominio institucional (@ejemplo.edu.mx)

---

## Entidad: Document

Representa un documento requerido para el proceso de servicio social o residencias.

### Atributos

| Atributo | Tipo | Requerido | Descripción | Reglas |
|----------|------|-----------|-------------|--------|
| id | UUID | Sí | Identificador único | Generado automáticamente |
| studentId | UUID(FK) | Sí | Estudiante propietario | Referencia a User |
| categoryId | UUID(FK) | Sí | Tipo de documento | Referencia a Category |
| status | enum | Sí | Estado actual | Default: `draft` |
| fileUrl | string(500) | No | Ruta del archivo subido | Requerido para status ≠ draft |
| fileName | string(255) | No | Nombre original del archivo | Para referencia |
| fileSize | integer | No | Tamaño en bytes | Máximo 10MB |
| mimeType | string(100) | No | Tipo MIME | PDF, JPG, PNG |
| uploadedAt | timestamp | No | Fecha de subida | Auto al cambiar fileUrl |
| reviewedAt | timestamp | No | Fecha de revisión | Auto al aprobar/rechazar |
| reviewedBy | UUID(FK) | No | Encargado que revisó | Referencia a User |
| programType | enum | Sí | Tipo de programa | `servicio_social`, `residencias` |
| createdAt | timestamp | Sí | Fecha de creación | Auto-generado |
| updatedAt | timestamp | Sí | Última actualización | Auto-actualizado |

### Estados y Transiciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCUMENT STATE MACHINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

                      ┌─────────┐
                      │  DRAFT  │
                      │ (vacío) │
                      └────┬────┘
                           │ student uploads file
                           │
                           ▼
                      ┌─────────┐     ┌───────────────┐
    ┌────────────────│ PENDING │─────│UNDER_REVIEW   │
    │                │(archivo)│     │               │
    │                └────┬────┘     └───────────────┘
    │                     │ admin starts review
 reject with             │
 observations            ▼
    │              ┌─────────┐
    │         ┌────│APPROVED │
    │         │    │         │
    │         │    └────┬────┘
    │    approve       │
    │                   │
    ▼              ┌────┴────┐
┌─────────┐        │OBSERVED │
│REJECTED │        │(con nota)│
│         │        └────┬────┘
│         │             │ student re-uploads
└─────────┘             │
   │                    ▼
   └─────────────────>┌─────────┐
                      │ PENDING │
                      │(nuevo   │
                      │ archivo)│
                      └─────────┘
```

### Transiciones Permitidas

| De | A | Condición |
|----|---|-----------|
| draft | pending | Estudiante sube archivo |
| pending | under_review | Encargado inicia revisión |
| under_review | approved | Encargado aprueba sin observaciones |
| under_review | rejected | Encargado rechaza con observaciones graves |
| under_review | observed | Encargado solicita correcciones |
| rejected | pending | Estudiante sube nuevo archivo (reinicio) |
| observed | pending | Estudiante sube archivo corregido |

### Reglas de Negocio

1. **RN-DOC-001:** Un documento en estado `draft` no puede ser revisado
2. **RN-DOC-002:** Solo archivos PDF, JPG, PNG son permitidos
3. **RN-DOC-003:** Tamaño máximo de archivo: 10MB
4. **RN-DOC-004:** El estudiante solo puede subir archivos para sus propios documentos
5. **RN-DOC-005:** Una vez aprobado, el documento no puede ser modificado (solo por admin)
6. **RN-DOC-006:** Las observaciones deben incluir un mensaje descriptivo

---

## Entidad: Category

Define los tipos de documentos requeridos según el programa.

### Atributos

| Atributo | Tipo | Requerido | Descripción | Reglas |
|----------|------|-----------|-------------|--------|
| id | UUID | Sí | Identificador único | Generado automáticamente |
| code | string(50) | Sí | Código único del documento | Ej: "SOLICITUD", "CONSTANCIA" |
| name | string(100) | Sí | Nombre legible | Ej: "Solicitud de Servicio Social" |
| description | text | No | Descripción detallada | Instrucciones para el estudiante |
| programType | enum | Sí | A qué programa aplica | `servicio_social`, `residencias`, `both` |
| isRequired | boolean | Sí | Es obligatorio | Default: true |
| order | integer | Sí | Orden de presentación | Para secuencia lógica |
| templateUrl | string(500) | No | URL de plantilla descargable | Opcional |
| createdAt | timestamp | Sí | Fecha de creación | Auto-generado |
| updatedAt | timestamp | Sí | Última actualización | Auto-actualizado |

### Ejemplos de Categorías

| Código | Nombre | Programa | Requerido |
|--------|--------|----------|-----------|
| SS-SOL | Solicitud de Servicio Social | servicio_social | Sí |
| SS-CARTA | Carta de Aceptación | servicio_social | Sí |
| SS-CONST | Constancia de Término | servicio_social | Sí |
| RES-PROP | Propuesta de Proyecto | residencias | Sí |
| RES-ASES | Carta de Asesor Interno | residencias | Sí |
| RES-INFORME | Informe Final | residencias | Sí |

### Reglas de Negocio

1. **RN-CAT-001:** El código debe ser único y no modificable
2. **RN-CAT-002:** Las categorías pueden marcarse como no requeridas (opcionales)
3. **RN-CAT-003:** El orden determina la secuencia en que se muestran al estudiante
4. **RN-CAT-004:** Al crear un estudiante, se generan automáticamente sus documentos en draft

---

## Entidad: Observation

Registra comentarios y retroalimentación sobre un documento.

### Atributos

| Atributo | Tipo | Requerido | Descripción | Reglas |
|----------|------|-----------|-------------|--------|
| id | UUID | Sí | Identificador único | Generado automáticamente |
| documentId | UUID(FK) | Sí | Documento relacionado | Cascade delete |
| text | text | Sí | Contenido de la observación | Mínimo 10 caracteres |
| createdBy | UUID(FK) | Sí | Encargado que creó | Referencia a User |
| isResolved | boolean | Sí | Fue atendida | Default: false |
| resolvedAt | timestamp | No | Cuándo se resolvió | Auto al resolver |
| createdAt | timestamp | Sí | Fecha de creación | Auto-generado |

### Reglas de Negocio

1. **RN-OBS-001:** Solo encargados pueden crear observaciones
2. **RN-OBS-002:** Una observación se marca como resuelta cuando el documento cambia a pending
3. **RN-OBS-003:** Historial completo de observaciones se conserva para auditoría

---

## Relaciones entre Entidades

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RELATIONSHIPS                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

User ||--o{ Document : "studentId - creates"
User ||--o{ Observation : "createdBy - writes"
User ||--o{ Document : "reviewedBy - reviews"

Document ||--|| Category : "categoryId - is type"
Document ||--o{ Observation : "has many"

Category }o--|| Program : "belongs to"

Program {
  string type
  string name
}
```

### Cardinalidad

| Entidad A | Relación | Entidad B | Cardinalidad | Descripción |
|-----------|----------|-----------|--------------|-------------|
| User | crea | Document | 1:N | Un estudiante tiene muchos documentos |
| User | revisa | Document | 1:N | Un encargado revisa muchos documentos |
| Category | define | Document | 1:N | Una categoría puede tener muchos documentos |
| Document | tiene | Observation | 1:N | Un documento puede tener muchas observaciones |
| User | escribe | Observation | 1:N | Un encargado escribe muchas observaciones |

---

## Agregados (Aggregates)

### Aggregate: StudentDocuments

Raíz: User (con role=estudiante)
Entidades hijas: Documents, Observations

```
Student (root)
├── Documents[]
│   ├── Observations[]
│   └── Category (reference)
└── Profile data
```

**Invariantes:**
- Un estudiante solo puede modificar sus propios documentos
- Al crear estudiante, se generan todos los documentos requeridos en draft

### Aggregate: DocumentReview

Raíz: Document
Entidades hijas: Observations

```
Document (root)
├── Observations[]
├── Student (reference)
├── Reviewer (reference)
└── Category (reference)
```

**Invariantes:**
- Solo encargados pueden cambiar status a approved/rejected
- Documentos aprobados son inmutables

---

## Servicios de Dominio

### DocumentService

Métodos:
- `createDocumentsForStudent(studentId, programType)` - Genera documentos iniciales
- `canUpload(documentId, studentId)` - Valida permisos de subida
- `reviewDocument(documentId, reviewerId, status, observations)` - Procesa revisión
- `getProgress(studentId, programType)` - Calcula porcentaje de completitud

### UserService

Métodos:
- `authenticate(controlNumber, password)` - Login con validaciones
- `canReview(userId)` - Verifica si el usuario tiene permisos de encargado
- `getDocuments(studentId)` - Obtiene documentos con permisos

---

## Eventos de Dominio

| Evento | Descripción | Disparador |
|----------|-------------|------------|
| DocumentUploaded | Archivo subido exitosamente | Cambio draft → pending |
| DocumentReviewed | Documento revisado por encargado | Cambio a approved/rejected |
| ObservationAdded | Nueva observación creada | Creación de Observation |
| StudentCreated | Nuevo estudiante registrado | Creación de User con role=estudiante |

---

**Ver también:**
- [02. Esquema PostgreSQL](./02-postgres-schema.md) - Implementación física
- [04-backend/04-models.md](../04-backend/04-models.md) - Modelos del backend
