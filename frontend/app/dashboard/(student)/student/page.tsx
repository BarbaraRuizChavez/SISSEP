'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth }                           from '@/context/AuthContext';
import { api, uploadFile, storageUrl }       from '@/lib/api';
import { DocumentRecord, ProgramType, DeliveryPeriod } from '@/types';
import StatusPill                            from '@/components/ui/StatusPill';
import Spinner                               from '@/components/ui/Spinner';
import Modal                                 from '@/components/ui/Modal';

const PROGRAMS: { id: ProgramType; label: string }[] = [
  { id: 'servicio_social', label: 'Servicio Social' },
  { id: 'residencias',     label: 'Residencias Profesionales' },
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function getPeriodStatus(period: DeliveryPeriod): 'proxximo' | 'abierto' | 'cerrado' {
  const today = new Date().toISOString().split('T')[0];
  if (today < period.startDate) return 'proxximo';
  if (today <= period.endDate)  return 'abierto';
  return 'cerrado';
}

export default function StudentPage() {
  const { user } = useAuth();

  const [program,    setProgram]    = useState<ProgramType>('servicio_social');
  const [docs,       setDocs]       = useState<DocumentRecord[]>([]);
  const [periods,    setPeriods]    = useState<DeliveryPeriod[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState<string | null>(null);
  const [blocked,    setBlocked]    = useState(false);

  const [urlTarget,  setUrlTarget]  = useState<DocumentRecord | null>(null);
  const [urlInput,   setUrlInput]   = useState('');
  const [urlError,   setUrlError]   = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const [obsTarget,  setObsTarget]  = useState<DocumentRecord | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docsData, periodsData] = await Promise.all([
        api.get<DocumentRecord[]>(`/documents?programType=${program}`),
        api.get<DeliveryPeriod[]>(`/periods?programType=${program}`),
      ]);
      setDocs(docsData);
      setPeriods(periodsData);

      const today = new Date().toISOString().split('T')[0];
      const isBlocked = periodsData.some((p) => {
        if (p.endDate >= today) return false;
        const periodDocs = docsData.filter((d) => d.periodNumber === p.periodNumber);
        return periodDocs.some((d) => !d.filePath && !d.externalUrl);
      });
      setBlocked(isBlocked);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
        await fetchAll();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }

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
      fetchAll();
    } catch (e: any) {
      setUrlError(e.message);
    } finally {
      setUrlLoading(false);
    }
  }

  const approved = docs.filter((d) => d.status === 'aprobado').length;
  const pct      = docs.length ? Math.round((approved / docs.length) * 100) : 0;

  const docsByPeriod = periods.map((p) => ({
    period: p,
    docs:   docs.filter((d) => d.periodNumber === p.periodNumber),
    status: getPeriodStatus(p),
  }));

  return (
    <div className="app-shell">
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

        <div className="student-avatar">
          {user?.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <p className="student-name">{user?.name}</p>
        <p className="student-carrera">{user?.carrera}</p>
        {user?.periodo && (
          <p className="student-carrera" style={{ color: 'var(--accent-hover)', marginTop: 2 }}>
            {user.periodo}
          </p>
        )}

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

      <main className="content">
        <div className="page-header">
          <h1 className="page-title">Documentos Requeridos</h1>
          <p className="page-subtitle">
            {program === 'servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
            {' — Sube el archivo o pega un enlace de Google Drive, OneDrive o Dropbox.'}
          </p>
        </div>

        {blocked && (
          <div style={{
            marginBottom: 24, padding: '14px 18px',
            background: 'var(--red-dim)', border: '1px solid var(--red-border)',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>&#128274;</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
                Expediente bloqueado
              </p>
              <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.8, marginTop: 2 }}>
                Tienes documentos sin entregar de un periodo vencido. Comunicate con el encargado para que amplíe el plazo.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {docsByPeriod.map(({ period, docs: pDocs, status }) => {
              const allSubmitted = pDocs.every((d) => d.filePath || d.externalUrl);
              const isLocked     = blocked && status !== 'abierto';

              const badgeColor =
                status === 'abierto'  ? 'var(--green)'        :
                status === 'proxximo' ? 'var(--accent-hover)' : 'var(--text-muted)';
              const badgeBg =
                status === 'abierto'  ? 'var(--green-dim)'  :
                status === 'proxximo' ? 'var(--accent-dim)' : 'var(--bg-surface3)';
              const badgeLabel =
                status === 'abierto'  ? 'Abierto'    :
                status === 'proxximo' ? 'Proximo'    :
                allSubmitted          ? 'Completado' : 'Cerrado';

              return (
                <div key={period.id} style={{
                  background:   'var(--bg-surface)',
                  border:       `1px solid ${status === 'abierto' ? 'var(--green-border)' : 'var(--border)'}`,
                  borderRadius: 10,
                  overflow:     'hidden',
                  opacity:      isLocked ? 0.6 : 1,
                }}>
                  <div style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '14px 20px',
                    background:     'var(--bg-surface2)',
                    borderBottom:   '1px solid var(--border)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{period.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 12 }}>
                        {formatDate(period.startDate)} – {formatDate(period.endDate)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 20, color: badgeColor, background: badgeBg,
                      border: `1px solid ${badgeColor}`,
                    }}>
                      {badgeLabel}
                    </span>
                  </div>

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
                        {pDocs.map((doc) => {
                          const canAct = status === 'abierto' && !blocked;
                          return (
                            <tr key={doc.id}>
                              <td style={{ maxWidth: 200 }}>
                                <p className="doc-category">{doc.category}</p>
                                <p className="doc-description">{doc.description}</p>
                              </td>
                              <td><StatusPill status={doc.status} /></td>
                              <td style={{ maxWidth: 180 }}>
                                {doc.filePath && (
                                  <a className="doc-file-link" href={storageUrl(doc.filePath)} target="_blank" rel="noreferrer">
                                    {doc.fileName}
                                  </a>
                                )}
                                {doc.externalUrl && (
                                  <a className="doc-url-link" href={doc.externalUrl} target="_blank" rel="noreferrer">
                                    Enlace externo
                                  </a>
                                )}
                                {!doc.filePath && !doc.externalUrl && (
                                  <span className="doc-empty">Sin enviar</span>
                                )}
                              </td>
                              <td style={{ maxWidth: 200 }}>
                                {doc.observations ? (
                                  <span className="obs-text" onClick={() => setObsTarget(doc)}>
                                    {doc.observations}
                                  </span>
                                ) : (
                                  <span className="doc-empty">—</span>
                                )}
                              </td>
                              <td>
                                {canAct ? (
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
                                      onClick={() => { setUrlTarget(doc); setUrlInput(doc.externalUrl || ''); setUrlError(''); }}
                                      type="button"
                                    >
                                      Pegar URL
                                    </button>
                                  </div>
                                ) : (
                                  <span className="doc-empty">
                                    {blocked ? 'Bloqueado' : status === 'proxximo' ? 'Aun no disponible' : 'Periodo cerrado'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={!!urlTarget}
        onClose={() => setUrlTarget(null)}
        title={`Enlace externo — ${urlTarget?.category}`}
      >
        <p className="modal-description">
          Pega el enlace de Google Drive, OneDrive o Dropbox. Asegurate de que el archivo sea accesible con el enlace antes de guardarlo.
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
          <button className="btn btn-primary" onClick={handleSaveUrl} disabled={urlLoading} type="button">
            {urlLoading ? 'Guardando...' : 'Guardar enlace'}
          </button>
          <button className="btn btn-secondary" onClick={() => setUrlTarget(null)} type="button">
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal open={!!obsTarget} onClose={() => setObsTarget(null)} title="Observaciones del encargado">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {obsTarget?.observations}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          Documento: {obsTarget?.category}
        </p>
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={() => setObsTarget(null)} type="button">
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
