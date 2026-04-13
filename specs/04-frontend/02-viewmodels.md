# 4.2 ViewModels (Custom Hooks)

## Resumen

Especificación de los ViewModels del frontend siguiendo el patrón MVVM. Cada ViewModel es un custom hook que gestiona el estado y la lógica de presentación de una vista.

## Estructura Base de un ViewModel

```typescript
// viewmodels/types.ts

import { DocumentStatus, ProgramType } from '@/types';

// Estados posibles de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Interfaz base para todos los ViewModels
export interface BaseViewModelState {
  loading: LoadingState;
  error: string | null;
}

export interface BaseViewModelActions {
  clearError: () => void;
  retry: () => void;
}
```

## 1. useAuthViewModel

Gestiona la autenticación global de la aplicación.

```typescript
// viewmodels/useAuthViewModel.ts

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (controlNumber: string, password: string, role: 'estudiante' | 'encargado') => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Cargar usuario al iniciar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          // Verificar token válido
          await authService.validateToken();
          setUser(storedUser);
        }
      } catch (error) {
        authService.clearStorage();
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);
  
  const login = useCallback(async (controlNumber: string, password: string, role: 'estudiante' | 'encargado') => {
    try {
      setIsLoading(true);
      const response = await authService.login({ controlNumber, password, role });
      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      authService.clearStorage();
      router.push('/login');
    }
  }, [router]);
  
  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      // Token actualizado en storage por el service
      return response;
    } catch (error) {
      // Token inválido, hacer logout
      await logout();
      throw error;
    }
  }, [logout]);
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthViewModel() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthViewModel debe usarse dentro de AuthProvider');
  }
  return context;
}
```

## 2. useLoginViewModel

Gestiona el formulario de login.

```typescript
// viewmodels/useLoginViewModel.ts

import { useState, useCallback } from 'react';
import { useAuthViewModel } from './useAuthViewModel';

type UserRole = 'estudiante' | 'encargado';

interface LoginFormState {
  controlNumber: string;
  password: string;
  role: UserRole;
}

interface LoginViewModelState {
  formData: LoginFormState;
  loading: boolean;
  error: string | null;
}

interface LoginViewModelActions {
  setControlNumber: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (role: UserRole) => void;
  submit: () => Promise<void>;
  clearError: () => void;
}

export function useLoginViewModel(): LoginViewModelState & LoginViewModelActions {
  const [formData, setFormData] = useState<LoginFormState>({
    controlNumber: '',
    password: '',
    role: 'estudiante'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuthViewModel();
  
  // Validación de controlNumber
  const setControlNumber = useCallback((value: string) => {
    // Solo permitir alfanumérico, limpiar espacios
    const cleaned = value.trim().replace(/[^a-zA-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, controlNumber: cleaned }));
    if (error) setError(null);
  }, [error]);
  
  const setPassword = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    if (error) setError(null);
  }, [error]);
  
  const setRole = useCallback((role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const submit = useCallback(async () => {
    // Validaciones
    if (!formData.controlNumber) {
      setError('Ingresa tu número de control');
      return;
    }
    
    if (formData.controlNumber.length < 5) {
      setError('Número de control inválido');
      return;
    }
    
    if (!formData.password) {
      setError('Ingresa tu contraseña');
      return;
    }
    
    if (formData.password.length < 3) {
      setError('Contraseña demasiado corta');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(formData.controlNumber, formData.password, formData.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, login]);
  
  return {
    formData,
    loading,
    error,
    setControlNumber,
    setPassword,
    setRole,
    submit,
    clearError
  };
}
```

## 3. useAdminViewModel

Gestiona el panel del administrador/encargado.

