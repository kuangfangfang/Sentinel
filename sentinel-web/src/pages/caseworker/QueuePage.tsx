import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { caseworkerApi } from '../../api/caseworker';
import { complaintsApi } from '../../api/complaints';
import type { ComplaintStatus, GroundDto, PagedResult, QueueItemDto, QueueQuery, Severity } from '../../types';
import { Spinner } from '../../components/Spinner';
import { SeverityBadge, StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

const STATUSES: ComplaintStatus[] = ['Submitted', 'UnderReview', 'MoreInfoNeeded', 'Resolved', 'Closed', 'Withdrawn'];
const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export function QueuePage() {
  const [query, setQuery] = useState<QueueQuery>({ page: 1, pageSize: 10, sortBy: 'submitted', sortDescending: true });
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<PagedResult<QueueItemDto> | null>(null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    complaintsApi.getGrounds().then(setGrounds).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    caseworkerApi
      .queue(query)
      .then((r) => active && setResult(r))
      .catch(() => active && setError('Could not load the queue.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  function patch(p: Partial<QueueQuery>) {
    setQuery((q) => ({ ...q, page: 1, ...p }));
  }
  function onSearch(e: FormEvent) {
    e.preventDefault();
    patch({ search: searchInput.trim() || undefined });
  }

  const items = result?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Triage queue</h1>
        <Link to="/caseworker" className="btn-ghost">← Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={onSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="label">Search</label>
            <input id="search" className="input" placeholder="Reference code or keyword"
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" className="input" value={query.status ?? ''}
              onChange={(e) => patch({ status: (e.target.value || undefined) as ComplaintStatus | undefined })}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="label">Severity</label>
            <select id="severity" className="input" value={query.severity ?? ''}
              onChange={(e) => patch({ severity: (e.target.value || undefined) as Severity | undefined })}>
              <option value="">All</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ground" className="label">Category</label>
            <select id="ground" className="input" value={query.ground ?? ''}
              onChange={(e) => patch({ ground: e.target.value || undefined })}>
              <option value="">All</option>
              {grounds.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-ghost" onClick={() => { setSearchInput(''); setQuery({ page: 1, pageSize: 10, sortBy: 'submitted', sortDescending: true }); }}>
              Clear filters
            </button>
          </div>
        </form>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
      {loading && <Spinner />}

      {result && !loading && (
        <>
          <p className="text-sm text-slate-500">{result.totalCount} complaint(s) found</p>

          {items.length === 0 ? (
            <div className="card p-8 text-center text-slate-600">No complaints match your filters.</div>
          ) : (
            <>
              {/* Desktop: data table (lg and up) */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Reference', 'Title', 'Status', 'Severity', 'Location (exact)', 'Lodged', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.referenceCode ?? '—'}</td>
                        <td className="max-w-xs truncate px-4 py-3 font-medium text-navy-900">{c.title}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{c.incidentLocation}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(c.submittedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/caseworker/complaints/${c.id}`} className="font-medium text-accent-700 hover:underline">Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: stacked cards (below lg) — the same data, reflowed (SRS 8.2, AC-12) */}
              <ul className="space-y-3 lg:hidden">
                {items.map((c) => (
                  <li key={c.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500">{c.referenceCode ?? '—'}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <Link to={`/caseworker/complaints/${c.id}`} className="mt-1 block font-semibold text-navy-900 hover:underline">
                      {c.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>Severity: <SeverityBadge severity={c.severity} /></span>
                      <span>{c.incidentLocation}</span>
                      <span>Lodged {formatDate(c.submittedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <button className="btn-secondary" disabled={query.page! <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}>
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">Page {result.page} of {Math.max(result.totalPages, 1)}</span>
                <button className="btn-secondary" disabled={result.page >= result.totalPages}
                  onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}>
                  Next →
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
