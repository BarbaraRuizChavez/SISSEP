# 1.2 Especificación de Componentes MVVM

## Resumen

Este documento especifica la implementación del patrón MVVM en SISSEP, detallando las responsabilidades de cada componente y cómo interactúan entre sí.

## Patrón MVVM en SISSEP

```
┌─────────────────────────────────────────────────────────────┐
│                         VIEW                                │
│              (React Components - .tsx)                      │
│                                                             │
│  • Renderizado visual                                       │
│  • Captura de eventos de usuario                           │
│  • Binding a datos del ViewModel                           │
│  • Sin lógica de negocio compleja                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ Usa hooks del ViewModel
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      VIEWMODEL                              │
│              (Custom Hooks - useXxx.ts)                     │
│                                                             │
│  • Gestión del estado local (useState)                      │
│  • Lógica de presentación                                  │
│  • Transformación de datos para la View                    │
│  • Llamadas al Service/Model                               │
│  • Exposición de métodos y datos observables               │
└───────────────────────────┬─────────────────────────────────┘
                            │ Llama al Service
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICE                             │
│              (API Services - services/api.ts)                 │
│                                                             │
│  • Comunicación HTTP con backend                           │
│  • Serialización/deserialización de datos                  │
│  • Manejo de errores de red                                │
│  • Autenticación de requests                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        MODEL                                │
│            (Backend + Database Entities)                    │
│                                                             │
│  • Entidades de dominio                                    │
│  • Reglas de negocio                                       │
│  • Validaciones de datos                                   │
│  • Persistencia (PostgreSQL)                               │
└─────────────────────────────────────────────────────────────┘
```

## Especificación de Componentes

### 1. VIEW (Componentes React)

**Ubicación:** `frontend/app/**/*.tsx`

**Responsabilidades:**
- Mostrar la interfaz de usuario
- Recibir props del ViewModel (hook)
- Emitir eventos al ViewModel
- No contener lógica de negocio

**Ejemplo - View (Login):**

```typescript
// frontend/app/(auth)/login/page.tsx - SPEC

interface LoginViewProps {
  // Props inyectadas por el ViewModel
  controlNumber: string;
  password: string;
  role: 'estudiante' | 'encargado';
  error: string;
  loading: boolean;
  
  // Handlers expuestos por el ViewModel
  onControlNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (role: 'estudiante' | 'encargado') => void;
  onSubmit: () => Promise<void>;
}

// Implementación - Solo UI
export default function LoginPage() {
  const vm = useLoginViewModel(); // Obtiene ViewModel
  
  return (
    <form onSubmit={vm.onSubmit}>
      <input 
        value={vm.controlNumber} 
        onChange={e => vm.onControlNumberChange(e.target.value)}
      />
      {/* ... */}
    </form>
  );
}
```

**Reglas:**
- ❌ NO hacer llamadas directas a API
- ❌ NO tener estado de negocio
- ✅ SÍ usar el ViewModel hook
- ✅ SÍ manejar estado puramente visual (hover, focus)

---

### 2. VIEWMODEL (Custom Hooks)

**Ubicación:** `frontend/viewmodels/**/*.ts`

**Responsabilidades:**
- Mantener estado de la vista (useState)
- Transformar datos del Model para la View
- Validar inputs antes de enviar al Model
- Coordinar llamadas a Services
- Manejar estados de carga/error

**Especificación - ViewModel Base:**

```typescript
// frontend/viewmodels/types.ts

// Interfaz base para todos los ViewModels
interface BaseViewModel<TState, TActions> {
  state: TState;
  actions: TActions;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Estados de carga posibles
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Interfaz para ViewModels con listas
interface ListViewModel<T> extends BaseViewModel {
  items: T[];
  selectedItem: T | null;
  filter: string;
  setFilter: (filter: string) => void;
  selectItem: (item: T) => void;
}
```

**Ejemplo - Login ViewModel:**

```typescript
// frontend/viewmodels/useLoginViewModel.ts - SPEC

import { useState, useCallback } from 'react';
import { useAuthService } from '@/services/auth';

interface LoginState {
  controlNumber: string;
  password: string;
  role: 'estudiante' | 'encargado';
}

interface LoginActions {
  setControlNumber: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (role: 'estudiante' | 'encargado') => void;
  submit: () => Promise<void>;
}

export function useLoginViewModel(): LoginViewModel {
  // Estado local
  const [state, setState] = useState<LoginState>({
    controlNumber: '',
    password: '',
    role: 'estudiante'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const authService = useAuthService();
  const router = useRouter();
  
  // Transformaciones/Validaciones
  const setControlNumber = useCallback((value: string) => {
    // Limpia espacios, valida formato si es necesario
    setState(prev => ({ ...prev, controlNumber: value.trim() }));
    setError(null);
  }, []);
  
  const setPassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, password: value }));
    setError(null);
  }, []);
  
  const setRole = useCallback((role: 'estudiante' | 'encargado') => {
    setState(prev => ({ ...prev, role }));
  }, []);
  
  // Acción principal - llama al Service
  const submit = useCallback(async () => {
    // Validación de negocio
    if (!state.controlNumber || !state.password) {
      setError('Completa todos los campos');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Llama al Service
      await authService.login({
        controlNumber: state.controlNumber,
        password: state.password,
        role: state.role
      });
      
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [state, authService, router]);
  
  const clearError = useCallback(() => setError(null), []);
  
  return {
    ...state,
    loading,
    error,
    clearError,
    setControlNumber,
    setPassword,
    setRole,
    submit
  };
}
```

