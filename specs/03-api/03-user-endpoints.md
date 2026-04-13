# 3.3 Endpoints de Gestión de Usuarios

## Resumen

Especificación de los endpoints CRUD para gestión de usuarios (estudiantes, encargados, administradores).

## Permisos

| Endpoint | Estudiante | Encargado | Admin |
|----------|------------|-----------|-------|
| GET /users | ❌ | ✅ | ✅ |
| GET /users/:id | Solo sí mismo | ✅ | ✅ |
| POST /users | ❌ | ❌ | ✅ |
| PUT /users/:id | Solo sí mismo | ✅ | ✅ |
| DELETE /users/:id | ❌ | ❌ | ✅ |
| POST /users/:id/activate | ❌ | ❌ | ✅ |

## Endpoints

### 1. GET /users

Lista usuarios con filtros y paginación.

#### Request

```http
GET /api/users?page=1&perPage=20&role=estudiante&search=garcia
Authorization: Bearer {token}
```

#### Query Parameters

| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| page | integer | Número de página | 1 |
| perPage | integer | Items por página (max 100) | 20 |
| role | string | Filtrar por rol | - |
| search | string | Búsqueda en nombre/controlNumber | - |
| isActive | boolean | Filtrar por estado | - |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "controlNumber": "201912345",
      "name": "Juan García Pérez",
      "email": "201912345@ejemplo.edu.mx",
      "role": "estudiante",
      "career": "Ingeniería en Sistemas",
      "isActive": true,
      "createdAt": "2023-08-15T10:30:00Z",
      "lastLogin": "2024-01-15T14:20:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "controlNumber": "201912346",
      "name": "María García López",
      "email": "201912346@ejemplo.edu.mx",
      "role": "estudiante",
      "career": "Ingeniería Industrial",
      "isActive": true,
      "createdAt": "2023-08-16T09:15:00Z",
      "lastLogin": "2024-01-14T11:45:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440002",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "totalItems": 156,
      "totalPages": 8
    }
  }
}
```

#### Lógica

```javascript
async getUsers(filters, pagination) {
  const { page = 1, perPage = 20, role, search, isActive } = filters;
  
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
    userRepository.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' }
    }),
    userRepository.count({ where })
  ]);
  
  return {
    data: users.map(sanitizeUser),
    pagination: {
      page: parseInt(page),
      perPage: parseInt(perPage),
      totalItems: total,
      totalPages: Math.ceil(total / perPage)
    }
  };
}
```

---

### 2. GET /users/:id

Obtiene un usuario específico.

#### Request

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "controlNumber": "201912345",
    "name": "Juan García Pérez",
    "email": "201912345@ejemplo.edu.mx",
    "role": "estudiante",
    "career": "Ingeniería en Sistemas",
    "phone": "4491234567",
    "isActive": true,
    "createdAt": "2023-08-15T10:30:00Z",
    "updatedAt": "2024-01-10T16:45:00Z",
    "lastLogin": "2024-01-15T14:20:00Z",
    // Campos solo para estudiantes:
    "documentsProgress": {
      "servicioSocial": {
        "total": 5,
        "approved": 3,
        "pending": 1,
        "rejected": 1,
        "percentage": 60
      },
      "residencias": {
        "total": 0,
        "approved": 0,
        "pending": 0,
        "rejected": 0,
        "percentage": 0
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440003"
  }
}
```

#### Response Error (404)

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuario no encontrado"
  }
}
```

---

### 3. POST /users

Crea un nuevo usuario (solo admin).

#### Request

```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "controlNumber": "202012345",
  "name": "Pedro Martínez Ruiz",
  "email": "202012345@ejemplo.edu.mx",
  "password": "Temporal123!",
  "role": "estudiante",
  "career": "Ingeniería Civil",
  "phone": "4499876543"
}
```

#### Validaciones

| Campo | Requerido | Reglas |
|-------|-----------|--------|
| controlNumber | Sí | Único, alfanumérico, 5-20 caracteres |
| name | Sí | Mínimo 2 caracteres |
| email | Sí | Email institucional @ejemplo.edu.mx, único |
| password | Sí | Mínimo 8 caracteres, temporal |
| role | Sí | enum: `"estudiante"`, `"encargado"`, `"admin"` |
| career | Condicional | Requerido si role = estudiante |
| phone | No | Formato telefónico |

#### Response Exitoso (201)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "controlNumber": "202012345",
    "name": "Pedro Martínez Ruiz",
    "email": "202012345@ejemplo.edu.mx",
    "role": "estudiante",
    "career": "Ingeniería Civil",
    "isActive": true,
    "createdAt": "2024-01-15T14:30:22Z",
    "temporaryPassword": true
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:22Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440005"
  }
}
```

