'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, storageUrl, importStudents }   from '@/lib/api';
import StatusPill                            from '@/components/ui/StatusPill';
import Spinner                               from '@/components/ui/Spinner';
import Modal                                 from '@/components/ui/Modal';
import { DocumentRecord, StudentProgress, ProgramType, DeliveryPeriod, PERIODOS } from '@/types';

const PROGRAMS: { id: ProgramType; label: string }[] = [
  { id: 'servicio_social', label: 'Servicio Social' },
  { id: 'residencias',     label: 'Residencias Profesionales' },
];

const PROGRAMAS_EDUCATIVOS = [
  'Ingenieria en Sistemas Computacionales',
  'Ingenieria en Electronica',
  'Ingenieria en Mecatronica',
  'Ingenieria Industrial',
  'Ingenieria en Administracion',
  'Ingenieria Quimica',
  'Ingenieria en Gestion Empresarial',
  'Licenciatura en Administracion',
];

type Tab = 'estudiantes' | 'periodos' | 'alta';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function getPeriodBadge(period: DeliveryPeriod): { label: string; color: string } {
  const today = new Date().toISOString().split('T')[0];
  if (today < period.startDate) return { label: 'Próximo',  color: 'var(--accent-hover)' };
  if (today <= period.endDate)  return { label: 'Abierto',  color: 'var(--green)' };
  return                               { label: 'Cerrado',  color: 'var(--text-muted)' };
}

