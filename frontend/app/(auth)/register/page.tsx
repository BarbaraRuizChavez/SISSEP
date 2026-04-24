'use client';
import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import { api }       from '@/lib/api';
import { UserRole }  from '@/types';
import Link          from 'next/link';

const CARRERAS = [
  'Ingenieria en Sistemas Computacionales',
  'Ingenieria en Electronica',
  'Ingenieria en Mecatronica',
  'Ingenieria Industrial',
  'Ingenieria en Administracion',
  'Ingenieria Quimica',
  'Ingenieria en Gestion Empresarial',
  'Licenciatura en Administracion',
];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    controlNumber:     '',
    name:              '',
    password:          '',
    confirmPassword:   '',
    role:              'estudiante' as UserRole,
    carrera:           '',
    encargadoSection:  '',
  });

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    setError('');
    setSuccess('');

    if (!form.controlNumber.trim()) { setError('El numero de control es requerido.'); return; }
    if (!form.name.trim())          { setError('El nombre es requerido.'); return; }
    if (form.password.length < 6)   { setError('La contrasena debe tener al menos 6 caracteres.'); return; }
    if (form.password !== form.confirmPassword) { setError('Las contrasenas no coinciden.'); return; }
    if (form.role === 'estudiante' && !form.carrera) { setError('Selecciona tu carrera.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        controlNumber:    form.controlNumber.trim(),
        name:             form.name.trim(),
        password:         form.password,
        role:             form.role,
        carrera:          form.carrera,
        encargadoSection: form.encargadoSection,
      });
      setSuccess('Usuario registrado correctamente. Puedes iniciar sesion.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <div className="auth-logo">
          <p className="auth-logo-text">SISSEP<span style={{ color: '#6366f1' }}>.</span></p>
          <p className="auth-logo-subtitle">Registro de usuario</p>
        </div>

        <div className="field">
          <label>Rol</label>
          <div className="auth-role-row">
            {(['estudiante', 'encargado'] as UserRole[]).map((r) => (
              <button
                key={r}
                className={`role-btn${form.role === r ? ' active' : ''}`}
                onClick={() => set('role', r)}
                type="button"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{form.role === 'estudiante' ? 'Numero de control' : 'Usuario'}</label>
          <input
            className="input"
            placeholder={form.role === 'estudiante' ? 'Ej: 20240123' : 'Ej: admin'}
            value={form.controlNumber}
            onChange={(e) => set('controlNumber', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Nombre completo</label>
          <input
            className="input"
            placeholder="Nombre y apellidos"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        {form.role === 'estudiante' && (
          <div className="field">
            <label>Carrera</label>
            <select
              className="input"
              value={form.carrera}
              onChange={(e) => set('carrera', e.target.value)}
            >
              <option value="">Selecciona tu carrera</option>
              {CARRERAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {form.role === 'encargado' && (
          <div className="field">
            <label>Seccion a cargo</label>
            <input
              className="input"
              placeholder="Ej: ISC, IM, IA"
              value={form.encargadoSection}
              onChange={(e) => set('encargadoSection', e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label>Contrasena</label>
          <input
            type="password"
            className="input"
            placeholder="Minimo 6 caracteres"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Confirmar contrasena</label>
          <input
            type="password"
            className="input"
            placeholder="Repite la contrasena"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          />
        </div>

        {error   && <div className="auth-error">{error}</div>}
        {success && (
          <div style={{
            marginBottom: 14, padding: '10px 14px',
            background: 'var(--green-dim)', border: '1px solid var(--green-border)',
            borderRadius: 6, fontSize: 12, color: 'var(--green)',
          }}>
            {success}
          </div>
        )}

        <button
          className="btn btn-primary btn-full"
          onClick={handleRegister}
          disabled={loading}
          type="button"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <div className="auth-link">
          Ya tienes cuenta? <Link href="/login">Inicia sesion</Link>
        </div>
      </div>
    </main>
  );
}
