import { DocStatus } from '@/types';

const CONFIG: Record<DocStatus, { label: string; className: string }> = {
  aprobado:  { label: 'Aprobado',  className: 'status-approved' },
  pendiente: { label: 'Pendiente', className: 'status-pending'  },
  rechazado: { label: 'Rechazado', className: 'status-rejected' },
};

interface Props {
  status: DocStatus;
}

export default function StatusPill({ status }: Props) {
  const { label, className } = CONFIG[status] ?? CONFIG.pendiente;
  return <span className={`status-pill ${className}`}>{label}</span>;
}
