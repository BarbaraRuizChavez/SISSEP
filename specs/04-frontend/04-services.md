# 4.4 Servicios (Comunicación con API)

## Resumen

Especificación de los servicios que manejan la comunicación HTTP con el backend. Los servicios son la capa que separa la lógica de UI de las llamadas a la API.

## Estructura de Servicios

```
services/
├── api.ts                    # Configuración base de Axios
├── api.types.ts              # Tipos para requests/responses
├── auth.ts                   # Autenticación
├── documents.ts              # Documentos
├── users.ts                  # Usuarios
├── uploads.ts                # Upload de archivos
└── index.ts                  # Barrel exports
```

## 1. Configuración Base de API

```typescript
// services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Agregar token
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('token') 
          : null;
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Request ID para trazabilidad
        config.headers['X-Request-Id'] = this.generateRequestId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Manejo de errores y refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Token expirado (401)
        if (error.response?.status === 401 && 
            !originalRequest.headers?.['X-Retry-With-Refresh']) {
          
          try {
            // Intentar refresh token
            const newToken = await this.refreshAccessToken();
            
            // Reintentar request original
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['X-Retry-With-Refresh'] = 'true';
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh falló, hacer logout
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Transformar errores
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshAccessToken(): Promise<string> {
    // Si ya hay un refresh en progreso, esperar ese
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { token } = response.data.data;
        localStorage.setItem('token', token);
        
        return token;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      // Error del servidor
      const data = error.response.data as any;
      const message = data?.error?.message || 'Error del servidor';
      const code = data?.error?.code || 'SERVER_ERROR';
      
      const transformedError = new Error(message) as any;
      transformedError.code = code;
      transformedError.status = error.response.status;
      transformedError.details = data?.error?.details;
      
      return transformedError;
    }
    
    if (error.request) {
      // No hubo respuesta
      const networkError = new Error('Error de conexión. Verifica tu internet.') as any;
      networkError.code = 'NETWORK_ERROR';
      return networkError;
    }
    
    return error;
  }

  private clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Métodos públicos
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Upload de archivos
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });

    return response.data;
  }

  // Download de archivos
  async downloadFile(url: string): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
```

## 2. Servicio de Autenticación

```typescript
// services/auth.ts

import { apiService } from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  ApiResponse 
} from '@/types';

export const authService = {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<ApiResponse<LoginResponse>>(
      '/auth/login', 
      credentials
    );
    
    // Guardar tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout', {});
    } finally {
      this.clearStorage();
    }
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Validar token actual
   */
  async validateToken(): Promise<boolean> {
    try {
      await apiService.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    // Cerrar otras sesiones (opcional)
    // Forzar re-login
  },

  /**
   * Limpiar storage
   */
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};

export default authService;
```

## 3. Servicio de Documentos

```typescript
// services/documents.ts

import { apiService } from './api';
import { 
  Document, 
  DocumentStatus,
  ProgramType, 
  StudentProgress, 
  ApiResponse 
} from '@/types';

interface GetDocumentsParams {
  programType?: ProgramType;
  studentId?: string;
  status?: DocumentStatus;
  category?: string;
}

interface ReviewRequest {
  status: 'approved' | 'rejected' | 'observed';
  observations?: string;
}

export const documentService = {
  /**
   * Obtener documentos del estudiante
   */
  async getDocuments(params: GetDocumentsParams): Promise<Document[]> {
    const queryParams = new URLSearchParams();
    
    if (params.programType) queryParams.append('programType', params.programType);
    if (params.studentId) queryParams.append('studentId', params.studentId);
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    
    const response = await apiService.get<ApiResponse<Document[]>>(
      `/documents?${queryParams.toString()}`
    );
    
    return response.data;
  },

  /**
   * Obtener un documento específico
   */
  async getDocument(id: string): Promise<Document> {
    const response = await apiService.get<ApiResponse<Document>>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Subir archivo a un documento
   */
  async uploadDocument(
    documentId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const response = await apiService.uploadFile<ApiResponse<Document>>(
      `/documents/${documentId}/upload`,
      file,
      onProgress
    );
    
    return response.data;
  },

  /**
   * Revisar un documento (aprobar/rechazar)
   */
  async reviewDocument(
    documentId: string, 
    review: ReviewRequest
  ): Promise<Document> {
    const response = await apiService.patch<ApiResponse<Document>>(
      `/documents/${documentId}/review`,
      review
    );
    
    return response.data;
  },

  /**
   * Obtener progreso de estudiantes (para admin)
   */
  async getProgress(programType: ProgramType): Promise<StudentProgress[]> {
    const response = await apiService.get<ApiResponse<StudentProgress[]>>(
      `/documents/progress?programType=${programType}`
    );
    
    return response.data;
  },

  /**
   * Descargar archivo
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    return apiService.downloadFile(`/documents/${documentId}/download`);
  },

  /**
   * Obtener URL para ver documento
   */
  getDocumentViewUrl(documentId: string): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/view`;
  }
};