#### Response Error (409) - ControlNumber duplicado

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CONTROL_NUMBER",
    "message": "El número de control ya está registrado",
    "details": [
      { "field": "controlNumber", "message": "Ya existe un usuario con este número de control" }
    ]
  }
}
```

#### Lógica

```javascript
async createUser(userData) {
  // 1. Verificar unicidad
  const existing = await userRepository.findByControlNumber(userData.controlNumber);
  if (existing) {
    throw new AppError('DUPLICATE_CONTROL_NUMBER', 'Número de control ya existe', 409);
  }
  
  const existingEmail = await userRepository.findByEmail(userData.email);
  if (existingEmail) {
    throw new AppError('DUPLICATE_EMAIL', 'Email ya registrado', 409);
  }
  
  // 2. Validar email institucional
  if (!userData.email.endsWith('@ejemplo.edu.mx')) {
    throw new AppError('INVALID_EMAIL', 'Email debe ser institucional', 400);
  }
  
  // 3. Validar career para estudiantes
  if (userData.role === 'estudiante' && !userData.career) {
    throw new AppError('MISSING_CAREER', 'La carrera es requerida para estudiantes', 400);
  }
  
  // 4. Hash de password
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  // 5. Crear usuario
  const newUser = await userRepository.create({
    ...userData,
    passwordHash,
    isActive: true
  });
  
  // 6. Si es estudiante, generar documentos iniciales
  if (userData.role === 'estudiante') {
    await documentService.createDocumentsForStudent(newUser.id, 'servicio_social');
    await documentService.createDocumentsForStudent(newUser.id, 'residencias');
  }
  
  // 7. Enviar email de bienvenida (async)
  emailService.sendWelcomeEmail(newUser.email, userData.password)
    .catch(err => console.error('Error enviando email:', err));
  
  return sanitizeUser(newUser, { includeTempPassword: true });
}
```

---

### 4. PUT /users/:id

Actualiza un usuario.

#### Request

```http
PUT /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "name": "Juan García Pérez",
  "email": "201912345@ejemplo.edu.mx",
  "career": "Ingeniería en Software",
  "phone": "4491112222",
  "isActive": true
}
```

#### Campos Editables

| Campo | Estudiante | Encargado | Admin |
|-------|------------|-----------|-------|
| name | Sí mismo | ✅ | ✅ |
| email | ❌ | ✅ | ✅ |
| career | ❌ | ✅ | ✅ |
| phone | Sí mismo | ✅ | ✅ |
| isActive | ❌ | ❌ | ✅ |
| role | ❌ | ❌ | ✅ |

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "controlNumber": "201912345",
    "name": "Juan García Pérez",
    "email": "201912345@ejemplo.edu.mx",
    "role": "estudiante",
    "career": "Ingeniería en Software",
    "phone": "4491112222",
    "isActive": true,
    "updatedAt": "2024-01-15T14:35:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T14:35:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440006"
  }
}
```

---

### 5. DELETE /users/:id

Elimina (o desactiva) un usuario.

#### Request

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

#### Query Parameters

| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| hard | boolean | Eliminar permanentemente vs desactivar | false |

#### Response Exitoso - Soft Delete (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": false,
    "deactivatedAt": "2024-01-15T14:40:00Z"
  }
}
```

#### Response Exitoso - Hard Delete (204)

```http
HTTP/1.1 204 No Content
```

#### Lógica

```javascript
async deleteUser(id, hard = false) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
  }
  
  if (user.role === 'admin') {
    // Verificar que no sea el último admin
    const adminCount = await userRepository.count({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      throw new AppError('CANNOT_DELETE_LAST_ADMIN', 'No puede eliminar el último administrador', 400);
    }
  }
  
  if (hard) {
    // Eliminar documentos físicos primero
    await documentService.deleteAllUserDocuments(id);
    // Luego eliminar usuario
    await userRepository.delete(id);
    return { status: 204 };
  } else {
    // Soft delete - desactivar
    await userRepository.update(id, { 
      isActive: false, 
      deactivatedAt: new Date() 
    });
    // Revocar tokens
    await refreshTokenRepository.revokeAllForUser(id);
    return { isActive: false, deactivatedAt: new Date() };
  }
}
```

---

### 6. POST /users/:id/activate

Reactiva un usuario desactivado.

#### Request

```http
POST /api/users/550e8400-e29b-41d4-a716-446655440000/activate
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "newPassword": "NuevaTemp123!"
}
```

#### Response Exitoso (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "activatedAt": "2024-01-15T14:45:00Z",
    "temporaryPassword": true
  }
}
```

## Modelo de Datos (TypeScript)

```typescript
// types/user.ts

interface User {
  id: string;
  controlNumber: string;
  passwordHash: string; // Solo backend
  name: string;
  email: string;
  role: 'estudiante' | 'encargado' | 'admin';
  career?: string; // Solo para estudiantes
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

interface CreateUserRequest {
  controlNumber: string;
  name: string;
  email: string;
  password: string;
  role: 'estudiante' | 'encargado' | 'admin';
  career?: string;
  phone?: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  career?: string;
  phone?: string;
  isActive?: boolean;
  role?: 'estudiante' | 'encargado' | 'admin';
}

interface UserResponse {
  id: string;
  controlNumber: string;
  name: string;
  email: string;
  role: string;
  career?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  lastLogin?: string;
  documentsProgress?: {
    servicioSocial: ProgressSummary;
    residencias: ProgressSummary;
  };
}

interface ProgressSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  percentage: number;
}
```

## Seeds de Datos

```javascript
// seeds/users.seed.js

const initialUsers = [
  {
    controlNumber: 'ADMIN001',
    name: 'Administrador Sistema',
    email: 'admin@ejemplo.edu.mx',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    controlNumber: 'ENCARG001',
    name: 'Encargado Servicio Social',
    email: 'encargado.ss@ejemplo.edu.mx',
    password: 'Encargado123!',
    role: 'encargado'
  },
  {
    controlNumber: '202100001',
    name: 'Estudiante Demo',
    email: '202100001@ejemplo.edu.mx',
    password: 'Estudiante123!',
    role: 'estudiante',
    career: 'Ingeniería en Sistemas'
  }
];
```

---

**Ver también:**
- [02. Autenticación](./02-auth-endpoints.md) - Login y tokens
- [04. Documentos](./04-document-endpoints.md) - Gestión de documentos
