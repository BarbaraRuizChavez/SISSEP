# 6.4 Accesibilidad (WCAG)

## Resumen

Este documento especifica los requerimientos de accesibilidad de SISSEP para cumplir con WCAG 2.1 Level AA, asegurando que el sistema sea usable por personas con discapacidades.

## Niveles de Conformidad WCAG

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVELES WCAG 2.1                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level A (Básico)                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│  • Text alternatives para imágenes                              │
│  • Contenido accesible por teclado                            │
│  • No usar color como único medio de información              │
│                                                                 │
│  Level AA (Intermedio) ← OBJETIVO DE SISSEP                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│  • Contraste mínimo 4.5:1 para texto normal                   │
│  • Texto redimensionable hasta 200%                           │
│  • Múltiples formas de navegación                             │
│  • Mensajes de error claros                                   │
│                                                                 │
│  Level AAA (Avanzado)                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│  • Contraste 7:1 para texto normal                            │
│  • Soporte para lenguaje de señas                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Checklist WCAG 2.1 AA

### 1. Perceptible (Perceivable)

#### 1.1 Alternativas de Texto
- [ ] Todas las imágenes tienen `alt` descriptivo
- [ ] Iconos tienen aria-label o texto oculto
- [ ] Contenido no textual tiene descripción

```tsx
// ✅ Correcto
<img src="logo.png" alt="SISSEP - Sistema de Servicio Social" />
<button aria-label="Cerrar sesión">
  <LogoutIcon />
</button>

// ❌ Incorrecto
<img src="logo.png" />
<button><LogoutIcon /></button>
```

#### 1.2 Contraste de Color

```css
/* Verificación de contraste */
/* Texto normal: mínimo 4.5:1 */
/* Texto grande (18pt+): mínimo 3:1 */

/* ✅ Correcto - Contraste adecuado */
.text-primary { color: #E2E8F0; } /* slate-200 sobre slate-900 */
/* Ratio: ~11:1 ✓ */

/* ✅ Correcto - StatusPill */
.status-approved { 
  color: #4ADE80; /* green-400 */
  background: rgba(74, 222, 128, 0.15); /* 15% opacity */
}
```

| Elemento | Color de Texto | Color de Fondo | Ratio | Estado |
|----------|----------------|----------------|-------|--------|
| Texto principal | #E2E8F0 | #0F172A | 11.2:1 | ✅ |
| Texto secundario | #94A3B8 | #0F172A | 6.3:1 | ✅ |
| Enlaces | #818CF8 | #0F172A | 5.8:1 | ✅ |
| Error | #F87171 | #0F172A | 7.4:1 | ✅ |

#### 1.3 Redimensionamiento

```css
/* ✅ Usar unidades relativas */
html { font-size: 16px; }

.component {
  padding: 1rem;        /* rem = relativo a root */
  font-size: 0.875rem;  /* No px */
  line-height: 1.5;      /* Unitless */
}

/* ✅ Media queries para zoom */
@media (min-width: 200%) {
  /* Ajustes cuando el usuario hace zoom */
}
```

### 2. Operable (Operable)

#### 2.1 Accesible por Teclado

```tsx
// ✅ Todos los elementos interactivos enfocables
<button className="focus:outline-none focus:ring-2 focus:ring-indigo-500">
  Guardar
</button>

// ✅ Orden de tabulación lógico
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    // Mantener focus trap en modales
  }
  if (e.key === 'Enter') {
    // Activar on click
  }
  if (e.key === 'Escape') {
    // Cerrar modal/dropdown
  }
};
```

#### 2.2 Sin Tiempo Límite

```tsx
// ✅ No hay auto-logout sin advertencia
// Si hay sesión expirada:
const SessionManager = () => {
  useEffect(() => {
    const warning = setTimeout(() => {
      toast.warning('Tu sesión expira en 2 minutos');
    }, SESSION_WARNING_TIME);
    
    const logout = setTimeout(() => {
      auth.logout();
    }, SESSION_EXPIRE_TIME);
    
    return () => {
      clearTimeout(warning);
      clearTimeout(logout);
    };
  }, []);
};
```

#### 2.3 Navegación Consistente

```tsx
// ✅ Skip link para saltar navegación
const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded"
  >
    Saltar al contenido principal
  </a>
);

// ✅ Landmarks semánticos
<header></nav>...</nav></header>
<main id="main-content">...</main>
<footer>...</footer>
```

