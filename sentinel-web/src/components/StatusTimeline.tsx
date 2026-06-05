import { useEffect, useState } from 'react';
import type { StatusHistoryDto } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/format';

const STATUS_HISTORY_COLLAPSE_THRESHOLD = 4;

type StatusTimelineProps = {
  history: StatusHistoryDto[];
  /** Disclosure pattern: expand/collapse with count in summary (caseworker detail). */
  collapsible?: boolean;
};

/** A vertical timeline of status changes (FR-26, FR-27). */
export function StatusTimeline({ history, collapsible = false }: StatusTimelineProps) {
  const defaultOpen = history.length < STATUS_HISTORY_COLLAPSE_THRESHOLD;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(history.length < STATUS_HISTORY_COLLAPSE_THRESHOLD);
  }, [history]);

  const body = history.length === 0 ? (
    <p className="text-sm text-slate-500">No status changes recorded yet.</p>
  ) : (
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

  if (!collapsible) return body;

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer font-semibold text-navy-900">
        Status history ({history.length})
      </summary>
      <div className="mt-3">{body}</div>
    </details>
  );
}