```typescript
// viewmodels/useAdminViewModel.ts

import { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/documents';
import { ProgramType, StudentProgress } from '@/types';

interface AdminViewModelState {
  section: ProgramType;
  students: StudentProgress[];
  filteredStudents: StudentProgress[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedStudent: StudentProgress | null;
  detailView: boolean;
  stats: {
    total: number;
    pending: number;
    approved: number;
  };
}

interface AdminViewModelActions {
  setSection: (section: ProgramType) => void;
  setSearchQuery: (query: string) => void;
  selectStudent: (student: StudentProgress | null) => void;
  openDetail: (studentId: string) => void;
  closeDetail: () => void;
  reviewDocument: (docId: string, status: 'approved' | 'rejected', observations?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAdminViewModel(): AdminViewModelState & AdminViewModelActions {
  const [section, setSection] = useState<ProgramType>('servicio_social');
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [detailView, setDetailView] = useState(false);
  
  // Cargar progreso de estudiantes
  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getProgress(section);
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [section]);
  
  // Cargar al cambiar sección
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);
  
  // Filtrar estudiantes
  const filteredStudents = students.filter(student => 
    student.controlNumber.includes(searchQuery) ||
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calcular estadísticas
  const stats = {
    total: students.length,
    pending: students.reduce((sum, s) => sum + s.pending, 0),
    approved: students.reduce((sum, s) => sum + s.approved, 0)
  };
  
  const openDetail = useCallback(async (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    if (student) {
      setSelectedStudent(student);
      setDetailView(true);
    }
  }, [students]);
  
  const closeDetail = useCallback(() => {
    setDetailView(false);
    setSelectedStudent(null);
  }, []);
  
  const reviewDocument = useCallback(async (
    docId: string, 
    status: 'approved' | 'rejected',
    observations?: string
  ) => {
    try {
      await documentService.reviewDocument(docId, { status, observations });
      // Recargar datos del estudiante seleccionado
      await loadProgress();
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [loadProgress]);
  
  const refresh = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);
  
  return {
    section,
    students,
    filteredStudents,
    loading,
    error,
    searchQuery,
    selectedStudent,
    detailView,
    stats,
    setSection,
    setSearchQuery: (query: string) => setSearchQuery(query),
    selectStudent: setSelectedStudent,
    openDetail,
    closeDetail,
    reviewDocument,
    refresh
  };
}
```

## 4. useStudentViewModel

Gestiona el panel del estudiante.

```typescript
// viewmodels/useStudentViewModel.ts

import { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/documents';
import { Document, ProgramType, DocumentStatus } from '@/types';
import { useAuthViewModel } from './useAuthViewModel';

interface StudentViewModelState {
  section: ProgramType;
  documents: Document[];
  loading: boolean;
  error: string | null;
  progress: {
    total: number;
    approved: number;
    percentage: number;
  };
}

interface StudentViewModelActions {
  setSection: (section: ProgramType) => void;
  uploadDocument: (docId: string, file: File) => Promise<void>;
  refresh: () => Promise<void>;
  downloadDocument: (docId: string) => Promise<void>;
  viewDocument: (docId: string) => Promise<void>;
}

export function useStudentViewModel(): StudentViewModelState & StudentViewModelActions {
  const [section, setSection] = useState<ProgramType>('servicio_social');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthViewModel();
  
  // Cargar documentos
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocuments({
        programType: section,
        studentId: user.id
      });
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [section, user]);
  
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
  
  // Calcular progreso
  const approved = documents.filter(d => d.status === 'approved').length;
  const progress = {
    total: documents.length,
    approved,
    percentage: documents.length > 0 ? Math.round((approved / documents.length) * 100) : 0
  };
  
  const uploadDocument = useCallback(async (docId: string, file: File) => {
    try {
      await documentService.uploadDocument(docId, file);
      await loadDocuments(); // Recargar lista
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [loadDocuments]);
  
  const downloadDocument = useCallback(async (docId: string) => {
    try {
      const blob = await documentService.downloadDocument(docId);
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento_${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, []);
  
  const viewDocument = useCallback(async (docId: string) => {
    try {
      const url = await documentService.getDocumentViewUrl(docId);
      window.open(url, '_blank');
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, []);
  
  const refresh = useCallback(async () => {
    await loadDocuments();
  }, [loadDocuments]);
  
  return {
    section,
    documents,
    loading,
    error,
    progress,
    setSection,
    uploadDocument,
    refresh,
    downloadDocument,
    viewDocument
  };
}
```

