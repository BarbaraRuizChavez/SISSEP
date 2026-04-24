'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth }                           from '@/context/AuthContext';
import { api, uploadFile, storageUrl }       from '@/lib/api';
import { DocumentRecord, ProgramType }       from '@/types';
import StatusPill                            from '@/components/ui/StatusPill';
import Spinner                               from '@/components/ui/Spinner';
import Modal                                 from '@/components/ui/Modal';

const PROGRAMS: { id: ProgramType; label: string }[] = [
  { id: 'servicio_social', label: 'Servicio Social' },
  { id: 'residencias',     label: 'Residencias Profesionales' },
];

export default function StudentPage() {
  const { user } = useAuth();

  const [program,   setProgram]   = useState<ProgramType>('servicio_social');
  const [docs,      setDocs]      = useState<DocumentRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  // Estado del modal para URL externa
  const [urlTarget, setUrlTarget] = useState<DocumentRecord | null>(null);
  const [urlInput,  setUrlInput]  = useState('');
  const [urlError,  setUrlError]  = useState('');
  const [urlLoading,setUrlLoading]= useState(false);

  // Estado del modal para ver observaciones completas
  const [obsTarget, setObsTarget] = useState<DocumentRecord | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DocumentRecord[]>(`/documents?programType=${program}`);
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Subir archivo fisico desde el explorador de archivos del sistema
  function handleUploadFile(doc: DocumentRecord) {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(doc.id);
      try {
        const form = new FormData();
        form.append('file',        file);
        form.append('category',    doc.category);
        form.append('programType', program);
        await uploadFile('/documents/upload', form);
        await fetchDocs();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setUploading(null);
      }
    };

    input.click();
  }

  // Guardar URL externa de Drive / OneDrive / Dropbox
  async function handleSaveUrl() {
    if (!urlTarget) return;
    if (!urlInput.startsWith('http')) {
      setUrlError('La URL debe comenzar con https://');
      return;
    }
    setUrlLoading(true);
    setUrlError('');
    try {
      await api.post('/documents/url', {
        category:    urlTarget.category,
        programType: program,
        externalUrl: urlInput,
      });
      setUrlTarget(null);
      setUrlInput('');
      fetchDocs();
    } catch (e: any) {
      setUrlError(e.message);
    } finally {
      setUrlLoading(false);
    }
  }

  const approved = docs.filter((d) => d.status === 'aprobado').length;
  const pct      = docs.length ? Math.round((approved / docs.length) * 100) : 0;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <span className="sidebar-section-label">Programa</span>
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            className={`sidebar-nav-btn${program === p.id ? ' active' : ''}`}
            onClick={() => setProgram(p.id)}
            type="button"
          >
            {p.label}
          </button>
        ))}

        {/* Avatar e info del estudiante */}
        <div className="student-avatar">
          {user?.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <p className="student-name">{user?.name}</p>
        <p className="student-carrera">{user?.carrera}</p>

        {/* Barra de progreso */}
        <div className="progress-block">
          <div className="progress-labels">
            <span>Progreso del expediente</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="progress-note">{approved} de {docs.length} documentos aprobados</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="content">
        <div className="page-header">
          <h1 className="page-title">Documentos Requeridos</h1>
          <p className="page-subtitle">
            {program === 'servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
            {' — Sube el archivo o pega un enlace de Google Drive, OneDrive o Dropbox.'}
          </p>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Estado</th>
                  <th>Archivo / Enlace</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ maxWidth: 200 }}>
                      <p className="doc-category">{doc.category}</p>
                      <p className="doc-description">{doc.description}</p>
                    </td>

                    <td>
                      <StatusPill status={doc.status} />
                    </td>

                    <td style={{ maxWidth: 180 }}>
                      {doc.filePath && (
                        <a
                          className="doc-file-link"
                          href={storageUrl(doc.filePath)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {doc.fileName}
                        </a>
                      )}
                      {doc.externalUrl && (
                        <a
                          className="doc-url-link"
                          href={doc.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Enlace externo
                        </a>
                      )}
                      {!doc.filePath && !doc.externalUrl && (
                        <span className="doc-empty">Sin enviar</span>
                      )}
                    </td>

                    <td style={{ maxWidth: 200 }}>
                      {doc.observations ? (
                        <span
                          className="obs-text"
                          onClick={() => setObsTarget(doc)}
                        >
                          {doc.observations}
                        </span>
                      ) : (
                        <span className="doc-empty">—</span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUploadFile(doc)}
                          disabled={uploading === doc.id}
                          type="button"
                        >
                          {uploading === doc.id ? 'Subiendo...' : 'Subir archivo'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setUrlTarget(doc);
                            setUrlInput(doc.externalUrl || '');
                            setUrlError('');
                          }}
                          type="button"
                        >
                          Pegar URL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal: ingresar URL externa */}
      <Modal
        open={!!urlTarget}
        onClose={() => setUrlTarget(null)}
        title={`Enlace externo — ${urlTarget?.category}`}
      >
        <p className="modal-description">
          Pega el enlace de Google Drive, OneDrive o Dropbox. Asegurate de que
          el archivo sea accesible con el enlace antes de guardarlo.
        </p>
        <div className="field">
          <label>URL del documento</label>
          <input
            className="input"
            placeholder="https://drive.google.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
            autoFocus
          />
        </div>
        {urlError && <div className="auth-error">{urlError}</div>}
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleSaveUrl}
            disabled={urlLoading}
            type="button"
          >
            {urlLoading ? 'Guardando...' : 'Guardar enlace'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setUrlTarget(null)}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      {/* Modal: observaciones completas del encargado */}
      <Modal
        open={!!obsTarget}
        onClose={() => setObsTarget(null)}
        title="Observaciones del encargado"
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {obsTarget?.observations}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          Documento: {obsTarget?.category}
        </p>
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setObsTarget(null)}
            type="button"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
