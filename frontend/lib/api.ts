const BASE    = process.env.NEXT_PUBLIC_API_URL     || 'http://localhost:4000/api/v1';
const STORAGE = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4000';

// Construye la URL completa para servir un archivo guardado en el backend
export const storageUrl = (filePath: string): string => `${STORAGE}/${filePath}`;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sissep_token');
}

async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message || 'Error desconocido del servidor');
  return json.data as T;
}

export const api = {
  get:   <T>(endpoint: string)                   => request<T>(endpoint),
  post:  <T>(endpoint: string, body: unknown)    => request<T>(endpoint, { method: 'POST',  body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown)    => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
};

// Para subir archivos (multipart/form-data, sin Content-Type manual)
export async function uploadFile(endpoint: string, formData: FormData): Promise<unknown> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    formData,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  return json.data;
}
