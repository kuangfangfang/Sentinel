import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useLocation, useParams } from 'react-router-dom';
import { caseworkerApi } from '../../api/caseworker';
import { complaintsApi } from '../../api/complaints';
import { ApiError } from '../../api/client';
import type { CaseworkerComplaintDetailDto, CaseworkerOptionDto, ComplaintStatus, GroundDto, Severity } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CaseworkerPageHeader } from '../../components/CaseworkerPageHeader';
import { Spinner } from '../../components/Spinner';
import { SeverityBadge, StatusBadge } from '../../components/StatusBadge';
import { StatusTimeline } from '../../components/StatusTimeline';
import { formatDateOnly, formatDateTime } from '../../utils/format';
import { allowedNextStatuses } from '../../utils/statusTransitions';
import { caseNoteSchema, statusChangeSchema } from '../../validation/schemas';
import { readQueueReturnState } from './queueNavigation';

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
type CaseNoteFormData = z.infer<typeof caseNoteSchema>;
type StatusChangeFormData = z.infer<typeof statusChangeSchema>;

export function CaseworkerComplaintDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const queueReturn = readQueueReturnState(location.state);
  const queueReturnTo = `/caseworker/queue${queueReturn?.queueSearch ?? ''}`;
  const [data, setData] = useState<CaseworkerComplaintDetailDto | null>(null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [caseworkers, setCaseworkers] = useState<CaseworkerOptionDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [draftAssigneeId, setDraftAssigneeId] = useState<string | null | undefined>(undefined);
  const [draftSeverity, setDraftSeverity] = useState<Severity | null | undefined>(undefined);
  const noteForm = useForm<CaseNoteFormData>({
    resolver: zodResolver(caseNoteSchema),
    defaultValues: { body: '' },
    mode: 'onChange',
  });
  const statusForm = useForm<StatusChangeFormData>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: { statusTarget: '', statusNote: '' },
    mode: 'onChange',
  });
  const noteBody = noteForm.watch('body');
  const statusTarget = statusForm.watch('statusTarget');

  useEffect(() => {
    if (!id) return;
    caseworkerApi.detail(id).then(setData).catch(() => setLoadError('Could not load this complaint.'));
    complaintsApi.getGrounds().then(setGrounds).catch(() => undefined);
    caseworkerApi.listCaseworkers().then(setCaseworkers).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!data) return;
    setDraftAssigneeId(data.complaint.assignedToUserId ?? null);
    setDraftSeverity(data.complaint.severity ?? null);
  }, [data?.complaint.id, data?.complaint.assignedToUserId, data?.complaint.severity]);

  function resetFeedback() {
    setActionError(null);
    setSuccess(null);
  }

  if (loadError) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{loadError}</div>;
  if (!data) return <Spinner />;

  const c = data.complaint;
  const contact = c.complainantContact;
  const labelFor = (value: string) => grounds.find((g) => g.value === value)?.label ?? value;
  const nextOptions = allowedNextStatuses(c.status);
  const savedAssigneeId = c.assignedToUserId ?? null;
  const savedSeverity = c.severity ?? null;
  const currentDraftAssignee = draftAssigneeId === undefined ? savedAssigneeId : draftAssigneeId;
  const currentDraftSeverity = draftSeverity === undefined ? savedSeverity : draftSeverity;
  const assigneeDirty = currentDraftAssignee !== savedAssigneeId;
  const severityDirty = currentDraftSeverity !== savedSeverity;

  async function changeStatus(data: StatusChangeFormData) {
    if (!id) return;
    setBusy(true);
    resetFeedback();
    try {
      const updated = await caseworkerApi.changeStatus(
        id,
        data.statusTarget as ComplaintStatus,
        data.statusNote.trim() || undefined,
      );
      setData(updated);
      statusForm.reset({ statusTarget: '', statusNote: '' });
      setSuccess(`Status changed to ${updated.complaint.status}.`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  }

  async function applySeverity(severity: Severity) {
    if (!id) return;
    setBusy(true);
    resetFeedback();
    try {
      const updated = await caseworkerApi.setSeverity(id, severity);
      setData(updated);
      setSuccess(`Severity set to ${severity}.`);
    } catch {
      setActionError('Could not set severity.');
    } finally {
      setBusy(false);
    }
  }

  async function addNote(data: CaseNoteFormData) {
    if (!id) return;
    setBusy(true);
    resetFeedback();
    try {
      const note = await caseworkerApi.addNote(id, data.body.trim());
      setData((prev) => (prev ? { ...prev, caseNotes: [note, ...prev.caseNotes] } : prev));
      noteForm.reset({ body: '' });
      setSuccess('Case note added.');
    } catch {
      setActionError('Could not add the note.');
    } finally {
      setBusy(false);
    }
  }

  async function download(attachmentId: string, name: string) {
    if (!id) return;
    resetFeedback();
    try {
      const blob = await complaintsApi.downloadAttachment(id, attachmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionError('Could not download that file.');
    }
  }

  async function assign(assigneeUserId: string | null) {
    if (!id) return;
    setBusy(true);
    resetFeedback();
    try {
      const updated = await caseworkerApi.assign(id, assigneeUserId);
      setData(updated);
      setSuccess(updated.complaint.assignedToName
        ? `Assigned to ${updated.complaint.assignedToName}.`
        : 'Complaint unassigned.');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update the assignment.');
    } finally {
      setBusy(false);
    }
  }

  const breadcrumbLeaf = c.referenceCode ?? (c.title.length > 48 ? `${c.title.slice(0, 48)}…` : c.title);

  return (
    <div className="space-y-6">
      <CaseworkerPageHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/caseworker' },
          { label: 'Triage queue', to: queueReturnTo, state: id ? { focusComplaintId: id } : undefined },
          { label: breadcrumbLeaf },
        ]}
        title={c.title}
      >
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-slate-500">
            {c.isAnonymous ? 'Anonymous complainant' : 'Registered complainant'} - Lodged {formatDateTime(c.submittedAt)}
          </p>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
          </div>
        </div>
      </CaseworkerPageHeader>

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
          <span>{success}</span>
          <button type="button" className="font-medium hover:underline" onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}
      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          <span>{actionError}</span>
          <button type="button" className="font-medium hover:underline" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">People and contact details</h2>
            <div className="space-y-4 text-sm">
              <DetailGroup
                title="Complainant"
                items={[
                  ['Name', joinParts([contact?.title, formatName(contact?.firstName, contact?.lastName)])],
                  ['Email', contact?.email],
                  ['Address', formatAddress(contact)],
                  ['Mobile', contact?.phoneBh || contact?.phoneAh],
                  ['Assistance', contact?.assistanceRequired],
                ]}
              />
              {c.interpreterRequired && (
                <DetailGroup title="Interpreter" items={[['Language', c.preferredLanguage || 'language not specified']]} />
              )}
              {c.onBehalfOf && (
                <DetailGroup
                  title="On behalf of"
                  items={[
                    ['Name', formatName(c.onBehalfOf.firstName, c.onBehalfOf.lastName)],
                    ['Email', c.onBehalfOf.email],
                    ['Relationship', c.onBehalfOf.relationshipToComplainant],
                    ['Assistance', c.onBehalfOf.assistanceRequired],
                  ]}
                />
              )}
              {c.representative && (
                <DetailGroup
                  title="Representative"
                  items={[
                    ['Name', joinParts([c.representative.title, formatName(c.representative.firstName, c.representative.lastName)])],
                    ['Position', c.representative.position],
                    ['Organisation', c.representative.organisation],
                    ['Address', formatAddress(c.representative)],
                    ['Email', c.representative.email],
                    ['Mobile', c.representative.mobile],
                    ['Assistance', c.representative.assistanceRequired],
                  ]}
                />
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Complaint</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Grounds</dt>
                <dd>{c.grounds.map((g) => labelFor(g.groundType) + (g.conditionalDetail ? ` (${g.conditionalDetail})` : '')).join(', ') || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">What happened</dt>
                <dd className="whitespace-pre-wrap">{c.description}</dd>
              </div>
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
              <div><dt className="font-medium text-slate-500">GenAI used</dt><dd>{c.genAiUsed === null ? '-' : c.genAiUsed ? 'Yes' : 'No'}</dd></div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Respondents</h2>
            <ul className="space-y-3 text-sm">
              {c.respondents.map((r, i) => (
                <li key={`${r.name}-${i}`}>
                  <DetailGroup
                    title={r.name}
                    items={[
                      ['ABN / ACN', r.abnAcn],
                      ['Relationship', r.relationshipToComplainant],
                      ['Address', formatAddress(r)],
                      ['Email', r.contactEmail],
                      ['Phone (BH)', r.contactPhone],
                      ['Mobile', r.mobile],
                    ]}
                  />
                </li>
              ))}
              {c.respondents.length === 0 && <li className="text-sm text-slate-400">No respondents.</li>}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Evidence files</h2>
            {c.attachments.length === 0 ? (
              <p className="text-sm text-slate-400">No evidence files were attached.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {c.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{a.originalFileName}</span>
                    <button
                      type="button"
                      className="font-medium text-accent-700 hover:underline"
                      onClick={() => download(a.id, a.originalFileName)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-navy-900">Internal case notes</h2>
            <p className="text-xs text-slate-400">Visible to caseworkers only. Never shown to the complainant.</p>
            <form onSubmit={noteForm.handleSubmit(addNote)} className="mt-3 space-y-2">
              <label htmlFor="note" className="sr-only">Add a case note</label>
              <textarea
                id="note"
                className="input min-h-[80px]"
                placeholder="Add an internal note"
                {...noteForm.register('body')}
              />
              {noteForm.formState.errors.body && (
                <p className="error-text">{noteForm.formState.errors.body.message}</p>
              )}
              <button type="submit" className="btn-secondary" disabled={busy || !noteBody.trim()}>Add note</button>
            </form>
            <ul className="mt-4 space-y-3">
              {data.caseNotes.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.authorName} - {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
              {data.caseNotes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Assigned caseworker</h2>
            <p className="text-sm text-slate-600">
              {c.assignedToName ? c.assignedToName : <span className="text-slate-400">Unassigned</span>}
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="assignee" className="label">Reassign to</label>
                <select
                  id="assignee"
                  className="input"
                  value={currentDraftAssignee ?? ''}
                  disabled={busy}
                  onChange={(e) => setDraftAssigneeId(e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {caseworkers.map((cw) => <option key={cw.id} value={cw.id}>{cw.name}</option>)}
                </select>
              </div>
              {assigneeDirty && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => assign(currentDraftAssignee)}
                  >
                    Update assignment
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={() => setDraftAssigneeId(savedAssigneeId)}
                  >
                    Reset
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {user && c.assignedToUserId !== user.id && (
                  <button type="button" className="btn-secondary" disabled={busy} onClick={() => assign(user.id)}>
                    Claim to me
                  </button>
                )}
                {c.assignedToUserId && (
                  <button type="button" className="btn-ghost" disabled={busy} onClick={() => assign(null)}>
                    Unassign
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Change status</h2>
            {nextOptions.length === 0 ? (
              <p className="text-sm text-slate-500">This complaint is in a final state.</p>
            ) : (
              <form onSubmit={statusForm.handleSubmit(changeStatus)} className="space-y-3">
                <div>
                  <label htmlFor="statusTarget" className="label">New status</label>
                  <select
                    id="statusTarget"
                    className="input"
                    {...statusForm.register('statusTarget')}
                  >
                    <option value="">Choose</option>
                    {nextOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {statusForm.formState.errors.statusTarget && (
                    <p className="error-text">{statusForm.formState.errors.statusTarget.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="statusNote" className="label">Note (optional)</label>
                  <input id="statusNote" className="input" {...statusForm.register('statusNote')} />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={busy || !statusTarget}>Update status</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900">Severity</h2>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => {
                const isSaved = savedSeverity === s;
                const isPending = severityDirty && currentDraftSeverity === s;
                const className = isPending
                  ? 'btn btn-secondary ring-2 ring-accent-500'
                  : isSaved
                    ? 'btn btn-primary'
                    : 'btn btn-secondary';
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    className={className}
                    onClick={() => setDraftSeverity(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {severityDirty && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy || currentDraftSeverity == null}
                  onClick={() => currentDraftSeverity && applySeverity(currentDraftSeverity)}
                >
                  Update severity
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => setDraftSeverity(savedSeverity)}
                >
                  Reset
                </button>
              </div>
            )}
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

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(', ');
}

function formatName(firstName?: string | null, lastName?: string | null): string {
  return joinParts([firstName, lastName]);
}

function formatAddress(value?: { addressLine?: string | null; suburb?: string | null; state?: string | null; postcode?: string | null } | null): string {
  if (!value) return '';
  return joinParts([value.addressLine, value.suburb, value.state, value.postcode]);
}

function DetailGroup({ title, items }: { title: string; items: Array<[string, string | null | undefined]> }) {
  const visible = items.filter(([, value]) => Boolean(value));
  return (
    <div className="rounded border border-slate-100 p-3">
      <p className="font-medium text-navy-900">{title}</p>
      {visible.length === 0 ? (
        <p className="mt-1 text-slate-400">Not provided</p>
      ) : (
        <dl className="mt-1 space-y-1">
          {visible.map(([label, value]) => (
            <div key={label}>
              <dt className="inline font-medium text-slate-500">{label}: </dt>
              <dd className="inline">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