## 5. useDocumentViewModel

Gestiona el detalle de un documento (revisión).

```typescript
// viewmodels/useDocumentViewModel.ts

import { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/documents';
import { Document, Observation } from '@/types';

interface DocumentDetailState {
  document: Document | null;
  loading: boolean;
  error: string | null;
  isReviewing: boolean;
}

interface DocumentDetailActions {
  loadDocument: (docId: string) => Promise<void>;
  approve: () => Promise<void>;
  reject: (observations: string) => Promise<void>;
  requestChanges: (observations: string) => Promise<void>;
  startReview: () => void;
  cancelReview: () => void;
}

export function useDocumentViewModel(): DocumentDetailState & DocumentDetailActions {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const loadDocument = useCallback(async (docId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocument(docId);
      setDocument(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const startReview = useCallback(() => {
    setIsReviewing(true);
  }, []);
  
  const cancelReview = useCallback(() => {
    setIsReviewing(false);
  }, []);
  
  const approve = useCallback(async () => {
    if (!document) return;
    
    try {
      await documentService.reviewDocument(document.id, { status: 'approved' });
      await loadDocument(document.id);
      setIsReviewing(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [document, loadDocument]);
  
  const reject = useCallback(async (observations: string) => {
    if (!document) return;
    
    if (!observations || observations.length < 10) {
      setError('Debes proporcionar una observación detallada');
      throw new Error('Observación requerida');
    }
    
    try {
      await documentService.reviewDocument(document.id, { 
        status: 'rejected', 
        observations 
      });
      await loadDocument(document.id);
      setIsReviewing(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [document, loadDocument]);
  
  const requestChanges = useCallback(async (observations: string) => {
    if (!document) return;
    
    if (!observations || observations.length < 10) {
      setError('Debes proporcionar una observación detallada');
      throw new Error('Observación requerida');
    }
    
    try {
      await documentService.reviewDocument(document.id, { 
        status: 'observed', 
        observations 
      });
      await loadDocument(document.id);
      setIsReviewing(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [document, loadDocument]);
  
  return {
    document,
    loading,
    error,
    isReviewing,
    loadDocument,
    approve,
    reject,
    requestChanges,
    startReview,
    cancelReview
  };
}
```

## Reglas para ViewModels

### DO ✅
- Usar `useState` para estado local
- Usar `useCallback` para handlers
- Llamar a Services (no a API directamente)
- Validar inputs antes de enviar
- Manejar loading/error states
- Retornar funciones limpias y memorizadas

### DON'T ❌
- No usar `useEffect` para sincronizar con props (usar controlled)
- No mutar objetos/arrays directamente
- No importar componentes
- No hacer side effects sin cleanup
- No usar setState en loops o render

## Testing de ViewModels

```typescript
// viewmodels/__tests__/useLoginViewModel.test.ts

import { renderHook, act } from '@testing-library/react';
import { useLoginViewModel } from '../useLoginViewModel';
import { AuthProvider } from '../useAuthViewModel';

describe('useLoginViewModel', () => {
  it('should update form data', () => {
    const { result } = renderHook(() => useLoginViewModel(), {
      wrapper: AuthProvider
    });
    
    act(() => {
      result.current.setControlNumber('201912345');
    });
    
    expect(result.current.formData.controlNumber).toBe('201912345');
  });
  
  it('should validate empty fields on submit', async () => {
    const { result } = renderHook(() => useLoginViewModel(), {
      wrapper: AuthProvider
    });
    
    await act(async () => {
      await result.current.submit();
    });
    
    expect(result.current.error).toBe('Ingresa tu número de control');
  });
});
```

---

**Ver también:**
- [01. Estructura de Carpetas](./01-folder-structure.md) - Organización
- [03. Componentes de Vista](./03-view-components.md) - Componentes React
