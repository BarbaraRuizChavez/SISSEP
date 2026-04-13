# 4.1 Estructura de Carpetas del Frontend

## Resumen

Este documento define la organización de archivos y carpetas para el frontend de SISSEP, siguiendo el patrón MVVM y las mejores prácticas de Next.js 14 con App Router.

## Estructura General

```
frontend/
├── app/                          # Next.js App Router (vistas/pages)
│   ├── (auth)/                   # Route group - autenticación
│   │   └── login/
│   │       └── page.tsx           # Página de login
│   ├── dashboard/                 # Dashboard protegido
│   │   ├── (admin)/              # Route group - admin
│   │   │   └── admin/
│   │   │       └── page.tsx       # Panel de administrador
│   │   ├── (student)/            # Route group - estudiante
│   │   │   └── student/
│   │   │       └── page.tsx       # Panel de estudiante
│   │   ├── layout.tsx             # Layout del dashboard
│   │   └── page.tsx               # Redirección según rol
│   ├── layout.tsx                 # Root layout (con providers)
│   ├── page.tsx                   # Home (redirect a login)
│   ├── globals.css                # Estilos globales + Tailwind
│   └── favicon.ico
│
├── components/                    # Componentes React
│   ├── ui/                        # Componentes base/atómicos
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Spinner.tsx
│   │   ├── StatusPill.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   ├── forms/                     # Componentes de formularios
│   │   ├── LoginForm.tsx
│   │   └── DocumentUpload.tsx
│   ├── documents/                 # Componentes específicos de documentos
│   │   ├── DocumentList.tsx
│   │   ├── DocumentCard.tsx
│   │   └── DocumentStatusBadge.tsx
│   └── layouts/                   # Componentes de layout
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── viewmodels/                    # ViewModels (Custom Hooks)
│   ├── types.ts                   # Interfaces de ViewModels
│   ├── useAuthViewModel.ts        # Autenticación
│   ├── useLoginViewModel.ts       # Login
│   ├── useAdminViewModel.ts       # Panel admin
│   ├── useStudentViewModel.ts     # Panel estudiante
│   ├── useDocumentViewModel.ts    # Gestión de documentos
│   └── useUserViewModel.ts        # Gestión de usuarios
│
├── services/                      # Servicios (Comunicación API)
│   ├── api.ts                     # Configuración base Axios
│   ├── auth.ts                    # Servicio de autenticación
│   ├── documents.ts               # Servicio de documentos
│   ├── users.ts                   # Servicio de usuarios
│   └── uploads.ts                 # Servicio de upload de archivos
│
├── contexts/                      # React Contexts
│   ├── AuthContext.tsx            # Contexto de autenticación
│   └── ThemeContext.tsx           # Contexto de tema (opcional)
│
├── hooks/                         # Hooks genéricos/reutilizables
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useFetch.ts
│
├── types/                         # TypeScript types/interfaces
│   ├── user.ts
│   ├── document.ts
│   ├── api.ts
│   └── index.ts                   # Barrel export
│
├── lib/                           # Utilidades y helpers
│   ├── utils.ts                   # Funciones utilitarias
│   ├── constants.ts               # Constantes de la app
│   └── validations.ts             # Validaciones
│
├── config/                        # Configuración
│   ├── api.config.ts              # URLs de API
│   └── app.config.ts              # Config general
│
├── public/                        # Archivos estáticos
│   ├── images/
│   └── documents/
│       └── templates/             # Plantillas descargables
│
├── styles/                        # Estilos adicionales (si aplica)
│   └── components.css
│
├── tests/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env                           # Variables de entorno
├── .env.local                     # Variables locales (no commitear)
├── .env.production                # Variables de producción
├── next.config.js                 # Configuración de Next.js
├── tsconfig.json                  # Configuración TypeScript
├── tailwind.config.ts             # Configuración Tailwind
└── package.json
```

## Convenciones de Nomenclatura

### Archivos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Páginas | `page.tsx` (Next.js convención) | `app/dashboard/page.tsx` |
| Layouts | `layout.tsx` (Next.js convención) | `app/dashboard/layout.tsx` |
| Componentes UI | PascalCase | `Button.tsx`, `DocumentCard.tsx` |
| ViewModels | camelCase con prefijo `use` | `useAuthViewModel.ts` |
| Servicios | camelCase | `auth.ts`, `documents.ts` |
| Types/Interfaces | camelCase, sufijo opcional | `user.ts`, `api.types.ts` |
| Utilidades | camelCase | `utils.ts`, `validations.ts` |
| Tests | `.test.ts` o `.spec.ts` | `Button.test.tsx` |

### Nombres de Componentes

```typescript
// ✅ Correcto - PascalCase, descriptivo
export default function DocumentList() { }
export default function UserProfileCard() { }

// ❌ Incorrecto
export default function documentList() { } // camelCase
export default function DocList() { } // Abreviado sin contexto
```

