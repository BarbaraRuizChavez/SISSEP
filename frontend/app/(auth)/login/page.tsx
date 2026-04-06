'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth }   from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [controlNumber, setControl] = useState('');
  const [password,      setPass]    = useState('');
  const [role,          setRole]    = useState<'estudiante' | 'encargado'>('estudiante');
  const [error,         setError]   = useState('');
  const [loading,       setLoading] = useState(false);

  async function handleSubmit() {
    if (!controlNumber || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      await login(controlNumber, password);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#111113]"
          style={{ backgroundImage: 'linear-gradient(#1a1a22 1px,transparent 1px),linear-gradient(90deg,#1a1a22 1px,transparent 1px)', backgroundSize:'40px 40px' }}>
      <div className="w-full max-w-md bg-[#1a1a1e] border border-[#333340] rounded-2xl p-10 shadow-2xl animate-fade-up">
        <h1 className="text-xl font-bold text-center text-white mb-8">Iniciar Sesión</h1>

        <label className="block text-xs font-bold uppercase tracking-widest text-[#8888a8] mb-1.5">Usuario</label>
        <input className="w-full bg-[#222228] border border-[#333340] rounded-lg text-white px-4 py-3 mb-4 outline-none focus:border-indigo-500 transition"
               placeholder="Ingresa tu usuario" value={controlNumber}
               onChange={e => setControl(e.target.value)} />

        <label className="block text-xs font-bold uppercase tracking-widest text-[#8888a8] mb-1.5">Contraseña</label>
        <input type="password"
               className="w-full bg-[#222228] border border-[#333340] rounded-lg text-white px-4 py-3 mb-5 outline-none focus:border-indigo-500 transition"
               placeholder="Ingresa tu contraseña" value={password}
               onChange={e => setPass(e.target.value)}
               onKeyDown={e => e.key==='Enter' && handleSubmit()} />

        <p className="text-xs font-bold uppercase tracking-widest text-[#8888a8] mb-2">Selecciona tu rol</p>
        <div className="flex gap-3 mb-6">
          {(['estudiante','encargado'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                role===r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#222228] border-[#333340] text-[#8888a8] hover:border-indigo-500 hover:text-indigo-400'}`}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-60">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <div className="mt-4 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-3 text-center leading-relaxed">
          En caso de estudiante, el usuario es el número de control<br />y la contraseña es la misma que SICENET
        </div>
      </div>
    </main>
  );
}
