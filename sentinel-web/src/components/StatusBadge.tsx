import type { ComplaintStatus, Severity } from '../types';

// Status is always conveyed with text AND colour, never colour alone (SRS 8.3, FR-39).

const STATUS_STYLES: Record<ComplaintStatus, { label: string; className: string }> = {
  Draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  Submitted: { label: 'Submitted', className: 'bg-accent-100 text-accent-700' },
  UnderReview: { label: 'Under review', className: 'bg-amber-100 text-amber-800' },
  MoreInfoNeeded: { label: 'More info needed', className: 'bg-purple-100 text-purple-800' },
  Resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
  Closed: { label: 'Closed', className: 'bg-slate-200 text-slate-700' },
  Withdrawn: { label: 'Withdrawn', className: 'bg-rose-100 text-rose-800' },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`badge ${s.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {s.label}
    </span>
  );
}

const SEVERITY_STYLES: Record<Severity, { label: string; className: string }> = {
  Low: { label: 'Low', className: 'bg-slate-100 text-slate-700' },
  Medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  High: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  Critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
};

export function SeverityBadge({ severity }: { severity?: Severity | null }) {
  if (!severity) return <span className="text-sm text-slate-400">—</span>;
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={`badge ${s.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {s.label}
    </span>
  );
}
