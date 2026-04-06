'use client';
import { useEffect, useState } from 'react';
import { useAuth }             from '@/context/AuthContext';
import { api, uploadFile }     from '@/lib/api';
import { DocumentRecord, ProgramType } from '@/types';
import StatusPill              from '@/components/ui/StatusPill';
import Spinner                 from '@/components/ui/Spinner';

export default function StudentPage() {
  const { user }  = useAuth();
  const [section, setSection]   = useState<ProgramType>('servicio_social');
  const [docs,    setDocs]      = useState<DocumentRecord[]>([]);
  const [loading, setLoading]   = useState(true);

  async function fetchDocs() {
    setLoading(true);
    try {
      const data = await api.get<DocumentRecord[]>(`/documents?programType=${section}`);
      setDocs(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchDocs(); }, [section]);

  async function handleUpload(doc: DocumentRecord) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,.doc,.docx,.jpg,.png';
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const fd = new FormData();
      fd.append('file',        input.files[0]);
      fd.append('category',    doc.category);
      fd.append('description', doc.description);
      fd.append('programType', section);
      try { await uploadFile('/documents/upload', fd); fetchDocs(); }
      catch (e: any) { alert(e.message); }
    };
    input.click();
  }

  const approved = docs.filter(d=>d.status==='approved').length;
  const pct = docs.length ? Math.round(approved/docs.length*100) : 0;

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a1e] border-r border-[#333340] flex flex-col p-4 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#55556a] mb-3">Sección</p>
        {(['servicio_social','residencias'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-left text-xs font-semibold px-3 py-2 rounded-md mb-1 transition ${
              section===s ? 'bg-indigo-600 text-white' : 'text-[#8888a8] hover:bg-[#222228] hover:text-white'}`}>
            {s==='servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
          </button>
        ))}

        <div className="mt-6">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold mx-auto">
            {user?.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
          </div>
          <p className="text-center text-sm font-bold mt-3 leading-snug">{user?.name}</p>
          <p className="text-center text-[11px] text-[#8888a8] mt-1">{user?.carrera}</p>

          <div className="mt-5">
            <div className="flex justify-between text-[11px] text-[#8888a8] mb-1.5">
              <span>Progreso</span><span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[#222228] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: pct+'%' }} />
            </div>
            <p className="text-[10px] text-[#55556a] text-center mt-1.5">{approved} de {docs.length} archivos</p>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-xl font-bold mb-1">Documentos Requeridos</h1>
        <p className="text-sm text-[#8888a8] mb-7">Sube todos los documentos necesarios para completar tu expediente</p>

        {loading ? <Spinner /> : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#333340]">
                {['Categoría','Descripción','Estado','Observaciones','Archivos'].map(h=>(
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#55556a] pb-3 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc._id} className="border-b border-[#1e1e26] hover:bg-[#1a1a1e] transition">
                  <td className="px-3 py-3.5 font-semibold text-sm">{doc.category}</td>
                  <td className="px-3 py-3.5 text-[#8888a8] text-xs">{doc.description}</td>
                  <td className="px-3 py-3.5"><StatusPill status={doc.status} /></td>
                  <td className="px-3 py-3.5">
                    {doc.observations.length > 0
                      ? <span className="text-[11px] text-[#8888a8]">{doc.observations[doc.observations.length-1]}</span>
                      : <span className="text-[11px] text-[#55556a]">—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    {doc.fileName
                      ? <span className="text-[11px] text-[#8888a8]">📄 {doc.fileName}</span>
                      : <button onClick={() => handleUpload(doc)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-md transition">
                          ⬆ Subir Archivo
                        </button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
