import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { complaintsApi } from '../../api/complaints';
import type { ComplaintDetailDto, GroundDto } from '../../types';
import { Spinner } from '../../components/Spinner';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusTimeline } from '../../components/StatusTimeline';
import { formatDateOnly, formatDateTime } from '../../utils/format';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<ComplaintDetailDto | null>(null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    complaintsApi.detail(id).then(setComplaint).catch(() => setError("We couldn't load this complaint."));
    complaintsApi.getGrounds().then(setGrounds).catch(() => undefined);
  }, [id]);

  const labelFor = (value: string) => grounds.find((g) => g.value === value)?.label ?? value;

  async function download(attachmentId: string, name: string) {
    if (!id) return;
    try {
      const blob = await complaintsApi.downloadAttachment(id, attachmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download that file.');
    }
  }

  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>;
  if (!complaint) return <Spinner />;

  const contact = complaint.complainantContact;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/dashboard" className="text-sm font-medium text-accent-700 hover:underline">Back to my complaints</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {complaint.referenceCode && <p className="font-mono text-sm text-slate-500">{complaint.referenceCode}</p>}
          <h1 className="text-2xl font-bold">{complaint.title}</h1>
          <p className="text-sm text-slate-500">Lodged {formatDateTime(complaint.submittedAt)}</p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

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
          {complaint.interpreterRequired && (
            <DetailGroup title="Interpreter" items={[['Language', complaint.preferredLanguage || 'language not specified']]} />
          )}
          {complaint.onBehalfOf && (
            <DetailGroup
              title="On behalf of"
              items={[
                ['Name', formatName(complaint.onBehalfOf.firstName, complaint.onBehalfOf.lastName)],
                ['Email', complaint.onBehalfOf.email],
                ['Relationship', complaint.onBehalfOf.relationshipToComplainant],
                ['Assistance', complaint.onBehalfOf.assistanceRequired],
              ]}
            />
          )}
          {complaint.representative && (
            <DetailGroup
              title="Representative"
              items={[
                ['Name', joinParts([complaint.representative.title, formatName(complaint.representative.firstName, complaint.representative.lastName)])],
                ['Position', complaint.representative.position],
                ['Organisation', complaint.representative.organisation],
                ['Address', formatAddress(complaint.representative)],
                ['Email', complaint.representative.email],
                ['Mobile', complaint.representative.mobile],
                ['Assistance', complaint.representative.assistanceRequired],
              ]}
            />
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-navy-900">Details</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Grounds</dt>
            <dd>{complaint.grounds.map((g) => labelFor(g.groundType)).join(', ') || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">What happened</dt>
            <dd className="whitespace-pre-wrap">{complaint.description}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><dt className="font-medium text-slate-500">When</dt><dd>{formatDateOnly(complaint.incidentDate)}</dd></div>
            <div><dt className="font-medium text-slate-500">Where exactly</dt><dd>{complaint.incidentLocation}</dd></div>
          </div>
          {complaint.desiredOutcome && (
            <div><dt className="font-medium text-slate-500">Desired outcome</dt><dd>{complaint.desiredOutcome}</dd></div>
          )}
          {complaint.priorComplaintMade !== null && complaint.priorComplaintMade !== undefined && (
            <div>
              <dt className="font-medium text-slate-500">Complaint to another organisation</dt>
              <dd>{complaint.priorComplaintMade ? 'Yes' : 'No'}</dd>
            </div>
          )}
          {complaint.priorComplaintMade && (
            <div>
              <dt className="font-medium text-slate-500">Other complaint details</dt>
              <dd className="space-y-1">
                {complaint.priorComplaintAgency && <p>Agency: {complaint.priorComplaintAgency}</p>}
                {complaint.priorComplaintDate && <p>Date made: {formatDateOnly(complaint.priorComplaintDate)}</p>}
                {complaint.priorComplaintStatus && <p>Status: {complaint.priorComplaintStatus}</p>}
                {complaint.priorComplaintFinalisedDate && <p>Finalised: {formatDateOnly(complaint.priorComplaintFinalisedDate)}</p>}
                {complaint.priorComplaintOutcome && <p className="whitespace-pre-wrap">Outcome: {complaint.priorComplaintOutcome}</p>}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-slate-500">Respondents</dt>
            <dd className="space-y-3">
              {complaint.respondents.map((r, i) => (
                <DetailGroup
                  key={`${r.name}-${i}`}
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
              ))}
              {complaint.respondents.length === 0 && '-'}
            </dd>
          </div>
        </dl>
      </section>

      {complaint.attachments.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-navy-900">Evidence files</h2>
          <ul className="divide-y divide-slate-100">
            {complaint.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{a.originalFileName}</span>
                <button className="font-medium text-accent-700 hover:underline" onClick={() => download(a.id, a.originalFileName)}>
                  Download
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-navy-900">Status history</h2>
        <StatusTimeline history={complaint.statusHistory} />
      </section>
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
