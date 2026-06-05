import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { caseworkerApi } from '../../api/caseworker';
import { complaintsApi } from '../../api/complaints';
import type { ComplaintStatus, GroundDto, GroundType, PagedResult, QueueItemDto, QueueQuery, Severity } from '../../types';
import { Spinner } from '../../components/Spinner';
import { SeverityBadge, StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { queueFilterSchema } from '../../validation/schemas';
import { useAuth } from '../../context/AuthContext';

const STATUSES: ComplaintStatus[] = ['Submitted', 'UnderReview', 'MoreInfoNeeded', 'Resolved', 'Closed', 'Withdrawn'];
const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'submitted', label: 'Lodged date' },
  { value: 'severity', label: 'Severity' },
  { value: 'status', label: 'Status' },
];
const DEFAULT_QUERY: QueueQuery = { page: 1, pageSize: 10, sortBy: 'submitted', sortDescending: true };
const DEFAULT_FILTERS = { search: '', status: '', severity: '', ground: '', fromDate: '', toDate: '' };

type QueueFilterData = z.infer<typeof queueFilterSchema>;

export function QueuePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<QueueQuery>(() => parseInitialQuery(searchParams, user?.id));
  const [result, setResult] = useState<PagedResult<QueueItemDto> | null>(null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<QueueFilterData>({
    resolver: zodResolver(queueFilterSchema),
    defaultValues: parseInitialFilters(searchParams),
    mode: 'onChange',
  });

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

  function onSearch(data: QueueFilterData) {
    patch({
      search: data.search.trim() || undefined,
      status: (data.status || undefined) as ComplaintStatus | undefined,
      severity: (data.severity || undefined) as Severity | undefined,
      ground: data.ground || undefined,
      fromDate: data.fromDate || undefined,
      toDate: data.toDate || undefined,
    });
  }

  function clearFilters() {
    reset(DEFAULT_FILTERS);
    setQuery(DEFAULT_QUERY);
  }

  function changeSort(sortBy: string) {
    setQuery((q) => ({ ...q, page: 1, sortBy }));
  }

  function toggleDirection() {
    setQuery((q) => ({ ...q, page: 1, sortDescending: !q.sortDescending }));
  }

  function changeAssignment(value: 'all' | 'me' | 'unassigned') {
    patch({
      assigneeUserId: value === 'me' ? user?.id : undefined,
      unassigned: value === 'unassigned' ? true : undefined,
    });
  }

  const assignmentValue: 'all' | 'me' | 'unassigned' =
    query.unassigned ? 'unassigned' : query.assigneeUserId ? 'me' : 'all';

  const items = result?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Triage queue</h1>
        <Link to="/caseworker" className="btn-ghost">Dashboard</Link>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSubmit(onSearch)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="label">Search</label>
            <input id="search" className="input" placeholder="Reference code or keyword" {...register('search')} />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select
              id="status"
              className="input"
              {...register('status', {
                onChange: (e) => patch({ status: (e.target.value || undefined) as ComplaintStatus | undefined }),
              })}
            >
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="label">Severity</label>
            <select
              id="severity"
              className="input"
              {...register('severity', {
                onChange: (e) => patch({ severity: (e.target.value || undefined) as Severity | undefined }),
              })}
            >
              <option value="">All</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ground" className="label">Category</label>
            <select
              id="ground"
              className="input"
              {...register('ground', {
                onChange: (e) => patch({ ground: e.target.value || undefined }),
              })}
            >
              <option value="">All</option>
              {grounds.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fromDate" className="label">Lodged from</label>
            <input
              id="fromDate"
              type="date"
              className="input"
              {...register('fromDate', { onChange: (e) => patch({ fromDate: e.target.value || undefined }) })}
            />
          </div>
          <div>
            <label htmlFor="toDate" className="label">Lodged to</label>
            <input
              id="toDate"
              type="date"
              className="input"
              {...register('toDate', { onChange: (e) => patch({ toDate: e.target.value || undefined }) })}
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" className="btn-primary">Search</button>
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="sortBy" className="label">Sort by</label>
          <select
            id="sortBy"
            className="input"
            value={query.sortBy ?? 'submitted'}
            onChange={(e) => changeSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="button" className="btn-secondary" onClick={toggleDirection}>
          {query.sortDescending ? 'Descending' : 'Ascending'}
        </button>
        <div>
          <label htmlFor="assignment" className="label">Assignment</label>
          <select
            id="assignment"
            className="input"
            value={assignmentValue}
            onChange={(e) => changeAssignment(e.target.value as 'all' | 'me' | 'unassigned')}
          >
            <option value="all">All</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
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
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Reference', 'Title', 'Status', 'Severity', 'Location (exact)', 'Lodged', 'Assignee', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.referenceCode ?? '-'}</td>
                        <td className="max-w-xs truncate px-4 py-3 font-medium text-navy-900">{c.title}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{c.incidentLocation}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(c.submittedAt)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {c.assignedToName ?? <span className="text-slate-400">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/caseworker/complaints/${c.id}`} className="font-medium text-accent-700 hover:underline">Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {items.map((c) => (
                  <li key={c.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500">{c.referenceCode ?? '-'}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <Link to={`/caseworker/complaints/${c.id}`} className="mt-1 block font-semibold text-navy-900 hover:underline">
                      {c.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>Severity: <SeverityBadge severity={c.severity} /></span>
                      <span>{c.incidentLocation}</span>
                      <span>Lodged {formatDate(c.submittedAt)}</span>
                      <span>Assignee: {c.assignedToName ?? 'Unassigned'}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <button className="btn-secondary" disabled={query.page! <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}>
                  Previous
                </button>
                <span className="text-sm text-slate-500">Page {result.page} of {Math.max(result.totalPages, 1)}</span>
                <button className="btn-secondary" disabled={result.page >= result.totalPages}
                  onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}>
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Seeds the queue from a deep link (e.g. dashboard cards), so a shared URL reproduces the view.
function parseInitialQuery(params: URLSearchParams, userId?: string): QueueQuery {
  const q: QueueQuery = { ...DEFAULT_QUERY };
  const status = params.get('status');
  if (status) q.status = status as ComplaintStatus;
  const severity = params.get('severity');
  if (severity) q.severity = severity as Severity;
  const ground = params.get('ground');
  if (ground) q.ground = ground as GroundType;
  const search = params.get('search');
  if (search) q.search = search;
  const fromDate = params.get('fromDate');
  if (fromDate) q.fromDate = fromDate;
  const toDate = params.get('toDate');
  if (toDate) q.toDate = toDate;
  if (params.get('unassigned') === '1') q.unassigned = true;
  else if (params.get('assignee') === 'me' && userId) q.assigneeUserId = userId;
  if (params.get('openOnly') === '1') q.openOnly = true;
  const sort = params.get('sort');
  if (sort) q.sortBy = sort;
  const dir = params.get('dir');
  if (dir) q.sortDescending = dir !== 'asc';
  return q;
}

function parseInitialFilters(params: URLSearchParams): QueueFilterData {
  return {
    search: params.get('search') ?? '',
    status: params.get('status') ?? '',
    severity: params.get('severity') ?? '',
    ground: params.get('ground') ?? '',
    fromDate: params.get('fromDate') ?? '',
    toDate: params.get('toDate') ?? '',
  };
}