### ViewModels

```typescript
// ✅ Correcto - Prefijo use, sufijo ViewModel opcional
export function useLoginViewModel() { }
export function useAuthViewModel() { }

// ❌ Incorrecto
export function loginViewModel() { } // Sin prefijo use
export function useLogin() { } // Puede confundirse con acción
```

## Reglas de Organización

### 1. App Router

```typescript
// Estructura de una página en app/

// app/dashboard/(admin)/admin/page.tsx
'use client'; // Si usa hooks/interactividad

import { useAdminViewModel } from '@/viewmodels/useAdminViewModel';

export default function AdminPage() {
  // ViewModel maneja toda la lógica
  const { students, loading, search, setSearch } = useAdminViewModel();
  
  return (
    <div>
      {/* Solo presentación y eventos */}
    </div>
  );
}
```

### 2. Components

```
components/
├── ui/           # Atómicos - sin lógica de negocio
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Spinner.tsx
│
├── forms/        # Componentes de formulario
│   └── LoginForm.tsx
│
├── documents/    # Domain-specific
│   ├── DocumentList.tsx
│   └── DocumentCard.tsx
│
└── layouts/      # Componentes estructurales
    ├── Navbar.tsx
    └── Sidebar.tsx
```

**Regla:** Componentes UI no deben:
- Llamar a la API directamente
- Usar Router/Navigation
- Tener estado de negocio
- Depender de contexts

### 3. ViewModels

```typescript
// viewmodels/useLoginViewModel.ts
// Responsabilidad: Lógica de presentación + llamadas a services

import { useState, useCallback } from 'react';
import { useAuthService } from '@/services/auth';
import { useRouter } from 'next/navigation';

export function useLoginViewModel() {
  // Estado local de la vista
  const [formData, setFormData] = useState({
    controlNumber: '',
    password: '',
    role: 'estudiante' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const authService = useAuthService();
  const router = useRouter();
  
  // Handlers
  const setControlNumber = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, controlNumber: value.trim() }));
    setError(null);
  }, []);
  
  const setPassword = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    setError(null);
  }, []);
  
  const setRole = useCallback((role: 'estudiante' | 'encargado') => {
    setFormData(prev => ({ ...prev, role }));
  }, []);
  
  // Acción principal
  const submit = useCallback(async () => {
    // Validaciones
    if (!formData.controlNumber || !formData.password) {
      setError('Completa todos los campos');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await authService.login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, authService, router]);
  
  return {
    ...formData,
    loading,
    error,
    setControlNumber,
    setPassword,
    setRole,
    submit
  };
}
```

### 4. Services

```typescript
// services/api.ts - Base
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Interceptor para auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// services/auth.ts - Específico
import api from './api';

export const authService = {
  async login(credentials: LoginRequest) {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  
  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
```

### 5. Types

```typescript
// types/index.ts - Barrel export
export * from './user';
export * from './document';
export * from './api';

// types/user.ts
export interface User {
  id: string;
  controlNumber: string;
  name: string;
  email: string;
  role: 'estudiante' | 'encargado' | 'admin';
  career?: string;
}

export interface LoginRequest {
  controlNumber: string;
  password: string;
  role: 'estudiante' | 'encargado';
}

// types/document.ts
export type DocumentStatus = 
  | 'draft' 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'observed';

export interface Document {
  id: string;
  category: Category;
  status: DocumentStatus;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  observations: Observation[];
}
```

## Configuración de Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/viewmodels/*": ["./viewmodels/*"],
      "@/services/*": ["./services/*"],
      "@/types/*": ["./types/*"],
      "@/lib/*": ["./lib/*"],
      "@/config/*": ["./config/*"]
    }
  }
}
```

## Flujo de Datos MVVM

```
Usuario interactúa con Componente
         ↓
Componente emite evento
         ↓
ViewModel recibe evento, procesa
         ↓
ViewModel llama a Service
         ↓
Service hace HTTP request
         ↓
ViewModel actualiza estado
         ↓
Componente re-renderiza con nuevos datos
```

## Checklist de Estructura

- [ ] `app/` contiene solo páginas y layouts
- [ ] `components/ui/` solo tiene componentes presentacionales
- [ ] `viewmodels/` sigue el patrón useXxxViewModel
- [ ] `services/` no importan componentes
- [ ] `types/` exporta desde index.ts
- [ ] Todos los imports usan aliases (@/)
- [ ] No hay imports circulares
- [ ] Tests en `tests/` con misma estructura que src

---

**Ver también:**
- [02. ViewModels](./02-viewmodels.md) - Especificación de ViewModels
- [03. Componentes de Vista](./03-view-components.md) - Componentes React