**Reglas:**
- ✅ SÍ mantener estado de UI (form inputs, filtros)
- ✅ SÍ validar antes de llamar al Service
- ✅ SÍ manejar loading/error states
- ❌ NO acceder directamente a localStorage/cookies
- ❌ NO tener lógica de negocio compleja (eso va en Services)

---

### 3. SERVICE (Capa de Servicios)

**Ubicación:** `frontend/services/**/*.ts`

**Responsabilidades:**
- Comunicación HTTP con el backend
- Manejo de tokens de autenticación
- Serialización/deserialización
- Retriable requests, timeout handling

**Especificación - Service Base:**

```typescript
// frontend/services/api.ts - SPEC

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Interceptor para auth token
    this.client.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(path, config);
    return response.data;
  }
  
  async post<T>(path: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(path, data, config);
    return response.data;
  }
  
  async patch<T>(path: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(path, data, config);
    return response.data;
  }
  
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(path, config);
    return response.data;
  }
  
  // Para upload de archivos
  async uploadFile<T>(path: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

export const apiService = new ApiService();
```

**Ejemplo - Auth Service:**

```typescript
// frontend/services/auth.ts - SPEC

import { apiService } from './api';

interface LoginRequest {
  controlNumber: string;
  password: string;
  role: 'estudiante' | 'encargado';
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
    carrera?: string;
  };
}

interface AuthService {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(): Promise<string>;
}

export function useAuthService(): AuthService {
  return {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      // Guarda token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    },
    
    async logout(): Promise<void> {
      await apiService.post('/auth/logout', {});
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    async getCurrentUser(): Promise<User | null> {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },
    
    async refreshToken(): Promise<string> {
      const response = await apiService.post<{ token: string }>('/auth/refresh', {});
      localStorage.setItem('token', response.token);
      return response.token;
    }
  };
}
```

---

### 4. MODEL (Backend + Database)

**Ubicación:** `backend/src/models/**/*.js`

**Responsabilidades:**
- Definición de entidades
- Validaciones de datos
- Reglas de negocio
- Acceso a base de datos

Ver especificación completa en [05-backend/04-models.md](../05-backend/04-models.md)

---

## Mapeo de ViewModels por Pantalla

| Pantalla | ViewModel | Responsabilidades |
|----------|-----------|-------------------|
| `/login` | `useLoginViewModel` | Validar credenciales, manejar roles, redirigir |
| `/dashboard` | `useDashboardViewModel` | Redirigir según rol, cargar datos iniciales |
| `/dashboard/admin` | `useAdminViewModel` | Listar estudiantes, filtros, estadísticas |
| `/dashboard/student` | `useStudentViewModel` | Listar documentos, subir archivos, progreso |
| Document Detail | `useDocumentViewModel` | Ver/revisar documento, aprobar/rechazar |

## Diagrama de Secuencia MVVM

```
Usuario    View    ViewModel    Service    Backend    Database
  │         │          │          │          │          │
  │────click()─────>│          │          │          │
  │         │    submit()     │          │          │
  │         │─────────>│       │          │          │
  │         │          │   login()      │          │
  │         │          │────────>│      │          │
  │         │          │         │  POST /auth/login
  │         │          │         │────────>│      │
  │         │          │         │         │  SELECT
  │         │          │         │         │──────>│
  │         │          │         │         │<──────│
  │         │          │         │<────────│      │
  │         │          │<────────│         │      │
  │         │<─────────│         │         │      │
  │         │  redirect()       │         │      │
  │<────────│          │       │         │      │
```

## Checklist de Implementación MVVM

### Para cada ViewModel:
- [ ] Define interfaz de State
- [ ] Define interfaz de Actions
- [ ] Usa useState para estado local
- [ ] Usa useCallback para handlers
- [ ] Maneja loading states
- [ ] Maneja error states
- [ ] Valida inputs antes de llamar Service
- [ ] Documenta con JSDoc

### Para cada Service:
- [ ] Define interfaces Request/Response
- [ ] Usa apiService base
- [ ] Maneja errores de red
- [ ] Serializa/deserializa datos
- [ ] Maneja tokens de auth

### Para cada View:
- [ ] Solo contiene lógica de presentación
- [ ] Usa ViewModel hook
- [ ] No llama a API directamente
- [ ] Props tipadas con TypeScript

---

**Ver también:**
- [03. Diagramas de Arquitectura](./03-diagrams.md)
- [04-frontend/02-viewmodels.md](../04-frontend/02-viewmodels.md)
