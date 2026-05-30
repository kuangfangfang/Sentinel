import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { caseworkerApi } from '../../api/caseworker';
import { complaintsApi } from '../../api/complaints';
import { ApiError } from '../../api/client';
import type { CaseworkerComplaintDetailDto, ComplaintStatus, GroundDto, Severity } from '../../types';
import { Spinner } from '../../components/Spinner';
import { SeverityBadge, StatusBadge } from '../../components/StatusBadge';
import { StatusTimeline } from '../../components/StatusTimeline';
import { formatDateOnly, formatDateTime } from '../../utils/format';
import { allowedNextStatuses } from '../../utils/statusTransitions';

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export function CaseworkerComplaintDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<CaseworkerComplaintDetailDto | null>(null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<ComplaintStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    caseworkerApi.detail(id).then(setData).catch(() => setError('Could not load this complaint.'));
    complaintsApi.getGrounds().then(setGrounds).catch(() => undefined);
  }, [id]);

  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>;
  if (!data) return <Spinner />;

  const c = data.complaint;
  const labelFor = (value: string) => grounds.find((g) => g.value === value)?.label ?? value;
  const nextOptions = allowedNextStatuses(c.status);

  async function changeStatus(e: FormEvent) {
    e.preventDefault();
    if (!id || !statusTarget) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await caseworkerApi.changeStatus(id, statusTarget, statusNote.trim() || undefined);
      setData(updated);
      setStatusTarget('');
      setStatusNote('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  }

  async function setSeverity(severity: Severity) {
    if (!id) return;
    setBusy(true);
    try {
      setData(await caseworkerApi.setSeverity(id, severity));
    } catch {
      setError('Could not set severity.');
    } finally {
      setBusy(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !noteBody.trim()) return;
    setBusy(true);
    try {
      const note = await caseworkerApi.addNote(id, noteBody.trim());
      setData((prev) => (prev ? { ...prev, caseNotes: [note, ...prev.caseNotes] } : prev));
      setNoteBody('');
    } catch {
      setError('Could not add the note.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/caseworker/queue" className="text-sm font-medium text-accent-700 hover:underline">← Back to queue</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {c.referenceCode && <p className="font-mono text-sm text-slate-500">{c.referenceCode}</p>}
          <h1 className="text-2xl font-bold">{c.title}</h1>
          <p className="text-sm text-slate-500">
            {c.isAnonymous ? 'Anonymous complainant' : 'Registered complainant'} · Lodged {formatDateTime(c.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <SeverityBadge severity={c.severity} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Complaint</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-medium text-slate-500">Grounds</dt>
                <dd>{c.grounds.map((g) => labelFor(g.groundType) + (g.conditionalDetail ? ` (${g.conditionalDetail})` : '')).join(', ') || '—'}</dd></div>
              <div><dt className="font-medium text-slate-500">What happened</dt>
                <dd className="whitespace-pre-wrap">{c.description}</dd></div>
              <div className="grid grid-cols-2 gap-3">
                <div><dt className="font-medium text-slate-500">When</dt><dd>{formatDateOnly(c.incidentDate)}</dd></div>
                <div><dt className="font-medium text-slate-500">Where exactly</dt><dd>{c.incidentLocation}</dd></div>
              </div>
              {c.desiredOutcome && <div><dt className="font-medium text-slate-500">Desired outcome</dt><dd>{c.desiredOutcome}</dd></div>}
              {c.priorComplaintMade !== null && c.priorComplaintMade !== undefined && (
                <div>
                  <dt className="font-medium text-slate-500">Complaint to another organisation</dt>
                  <dd>{c.priorComplaintMade ? 'Yes' : 'No'}</dd>
                </div>
              )}
              {c.priorComplaintMade && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="font-medium text-slate-500">Other complaint details</dt>
                  <dd className="mt-1 space-y-1">
                    {c.priorComplaintAgency && <p>Agency: {c.priorComplaintAgency}</p>}
                    {c.priorComplaintDate && <p>Date made: {formatDateOnly(c.priorComplaintDate)}</p>}
                    {c.priorComplaintStatus && <p>Status: {c.priorComplaintStatus}</p>}
                    {c.priorComplaintFinalisedDate && <p>Finalised: {formatDateOnly(c.priorComplaintFinalisedDate)}</p>}
                    {c.priorComplaintOutcome && <p className="whitespace-pre-wrap">Outcome: {c.priorComplaintOutcome}</p>}
                  </dd>
                </div>
              )}
              {c.interpreterRequired && <div><dt className="font-medium text-slate-500">Interpreter</dt><dd>Yes — {c.preferredLanguage || 'language not specified'}</dd></div>}
              <div><dt className="font-medium text-slate-500">GenAI used</dt><dd>{c.genAiUsed === null ? '—' : c.genAiUsed ? 'Yes' : 'No'}</dd></div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Respondents</h2>
            <ul className="space-y-2 text-sm">
              {c.respondents.map((r, i) => (
                <li key={i} className="rounded border border-slate-100 p-3">
                  <p className="font-medium text-navy-900">{r.name}</p>
                  <p className="text-slate-600">{[r.relationshipToComplainant, r.suburb, r.state].filter(Boolean).join(' · ')}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Internal case notes — caseworker-only (FR-34, AC-10) */}
          <section className="card p-5">
            <h2 className="font-semibold text-navy-900">Internal case notes</h2>
            <p className="text-xs text-slate-400">Visible to caseworkers only. Never shown to the complainant.</p>
            <form onSubmit={addNote} className="mt-3 space-y-2">
              <label htmlFor="note" className="sr-only">Add a case note</label>
              <textarea id="note" className="input min-h-[80px]" value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)} placeholder="Add an internal note…" />
              <button type="submit" className="btn-secondary" disabled={busy || !noteBody.trim()}>Add note</button>
            </form>
            <ul className="mt-4 space-y-3">
              {data.caseNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.authorName} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
              {data.caseNotes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
            </ul>
          </section>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Change status</h2>
            {nextOptions.length === 0 ? (
              <p className="text-sm text-slate-500">This complaint is in a final state.</p>
            ) : (
              <form onSubmit={changeStatus} className="space-y-3">
                <div>
                  <label htmlFor="statusTarget" className="label">New status</label>
                  <select id="statusTarget" className="input" value={statusTarget}
                    onChange={(e) => setStatusTarget(e.target.value as ComplaintStatus)}>
                    <option value="">Choose…</option>
                    {nextOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="statusNote" className="label">Note (optional)</label>
                  <input id="statusNote" className="input" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={busy || !statusTarget}>Update status</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Severity</h2>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <button key={s} type="button" disabled={busy}
                  className={`btn ${c.severity === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSeverity(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Status history</h2>
            <StatusTimeline history={c.statusHistory} />
          </section>
        </div>
      </div>
    </div>
  );
}
