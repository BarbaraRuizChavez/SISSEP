# 4.3 Componentes de Vista (React Components)

## Resumen

Especificación de los componentes React de presentación. Estos componentes son "tontos" - solo renderizan UI basada en props y emiten eventos.

## Principios de Diseño

### Componentes Presentacionales vs ViewModels

```typescript
// ✅ Componente Presentacional - Solo recibe props y renderiza
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled, loading }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant}`}
    >
      {loading ? <Spinner size="small" /> : label}
    </button>
  );
}

// ❌ Componente con lógica de negocio
export function LoginButton() {
  const { login, loading } = useAuthViewModel(); // No!
  return <button onClick={login}>Login</button>;
}
```

## Componentes UI Base

### 1. Button

```typescript
// components/ui/Button.tsx

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClassName}
    >
      {loading && (
        <span className="mr-2">
          <Spinner size="small" />
        </span>
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
}
```

### 2. Input

```typescript
// components/ui/Input.tsx

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        disabled={disabled}
        className={`
          w-full bg-gray-800 border rounded-lg text-white px-4 py-3
          outline-none transition
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-gray-600 focus:border-indigo-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
```

### 3. Spinner

```typescript
// components/ui/Spinner.tsx

interface SpinnerProps {
  size?: 'xs' | 'small' | 'medium' | 'large';
  color?: 'indigo' | 'white' | 'gray';
}

export function Spinner({ size = 'medium', color = 'indigo' }: SpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-4'
  };
  
  const colorClasses = {
    indigo: 'border-indigo-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-500 border-t-transparent'
  };
  
  return (
    <div
      className={`
        inline-block rounded-full animate-spin
        ${sizeClasses[size]}
        ${colorClasses[color]}
      `}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
```

### 4. StatusPill

```typescript
// components/ui/StatusPill.tsx

import { DocumentStatus } from '@/types';

interface StatusPillProps {
  status: DocumentStatus;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string; dot: string }> = {
  draft: {
    label: 'Sin subir',
    className: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    dot: 'bg-gray-400'
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400'
  },
  under_review: {
    label: 'En revisión',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400'
  },
  approved: {
    label: 'Aprobado',
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot: 'bg-green-400'
  },
  rejected: {
    label: 'Rechazado',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400'
  },
  observed: {
    label: 'Observado',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400'
  }
};

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full 
        text-xs font-semibold border
        ${config.className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
```

### 5. Table

```typescript
// components/ui/Table.tsx

import { ReactNode } from 'react';

interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
  }>;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T extends { id: string }>({ 
  data, 
  columns, 
  onRowClick,
  emptyMessage = 'No hay datos',
  loading = false
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-gray-700">
          {columns.map(col => (
            <th 
              key={String(col.key)}
              className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-3 px-3"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr 
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className={`
              border-b border-gray-800
              ${onRowClick ? 'cursor-pointer hover:bg-gray-800' : ''}
            `}
          >
            {columns.map(col => (
              <td key={String(col.key)} className="px-3 py-3.5">
                {col.render 
                  ? col.render(item)
                  : String(item[col.key as keyof T] ?? '')
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Componentes de Formularios

### 6. LoginForm

```typescript
// components/forms/LoginForm.tsx

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface LoginFormProps {
  controlNumber: string;
  password: string;
  role: 'estudiante' | 'encargado';
  error?: string | null;
  loading?: boolean;
  onControlNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (role: 'estudiante' | 'encargado') => void;
  onSubmit: () => void;
}

export function LoginForm({
  controlNumber,
  password,
  role,
  error,
  loading = false,
  onControlNumberChange,
  onPasswordChange,
  onRoleChange,
  onSubmit
}: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-3 mb-6">
        {(['estudiante', 'encargado'] as const).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange(r)}
            className={`
              flex-1 py-2.5 rounded-lg text-sm font-semibold border transition
              ${role === r 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400'
              }
            `}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      
      <Input
        label="Usuario"
        placeholder="Ingresa tu número de control"
        value={controlNumber}
        onChange={e => onControlNumberChange(e.target.value)}
        disabled={loading}
        error={error}
      />
      
      <Input
        type="password"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={e => onPasswordChange(e.target.value)}
        disabled={loading}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
      />
      
      <div className="mt-4 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3 text-center">
        En caso de estudiante, el usuario es el número de control<br />
        y la contraseña es la misma que SICENET
      </div>
      
      <Button 
        type="submit" 
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
}
```

## Componentes Específicos de Dominio

### 7. DocumentList (Estudiante)

```typescript
// components/documents/DocumentList.tsx

import { Document } from '@/types';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';

interface DocumentListProps {
  documents: Document[];
  onUpload: (doc: Document) => void;
  loading?: boolean;
}

export function DocumentList({ documents, onUpload, loading }: DocumentListProps) {
  const columns = [
    {
      key: 'category',
      header: 'Categoría',
      render: (doc: Document) => (
        <span className="font-semibold text-sm">{doc.category.name}</span>
      )
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (doc: Document) => (
        <span className="text-gray-400 text-xs">{doc.category.description}</span>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (doc: Document) => <StatusPill status={doc.status} />
    },
    {
      key: 'observations',
      header: 'Observaciones',
      render: (doc: Document) => {
        const lastObs = doc.observations[doc.observations.length - 1];
        return lastObs ? (
          <span className="text-xs text-gray-400">{lastObs.text.substring(0, 50)}...</span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Archivos',
      render: (doc: Document) => {
        if (doc.fileUrl) {
          return <span className="text-xs text-gray-400">📄 {doc.fileName}</span>;
        }
        return (
          <Button 
            size="sm" 
            onClick={() => onUpload(doc)}
          >
            ⬆ Subir Archivo
          </Button>
        );
      }
    }
  ];
  
  return (
    <Table
      data={documents}
      columns={columns}
      loading={loading}
      emptyMessage="No hay documentos para mostrar"
    />
  );
}
```

### 8. StudentProgressList (Admin)

```typescript
// components/documents/StudentProgressList.tsx

import { StudentProgress } from '@/types';
import { Table } from '@/components/ui/Table';

interface StudentProgressListProps {
  students: StudentProgress[];
  onViewDetail: (studentId: string) => void;
  loading?: boolean;
}

export function StudentProgressList({ students, onViewDetail, loading }: StudentProgressListProps) {
  const columns = [
    {
      key: 'controlNumber',
      header: 'Número de Control',
      render: (s: StudentProgress) => (
        <span className="font-mono text-sm text-indigo-400">
          📄 {s.controlNumber}
        </span>
      )
    },
    {
      key: 'progress',
      header: 'Documentos',
      render: (s: StudentProgress) => {
        const pct = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {s.approved}/{s.total}
            </span>
          </div>
        );
      }
    },
    {
      key: 'approved',
      header: 'Aprobados',
      render: (s: StudentProgress) => (
        <span className="text-green-400 font-bold">{s.approved}</span>
      )
    },
    {
      key: 'pending',
      header: 'Pendientes',
      render: (s: StudentProgress) => (
        <span className="text-yellow-400 font-bold">{s.pending}</span>
      )
    },
    {
      key: 'view',
      header: '',
      render: (s: StudentProgress) => (
        <button 
          onClick={() => onViewDetail(s.studentId)}
          className="text-xs font-bold text-indigo-400 hover:underline"
        >
          Ver expediente →
        </button>
      )
    }
  ];
  
  return (
    <Table
      data={students}
      columns={columns}
      onRowClick={s => onViewDetail(s.studentId)}
      loading={loading}
      emptyMessage="No hay estudiantes registrados"
    />
  );
}
```

## Componentes de Layout

### 9. Navbar

```typescript
// components/layouts/Navbar.tsx

import { useAuthViewModel } from '@/viewmodels/useAuthViewModel';

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = 'SISSEP' }: NavbarProps) {
  const { user, logout } = useAuthViewModel();
  
  return (
    <nav className="fixed top-0 inset-x-0 h-[52px] bg-gray-900 border-b border-gray-700 flex items-center justify-between px-5 z-50">
      <span className="font-mono font-bold text-[15px] tracking-wider">
        {title}<span className="text-indigo-400">.</span>
      </span>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.name}</span>
        <button
          onClick={logout}
          className="text-xs font-bold text-red-400 border border-red-500 bg-red-500/10 px-3.5 py-1.5 rounded-md hover:bg-red-500 hover:text-white transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
```

## Testing de Componentes

```typescript
// components/ui/__tests__/Button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

**Ver también:**
- [02. ViewModels](./02-viewmodels.md) - Lógica de presentación
- [04. Servicios](./04-services.md) - Comunicación con API
