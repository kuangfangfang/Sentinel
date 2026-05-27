import type { StatusHistoryDto } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/format';

/** A vertical timeline of status changes (FR-26, FR-27). */
export function StatusTimeline({ history }: { history: StatusHistoryDto[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">No status changes recorded yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {history.map((h, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center" aria-hidden="true">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-600" />
            {i < history.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
          </div>
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={h.toStatus} />
              <time className="text-sm text-slate-500" dateTime={h.changedAt}>{formatDateTime(h.changedAt)}</time>
            </div>
            {h.changedByName && <p className="mt-1 text-sm text-slate-600">By {h.changedByName}</p>}
            {h.note && <p className="mt-1 text-sm text-slate-700">{h.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