### 3. Comprensible (Understandable)

#### 3.1 Idioma de la Página

```html
<!-- ✅ Declarar idioma -->
<html lang="es">

<!-- ✅ Cambios de idioma inline -->
<p>
  Texto en español <span lang="en">English text</span> español
</p>
```

#### 3.2 Etiquetas y Instrucciones

```tsx
// ✅ Asociar labels con inputs
<label htmlFor="email">Correo electrónico</label>
<input id="email" type="email" aria-required="true" />

// ✅ Describir errores
<input 
  aria-describedby={error ? 'email-error' : undefined}
  aria-invalid={!!error}
/>
{error && (
  <span id="email-error" role="alert" className="text-red-400">
    {error}
  </span>
)}
```

#### 3.3 Navegación Predictible

```tsx
// ✅ Enlaces identificables
<a href="/help" className="underline text-indigo-400 hover:text-indigo-300">
  Ayuda
</a>

// ✅ Focus visible
*:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}
```

### 4. Robusto (Robust)

#### 4.1 Compatibilidad con AT (Assistive Technology)

```tsx
// ✅ Roles ARIA cuando el HTML semántico no es suficiente
<div role="alert" className="bg-red-500/15 border border-red-500 p-4 rounded">
  Error al guardar los cambios
</div>

// ✅ Estados ARIA
<button aria-expanded={isOpen} aria-controls="menu">
  Menú
</button>
<ul id="menu" hidden={!isOpen}>...</ul>

// ✅ Live regions para actualizaciones
<div aria-live="polite" aria-atomic="true">
  {notification && <span>{notification}</span>}
</div>
```

## Componentes Accesibles

### Button Accesible

```tsx
// components/ui/ButtonAccessible.tsx

import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const ButtonAccessible = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary' && 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500'}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">Cargando... </span>
          <Spinner aria-hidden="true" />
          {children}
        </>
      ) : children}
    </button>
  );
});

ButtonAccessible.displayName = 'ButtonAccessible';
```

### Modal Accesible

```tsx
// components/ui/ModalAccessible.tsx

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ModalAccessible = ({ isOpen, onClose, title, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Guardar focus previo
      previousFocus.current = document.activeElement;
      
      // Focus en el modal
      modalRef.current?.focus();
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusable?.length) return;
        
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      
      // Cerrar con Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      
      document.addEventListener('keydown', handleTab);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleTab);
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        (previousFocus.current as HTMLElement)?.focus();
      };
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4"
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">{title}</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Cerrar modal"
        >
          ×
        </button>
        
        {children}
      </div>
    </div>,
    document.body
  );
};
```

## Testing de Accesibilidad

### Herramientas

```bash
# axe-core para tests automatizados
npm install @axe-core/react

# Lighthouse CI
npm install @lhci/cli

# Pa11y para verificación de páginas
npm install pa11y
```

### Tests con Jest + Testing Library

```tsx
// __tests__/accessibility.test.tsx

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from '@/components/forms/LoginForm';

expect.extend(toHaveNoViolations);

describe('LoginForm accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <LoginForm 
        controlNumber=""
        password=""
        role="estudiante"
        onControlNumberChange={() => {}}
        onPasswordChange={() => {}}
        onRoleChange={() => {}}
        onSubmit={() => {}}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have associated labels for inputs', () => {
    render(/* ... */);
    
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });
  
  it('should be navigable by keyboard', () => {
    render(/* ... */);
    
    const button = screen.getByRole('button', { name: /ingresar/i });
    button.focus();
    
    expect(document.activeElement).toBe(button);
  });
});
```

### Checklist Manual

- [ ] Navegar toda la app usando solo teclado (Tab, Shift+Tab, Enter, Escape, Flechas)
- [ ] Verificar que el orden de tabulación es lógico
- [ ] Verificar que el focus siempre es visible
- [ ] Usar screen reader (NVDA/VoiceOver) para navegar
- [ ] Verificar que todos los elementos tienen nombre accesible
- [ ] Verificar contraste de colores con herramienta
- [ ] Hacer zoom al 200% y verificar que la app es usable
- [ ] Verificar que no hay contenido que parpadee más de 3 veces por segundo

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Accessibility Insights](https://accessibilityinsights.io/)

---

**Ver también:**
- [01. Matriz de Calidad](./01-quality-matrix.md) - Atributos generales
- [03. Seguridad](./03-security.md) - Seguridad complementaria