export default function AdminPage() {
  const [activeTab,  setActiveTab]  = useState<Tab>('estudiantes');
  const [program,    setProgram]    = useState<ProgramType>('servicio_social');
  const [students,   setStudents]   = useState<StudentProgress[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');

  // ── Periodos ──
  const [periods,      setPeriods]      = useState<DeliveryPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [editPeriods,  setEditPeriods]  = useState<Record<string, { startDate: string; endDate: string }>>({});
  const [periodSaving, setPeriodSaving] = useState<string | null>(null);
  const [periodError,  setPeriodError]  = useState<string | null>(null);
  const [periodOk,     setPeriodOk]     = useState<string | null>(null);

  // ── Detalle de expediente ──
  const [detail, setDetail] = useState<{ student: StudentProgress; docs: DocumentRecord[] } | null>(null);
  const [review, setReview] = useState<{ doc: DocumentRecord; action: 'aprobado' | 'rechazado' } | null>(null);
  const [reviewObs,     setReviewObs]     = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Alta manual ──
  const [newStudent, setNewStudent] = useState({ controlNumber: '', name: '', carrera: '', periodo: '', password: '' });
  const [altaLoading, setAltaLoading] = useState(false);
  const [altaError,   setAltaError]   = useState('');
  const [altaSuccess, setAltaSuccess] = useState('');

  // ── Importación masiva ──
  const [importResult,  setImportResult]  = useState<{ created: number; skipped: number; errors: { row: number; controlNumber: string; reason: string }[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError,   setImportError]   = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<StudentProgress[]>(`/documents/progress?programType=${program}`);
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, [program]);

  const fetchPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    try {
      const data = await api.get<DeliveryPeriod[]>(`/periods?programType=${program}`);
      setPeriods(data);
      const edits: Record<string, { startDate: string; endDate: string }> = {};
      data.forEach((p) => { edits[p.id] = { startDate: p.startDate, endDate: p.endDate }; });
      setEditPeriods(edits);
    } finally {
      setPeriodsLoading(false);
    }
  }, [program]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { if (activeTab === 'periodos') fetchPeriods(); }, [activeTab, fetchPeriods]);

  async function openDetail(student: StudentProgress) {
    const docs = await api.get<DocumentRecord[]>(`/documents/student/${student.id}?programType=${program}`);
    setDetail({ student, docs });
  }

  async function confirmReview() {
    if (!review || !detail) return;
    setReviewLoading(true);
    try {
      await api.patch(`/documents/${review.doc.id}/review`, { status: review.action, observations: reviewObs });
      setReview(null);
      setReviewObs('');
      const docs = await api.get<DocumentRecord[]>(`/documents/student/${detail.student.id}?programType=${program}`);
      setDetail((prev) => (prev ? { ...prev, docs } : null));
      fetchStudents();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReviewLoading(false);
    }
  }

  async function savePeriod(periodId: string) {
    const edit = editPeriods[periodId];
    if (!edit) return;
    setPeriodSaving(periodId);
    setPeriodError(null);
    setPeriodOk(null);
    try {
      await api.patch(`/periods/${periodId}`, { startDate: edit.startDate, endDate: edit.endDate });
      setPeriodOk(periodId);
      await fetchPeriods();
      setTimeout(() => setPeriodOk(null), 2500);
    } catch (e: any) {
      setPeriodError(e.message);
    } finally {
      setPeriodSaving(null);
    }
  }

  async function handleAltaManual() {
    setAltaError('');
    setAltaSuccess('');
    if (!newStudent.controlNumber || !newStudent.name) { setAltaError('Numero de control y nombre son requeridos.'); return; }
    if (!newStudent.password || newStudent.password.length < 6) { setAltaError('La contrasena debe tener al menos 6 caracteres.'); return; }
    setAltaLoading(true);
    try {
      await api.post('/auth/register', { ...newStudent, role: 'estudiante' });
      setAltaSuccess(`Alumno ${newStudent.name} registrado correctamente.`);
      setNewStudent({ controlNumber: '', name: '', carrera: '', periodo: '', password: '' });
      fetchStudents();
    } catch (e: any) {
      setAltaError(e.message);
    } finally {
      setAltaLoading(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportError('');
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await importStudents(formData) as typeof importResult;
      setImportResult(result);
      fetchStudents();
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  }

  function downloadTemplate() {
    const csv = 'No. Control,Nombre,Programa Educativo,Periodo,Contrasena\nA22120001,Juan Perez Lopez,Ingenieria en Sistemas Computacionales,ENE-JUN 2026,';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = 'plantilla_alumnos.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered      = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.controlNumber.includes(search));
  const totalPending  = students.reduce((a, s) => a + s.pending,  0);
  const totalApproved = students.reduce((a, s) => a + s.approved, 0);
  const totalRejected = students.reduce((a, s) => a + s.rejected, 0);
  const totalBlocked  = students.filter((s) => s.studentStatus === 'bloqueado').length;

  // ──────────────────────────────────────────
  // Vista detalle del expediente
  // ──────────────────────────────────────────
  if (detail) {
    const { student, docs } = detail;
    const appCount = docs.filter((d) => d.status === 'aprobado').length;

    const periodGroups = Array.from(new Set(docs.map((d) => d.periodNumber).filter(Boolean))).sort() as number[];

    return (
      <div className="app-shell">
        <aside className="sidebar">
          <span className="sidebar-section-label">Programa</span>
          {PROGRAMS.map((p) => (
            <button key={p.id} className={`sidebar-nav-btn${program === p.id ? ' active' : ''}`} onClick={() => setProgram(p.id)} type="button">
              {p.label}
            </button>
          ))}
          <div className="divider" />
          <span className="sidebar-section-label">Expediente</span>
          <div className="sidebar-stat"><span>Total</span><strong>{docs.length}</strong></div>
          <div className="sidebar-stat"><span>Aprobados</span><strong style={{ color: 'var(--green)' }}>{appCount}</strong></div>
          <div className="sidebar-stat"><span>Pendientes</span><strong style={{ color: 'var(--amber)' }}>{docs.filter((d) => d.status === 'pendiente').length}</strong></div>
          <div className="sidebar-stat"><span>Rechazados</span><strong style={{ color: 'var(--red)' }}>{docs.filter((d) => d.status === 'rechazado').length}</strong></div>
        </aside>

        <main className="content">
          <button className="back-btn" onClick={() => setDetail(null)} type="button">&larr; Volver a la lista</button>

          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title">{student.name}</h1>
              {student.studentStatus === 'bloqueado' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                  Bloqueado
                </span>
              )}
            </div>
            <p className="page-subtitle">
              {student.controlNumber} &middot; {student.carrera || 'Sin programa'} &middot; {student.periodo || '—'} &middot;{' '}
              {program === 'servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {periodGroups.map((pNum) => {
              const pDocs   = docs.filter((d) => d.periodNumber === pNum);
              const period  = periods.find((p) => p.periodNumber === pNum);
              return (
                <div key={pNum} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', background: 'var(--bg-surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Período {pNum}</span>
                    {period && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {formatDate(period.startDate)} – {formatDate(period.endDate)}
                      </span>
                    )}
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr><th>Documento</th><th>Estado</th><th>Archivo / Enlace</th><th>Observaciones</th><th>Acciones</th></tr>
                      </thead>
                      <tbody>
                        {pDocs.map((doc) => (
                          <tr key={doc.id}>
                            <td style={{ maxWidth: 200 }}>
                              <p className="doc-category">{doc.category}</p>
                              <p className="doc-description">{doc.description}</p>
                            </td>
                            <td><StatusPill status={doc.status} /></td>
                            <td style={{ maxWidth: 180 }}>
                              {doc.filePath && <a className="doc-file-link" href={storageUrl(doc.filePath)} target="_blank" rel="noreferrer">{doc.fileName}</a>}
                              {doc.externalUrl && <a className="doc-url-link" href={doc.externalUrl} target="_blank" rel="noreferrer">Enlace externo</a>}
                              {!doc.filePath && !doc.externalUrl && <span className="doc-empty">Sin enviar</span>}
                            </td>
                            <td style={{ maxWidth: 180 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{doc.observations || '—'}</span>
                            </td>
                            <td>
                              {(doc.filePath || doc.externalUrl) ? (
                                <div className="table-actions">
                                  <button className="btn btn-success btn-sm" onClick={() => { setReview({ doc, action: 'aprobado' }); setReviewObs(''); }} type="button">Aprobar</button>
                                  <button className="btn btn-danger btn-sm"  onClick={() => { setReview({ doc, action: 'rechazado' }); setReviewObs(doc.observations || ''); }} type="button">Rechazar</button>
                                </div>
                              ) : <span className="doc-empty">Sin documento</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <Modal open={!!review} onClose={() => setReview(null)} title={review?.action === 'aprobado' ? 'Aprobar documento' : 'Rechazar documento'}>
          <p className="modal-description">{review?.doc.category}</p>
          <div className="field">
            <label>{review?.action === 'rechazado' ? 'Motivo del rechazo (visible para el estudiante)' : 'Observacion opcional'}</label>
            <textarea className="input" rows={4} placeholder={review?.action === 'rechazado' ? 'Describe el motivo...' : 'Comentario opcional...'} value={reviewObs} onChange={(e) => setReviewObs(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className={`btn ${review?.action === 'aprobado' ? 'btn-success' : 'btn-danger'}`} onClick={confirmReview} disabled={reviewLoading} type="button">
              {reviewLoading ? 'Guardando...' : review?.action === 'aprobado' ? 'Confirmar aprobacion' : 'Confirmar rechazo'}
            </button>
            <button className="btn btn-secondary" onClick={() => setReview(null)} type="button">Cancelar</button>
          </div>
        </Modal>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Vista principal con tabs
  // ──────────────────────────────────────────
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <span className="sidebar-section-label">Programa</span>
        {PROGRAMS.map((p) => (
          <button key={p.id} className={`sidebar-nav-btn${program === p.id ? ' active' : ''}`} onClick={() => setProgram(p.id)} type="button">
            {p.label}
          </button>
        ))}
        <div className="divider" />
        <span className="sidebar-section-label">Estadisticas</span>
        <div className="sidebar-stat"><span>Estudiantes</span><strong style={{ color: 'var(--accent-hover)' }}>{filtered.length}</strong></div>
        <div className="sidebar-stat"><span>Pendientes</span><strong style={{ color: 'var(--amber)' }}>{totalPending}</strong></div>
        <div className="sidebar-stat"><span>Aprobados</span><strong style={{ color: 'var(--green)' }}>{totalApproved}</strong></div>
        <div className="sidebar-stat"><span>Rechazados</span><strong style={{ color: 'var(--red)' }}>{totalRejected}</strong></div>
        {totalBlocked > 0 && (
          <div className="sidebar-stat"><span>Bloqueados</span><strong style={{ color: 'var(--red)' }}>{totalBlocked}</strong></div>
        )}
      </aside>

      <main className="content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([
            { id: 'estudiantes', label: 'Lista de Estudiantes' },
            { id: 'periodos',    label: 'Periodos de Entrega' },
            { id: 'alta',        label: 'Alta de Alumnos' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              type="button"
              style={{
                padding:      '10px 18px',
                border:       'none',
                background:   'none',
                cursor:       'pointer',
                fontSize:     13,
                fontWeight:   activeTab === t.id ? 700 : 500,
                color:        activeTab === t.id ? 'var(--accent-hover)' : 'var(--text-secondary)',
                borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                transition:   'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Estudiantes ── */}
        {activeTab === 'estudiantes' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Lista de Estudiantes</h1>
              <p className="page-subtitle">
                {program === 'servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
                {' — Haz clic en un estudiante para revisar su expediente.'}
              </p>
            </div>
            <input className="search-bar" placeholder="Buscar por nombre o numero de control..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {loading ? <Spinner /> : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">&#128193;</div>
                <p className="empty-state-text">No hay estudiantes registrados</p>
                <p className="empty-state-sub">Usa la pestaña "Alta de Alumnos" para agregar estudiantes</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Control</th>
                      <th>Nombre</th>
                      <th>Programa Educativo</th>
                      <th>Periodo</th>
                      <th>Estado</th>
                      <th>Progreso</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const pct       = s.total ? Math.round((s.approved / s.total) * 100) : 0;
                      const fillClass = pct === 100 ? 'high' : pct >= 50 ? 'mid' : 'low';
                      return (
                        <tr key={s.id} className="clickable" onClick={() => openDetail(s)}>
                          <td><span className="control-number">{s.controlNumber}</span></td>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.carrera || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.periodo || '—'}</td>
                          <td>
                            {s.studentStatus === 'bloqueado' ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                                Bloqueado
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>
                                Activo
                              </span>
                            )}
                          </td>
                          <td style={{ minWidth: 160 }}>
                            <div className="mini-progress">
                              <div className="mini-progress-bar">
                                <div className={`mini-progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="mini-progress-frac">{s.approved}/{s.total}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--accent-hover)', fontWeight: 600 }}>Ver expediente &rarr;</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Periodos de Entrega ── */}
        {activeTab === 'periodos' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Periodos de Entrega</h1>
              <p className="page-subtitle">
                {program === 'servicio_social' ? 'Servicio Social' : 'Residencias Profesionales'}
                {' — Configura las fechas de cada periodo. Las fechas no pueden traslaparse.'}
              </p>
            </div>
            {periodError && (
              <div className="auth-error" style={{ marginBottom: 20 }}>{periodError}</div>
            )}
            {periodsLoading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {periods.map((period) => {
                  const edit  = editPeriods[period.id] ?? { startDate: period.startDate, endDate: period.endDate };
                  const badge = getPeriodBadge(period);
                  const catalog = program === 'servicio_social'
                    ? SS_CATALOG.filter((c) => c.periodNumber === period.periodNumber)
                    : RES_CATALOG.filter((c) => c.periodNumber === period.periodNumber);

                  return (
                    <div key={period.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '14px 20px', background: 'var(--bg-surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{period.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: badge.color, border: `1px solid ${badge.color}`, opacity: 0.9 }}>{badge.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>INICIO</label>
                            <input
                              type="date"
                              className="input"
                              style={{ width: 150, padding: '6px 10px', fontSize: 12 }}
                              value={edit.startDate}
                              onChange={(e) => {
                                setPeriodError(null);
                                setEditPeriods((prev) => ({ ...prev, [period.id]: { ...edit, startDate: e.target.value } }));
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>FIN</label>
                            <input
                              type="date"
                              className="input"
                              style={{ width: 150, padding: '6px 10px', fontSize: 12 }}
                              value={edit.endDate}
                              onChange={(e) => {
                                setPeriodError(null);
                                setEditPeriods((prev) => ({ ...prev, [period.id]: { ...edit, endDate: e.target.value } }));
                              }}
                            />
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => savePeriod(period.id)}
                            disabled={periodSaving === period.id}
                            type="button"
                          >
                            {periodSaving === period.id ? 'Guardando...' : periodOk === period.id ? '✓ Guardado' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: '12px 20px' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Documentos de este periodo ({catalog.length})
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {catalog.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: 20, fontFamily: 'monospace' }}>{i + 1}.</span>
                              <span>{c.category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── TAB: Alta de Alumnos ── */}
        {activeTab === 'alta' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Alta de Alumnos</h1>
              <p className="page-subtitle">Registra alumnos manualmente o importa desde una hoja de calculo.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              {/* Formulario manual */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
                <h2 style={{ marginBottom: 20 }}>Registro manual</h2>

                <div className="field">
                  <label>Numero de control</label>
                  <input className="input" placeholder="Ej: A22120281" value={newStudent.controlNumber} onChange={(e) => setNewStudent((p) => ({ ...p, controlNumber: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Nombre completo</label>
                  <input className="input" placeholder="Nombre y apellidos" value={newStudent.name} onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Programa Educativo</label>
                  <select className="input" value={newStudent.carrera} onChange={(e) => setNewStudent((p) => ({ ...p, carrera: e.target.value }))}>
                    <option value="">Selecciona el programa</option>
                    {PROGRAMAS_EDUCATIVOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Periodo del servicio</label>
                  <select className="input" value={newStudent.periodo} onChange={(e) => setNewStudent((p) => ({ ...p, periodo: e.target.value }))}>
                    <option value="">Selecciona el periodo</option>
                    {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Contrasena inicial</label>
                  <input className="input" type="password" placeholder="Minimo 6 caracteres" value={newStudent.password} onChange={(e) => setNewStudent((p) => ({ ...p, password: e.target.value }))} />
                </div>

                {altaError   && <div className="auth-error">{altaError}</div>}
                {altaSuccess && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 6, fontSize: 12, color: 'var(--green)' }}>
                    {altaSuccess}
                  </div>
                )}

                <button className="btn btn-primary btn-full" onClick={handleAltaManual} disabled={altaLoading} type="button">
                  {altaLoading ? 'Registrando...' : 'Registrar alumno'}
                </button>
              </div>

              {/* Importación masiva */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
                <h2 style={{ marginBottom: 6 }}>Importar desde hoja de calculo</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                  Sube un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con las columnas: <br />
                  <code style={{ fontSize: 11, color: 'var(--accent-hover)' }}>No. Control, Nombre, Programa Educativo, Periodo, Contrasena</code><br />
                  Si la contrasena esta vacia se usara el numero de control como contrasena.
                </p>

                <button className="btn btn-secondary" onClick={downloadTemplate} type="button" style={{ marginBottom: 16, width: '100%' }}>
                  Descargar plantilla CSV
                </button>

                <label style={{
                  display:        'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap:            8, padding: '24px', border: '2px dashed var(--border-hover)',
                  borderRadius:   8, cursor: importLoading ? 'not-allowed' : 'pointer',
                  background:     'var(--bg-surface2)', transition: 'border-color 0.15s',
                }}>
                  <span style={{ fontSize: 28 }}>&#128196;</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {importLoading ? 'Importando...' : 'Haz clic para seleccionar archivo'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>.xlsx, .xls, .csv</span>
                  <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImportFile} disabled={importLoading} />
                </label>

                {importError && <div className="auth-error" style={{ marginTop: 12 }}>{importError}</div>}

                {importResult && (
                  <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Resultado de la importacion</p>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{importResult.created}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Creados</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>{importResult.skipped}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ya existian</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{importResult.errors.length}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Errores</p>
                      </div>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.7 }}>
                        {importResult.errors.map((err, i) => (
                          <div key={i}>Fila {err.row} ({err.controlNumber}): {err.reason}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Catálogos locales para mostrar documentos por periodo en el panel de periodos
const SS_CATALOG = [
  { periodNumber: 1, category: 'SOLICITUD DE SERVICIO SOCIAL' },
  { periodNumber: 1, category: 'CARTA COMPROMISO' },
  { periodNumber: 1, category: 'PLAN DE TRABAJO' },
  { periodNumber: 2, category: 'CARTA DE PRESENTACION' },
  { periodNumber: 2, category: 'CARTA DE ACEPTACION' },
  { periodNumber: 3, category: 'REPORTE BIMESTRAL 1' },
  { periodNumber: 3, category: 'EVALUACION CUALITATIVA 1' },
  { periodNumber: 3, category: 'AUTOEVALUACION CUALITATIVA 1' },
  { periodNumber: 3, category: 'EVALUACION DE LAS ACTIVIDADES 1' },
  { periodNumber: 4, category: 'REPORTE BIMESTRAL 2' },
  { periodNumber: 4, category: 'EVALUACION CUALITATIVA 2' },
  { periodNumber: 4, category: 'AUTOEVALUACION CUALITATIVA 2' },
  { periodNumber: 4, category: 'EVALUACION DE LAS ACTIVIDADES 2' },
  { periodNumber: 5, category: 'REPORTE BIMESTRAL 3' },
  { periodNumber: 5, category: 'EVALUACION CUALITATIVA 3' },
  { periodNumber: 5, category: 'AUTOEVALUACION CUALITATIVA 3' },
  { periodNumber: 5, category: 'EVALUACION DE LAS ACTIVIDADES 3' },
  { periodNumber: 6, category: 'CARTA DE TERMINACION' },
];

const RES_CATALOG = [
  { periodNumber: 1, category: 'SOLICITUD DE RESIDENCIAS' },
  { periodNumber: 1, category: 'CARTA DE ACEPTACION' },
  { periodNumber: 1, category: 'ANTEPROYECTO' },
  { periodNumber: 1, category: 'CARTA DE PRESENTACION' },
  { periodNumber: 2, category: 'REPORTE PARCIAL 1' },
  { periodNumber: 2, category: 'REPORTE PARCIAL 2' },
  { periodNumber: 3, category: 'REPORTE PARCIAL 3' },
  { periodNumber: 3, category: 'REPORTE FINAL' },
  { periodNumber: 3, category: 'CARTA DE TERMINACION' },
  { periodNumber: 3, category: 'EVALUACION DEL RESIDENTE' },
];
