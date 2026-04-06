'use client';
import { useEffect, useState } from 'react';
import { api }                 from '@/lib/api';
import StatusPill              from '@/components/ui/StatusPill';
import Spinner                 from '@/components/ui/Spinner';
import { DocumentRecord, ProgramType } from '@/types';

interface StudentProgress {
  _id:      string;
  total:    number;
  approved: number;
  pending:  number;
  rejected: number;
}

export default function AdminPage() {
  const [section,   setSection]   = useState<ProgramType>('servicio_social');
  const [progress,  setProgress]  = useState<StudentProgress[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState<{ studentId: string; docs: DocumentRecord[] } | null>(null);
  const [search,    setSearch]    = useState('');

  async function fetchProgress() {
    setLoading(true);
    try {
      const data = await api.get<StudentProgress[]>(`/documents/progress?programType=${section}`);
      setProgress(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchProgress(); }, [section]);

  async function openDetail(studentId: string) {
    const docs = await api.get<DocumentRecord[]>(`/documents?programType=${section}&studentId=${studentId}`);
    setDetail({ studentId, docs });
  }

  async function review(docId: string, status: 'approved' | 'rejected', obs?: string) {
    await api.patch(`/documents/${docId}/review`, { status, observation: obs || '' });
    if (detail) openDetail(detail.studentId);
  }

  const filtered = progress.filter(p => p._id.includes(search));

  if (detail) return (
    <div className="flex h-[calc(100vh-52px)]">
      <aside className="w-56 bg-[#1a1a1e] border-r border-[#333340] p-4 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#55556a] mb-3">Panel de Control</p>
        {(['servicio_social','residencias'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-md mb-1 w-full transition ${
              section===s ? 'bg-indigo-600 text-white' : 'text-[#8888a8] hover:bg-[#222228] hover:text-white'}`}>
            {s==='servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <button onClick={() => setDetail(null)} className="text-sm text-[#8888a8] hover:text-white mb-5 flex items-center gap-2">← Volver</button>
        <h1 className="text-xl font-bold mb-1">Expediente – {detail.studentId}</h1>
        <p className="text-sm text-[#8888a8] mb-7">{section==='servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#333340]">
              {['Categoría','Estado','Archivo','Acciones'].map(h=>(
                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#55556a] pb-3 px-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detail.docs.map(doc => (
              <tr key={doc._id} className="border-b border-[#1e1e26] hover:bg-[#1a1a1e] transition">
                <td className="px-3 py-3 font-semibold text-sm">{doc.category}</td>
                <td className="px-3 py-3"><StatusPill status={doc.status} /></td>
                <td className="px-3 py-3 text-[11px] text-[#8888a8]">{doc.fileName || '—'}</td>
                <td className="px-3 py-3">
                  {doc.fileName && (
                    <div className="flex gap-2">
                      <button onClick={() => review(doc._id, 'approved')}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-md bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white transition">✓</button>
                      <button onClick={() => {
                        const obs = window.prompt('Observación para el estudiante:') || '';
                        review(doc._id, 'rejected', obs);
                      }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition">✗</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <aside className="w-56 bg-[#1a1a1e] border-r border-[#333340] p-4 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#55556a] mb-3">Panel de Control</p>
        {(['servicio_social','residencias'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-md mb-1 w-full transition ${
              section===s ? 'bg-indigo-600 text-white' : 'text-[#8888a8] hover:bg-[#222228] hover:text-white'}`}>
            {s==='servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
          </button>
        ))}
        <div className="mt-6 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#55556a] mb-2">Estadísticas</p>
          <div className="flex justify-between text-xs text-[#8888a8]"><span>Total:</span><span className="text-indigo-400 font-bold">{progress.length}</span></div>
          <div className="flex justify-between text-xs text-[#8888a8]"><span>Pendientes:</span><span className="text-yellow-400 font-bold">{progress.reduce((a,p)=>a+p.pending,0)}</span></div>
          <div className="flex justify-between text-xs text-[#8888a8]"><span>Aprobados:</span><span className="text-green-400 font-bold">{progress.reduce((a,p)=>a+p.approved,0)}</span></div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-xl font-bold mb-1">Lista de Estudiantes</h1>
        <p className="text-sm text-[#8888a8] mb-6">Revisa y gestiona los documentos enviados</p>
        <input className="w-full bg-[#1a1a1e] border border-[#333340] rounded-lg text-white px-4 py-2.5 mb-5 text-sm outline-none focus:border-indigo-500 transition"
               placeholder="🔍  Buscar por número de control..." value={search} onChange={e=>setSearch(e.target.value)} />
        {loading ? <Spinner /> : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#333340]">
                {['Número de Control','Documentos','Aprobados','Pendientes','Ver'].map(h=>(
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#55556a] pb-3 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = s.total ? Math.round(s.approved/s.total*100) : 0;
                return (
                  <tr key={s._id} className="border-b border-[#1e1e26] hover:bg-[#1a1a1e] transition cursor-pointer" onClick={()=>openDetail(s._id)}>
                    <td className="px-3 py-3.5 font-mono text-sm text-indigo-400">📄 {s._id}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#222228] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: pct+'%' }} />
                        </div>
                        <span className="text-[11px] text-[#8888a8] font-mono">{s.approved}/{s.total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-green-400 font-bold text-sm">{s.approved}</td>
                    <td className="px-3 py-3.5 text-yellow-400 font-bold text-sm">{s.pending}</td>
                    <td className="px-3 py-3.5">
                      <span className="text-[11px] font-bold text-indigo-400 hover:underline">Ver expediente →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
