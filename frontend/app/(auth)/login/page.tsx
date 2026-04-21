'use client';
import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/context/AuthContext';
import { UserRole }  from '@/types';
import Link          from 'next/link';

export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();

  const [control,  setControl]  = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<UserRole>('estudiante');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!control.trim() || !password) {
      setError('Ingresa tu usuario y contrasena.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(control.trim(), password);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <p className="auth-logo-text">SISSEP<span>.</span></p>
          <p className="auth-logo-subtitle">Sistema de Seguimiento de Servicios Escolares</p>
        </div>

        <div className="field">
          <label htmlFor="control">Usuario</label>
          <input
            id="control"
            className="input"
            placeholder="Numero de control o usuario"
            value={control}
            onChange={(e) => setControl(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoComplete="current-password"
          />
        </div>

        <div className="field">
          <label>Rol</label>
          <div className="auth-role-row">
            {(['estudiante', 'encargado'] as UserRole[]).map((r) => (
              <button
                key={r}
                className={`role-btn${role === r ? ' active' : ''}`}
                onClick={() => setRole(r)}
                type="button"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary btn-full"
          onClick={handleLogin}
          disabled={loading}
          type="button"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="auth-hint">
          Estudiantes: usa tu numero de control como usuario y la misma contrasena de SICENET.
        </div>

        <div className="auth-link">
          <Link href="/register">Registrar nuevo usuario</Link>
        </div>
      </div>
    </main>
  );
}
