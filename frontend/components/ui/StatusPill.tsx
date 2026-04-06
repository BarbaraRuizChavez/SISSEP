import { DocStatus } from '@/types';

const MAP: Record<DocStatus, { label: string; cls: string }> = {
  approved: { label: '✓ Aprobado',  cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  pending:  { label: '✗ Pendiente', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  rejected: { label: '✗ Rechazado', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

export default function StatusPill({ status }: { status: DocStatus }) {
  const { label, cls } = MAP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