export default documentService;
```

## 4. Servicio de Usuarios

```typescript
// services/users.ts

import { apiService } from './api';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest,
  PaginatedResponse 
} from '@/types';

interface GetUsersParams {
  page?: number;
  perPage?: number;
  role?: string;
  search?: string;
  isActive?: boolean;
}

export const userService = {
  /**
   * Listar usuarios
   */
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.perPage) queryParams.append('perPage', params.perPage.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const response = await apiService.get<PaginatedResponse<User>>(
      `/users?${queryParams.toString()}`
    );
    
    return response;
  },

  /**
   * Obtener un usuario
   */
  async getUser(id: string): Promise<User> {
    const response = await apiService.get<{ data: User }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Crear usuario (admin)
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiService.post<{ data: User }>('/users', userData);
    return response.data;
  },

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await apiService.put<{ data: User }>(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Eliminar/desactivar usuario
   */
  async deleteUser(id: string, hard: boolean = false): Promise<void> {
    await apiService.delete(`/users/${id}?hard=${hard}`);
  },

  /**
   * Activar usuario desactivado
   */
  async activateUser(id: string, newPassword: string): Promise<User> {
    const response = await apiService.post<{ data: User }>(
      `/users/${id}/activate`,
      { newPassword }
    );
    return response.data;
  }
};

export default userService;
```

## 5. Tipos de Servicios

```typescript
// services/api.types.ts

// Respuesta estándar de la API
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    timestamp: string;
    requestId: string;
    pagination: {
      page: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// Error de API
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

## 6. Barrel Export

```typescript
// services/index.ts

export { apiService } from './api';
export { authService } from './auth';
export { documentService } from './documents';
export { userService } from './users';

export * from './api.types';
```

## Uso en ViewModels

```typescript
// viewmodels/useLoginViewModel.ts

import { authService } from '@/services/auth';

export function useLoginViewModel() {
  const submit = async () => {
    try {
      const result = await authService.login({
        controlNumber: formData.controlNumber,
        password: formData.password,
        role: formData.role
      });
      // Éxito
    } catch (error: any) {
      // Manejo de error específico
      if (error.code === 'INVALID_CREDENTIALS') {
        setError('Credenciales incorrectas');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Error de conexión');
      } else {
        setError(error.message);
      }
    }
  };
}
```

## Testing de Servicios

```typescript
// services/__tests__/auth.test.ts

import { authService } from '../auth';
import { apiService } from '../api';

jest.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should store tokens on login', async () => {
    const mockResponse = {
      data: {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', name: 'Test' }
      }
    };
    
    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);
    
    await authService.login({
      controlNumber: '201912345',
      password: 'password',
      role: 'estudiante'
    });
    
    expect(localStorage.getItem('token')).toBe('access-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user));
  });

  it('should clear storage on logout', async () => {
    localStorage.setItem('token', 'test');
    
    (apiService.post as jest.Mock).mockResolvedValue({});
    
    await authService.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
  });
});
```

---

**Ver también:**
- [02. ViewModels](./02-viewmodels.md) - Uso de servicios en ViewModels
- [03. Componentes](./03-view-components.md) - Componentes UI
