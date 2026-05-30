import { ChangeEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StepProps } from '../wizardTypes';
import type { AttachmentDto } from '../../../types';
import { complaintsApi } from '../../../api/complaints';
import { ApiError } from '../../../api/client';

interface Props extends StepProps {
  draftId: string | null;
  isAuthenticated: boolean;
}

export function StepSupporting({ form, update, draftId, isAuthenticated }: Props) {
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!draftId) return;
    complaintsApi.detail(draftId).then((d) => setAttachments(d.attachments)).catch(() => undefined);
  }, [draftId]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !draftId) return;
    setError(null);
    setUploading(true);
    try {
      const saved = await complaintsApi.uploadAttachment(draftId, file);
      setAttachments((prev) => [...prev, saved]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that file.');
    } finally {
      setUploading(false);
    }
  }

  function setPriorComplaintMade(value: boolean) {
    update({
      priorComplaintMade: value,
      priorComplaintAgency: value ? form.priorComplaintAgency : '',
      priorComplaintDate: value ? form.priorComplaintDate : '',
      priorComplaintStatus: value ? form.priorComplaintStatus : '',
      priorComplaintFinalisedDate: value ? form.priorComplaintFinalisedDate : '',
      priorComplaintOutcome: value ? form.priorComplaintOutcome : '',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Supporting information</h2>
        <p className="mt-1 text-sm text-slate-600">Add any evidence and tell us about other organisations connected to this complaint. This step is optional.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-medium text-navy-900">Evidence files</legend>
        {isAuthenticated ? (
          <>
            <p className="text-sm text-slate-600">Accepted: PDF, JPG, PNG or DOCX, up to 10 MB each.</p>
            <label className="btn-secondary cursor-pointer">
              {uploading ? 'Uploading…' : 'Choose a file'}
              <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={onFile} disabled={uploading || !draftId} />
            </label>
            {error && <p className="error-text">{error}</p>}
            {attachments.length > 0 && (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate">{a.originalFileName}</span>
                    <span className="text-slate-400">{Math.round(a.sizeBytes / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Uploading evidence files requires an account. You can still lodge your complaint anonymously without files, or{' '}
            <Link to="/register" className="font-medium text-accent-700 hover:underline">create an account</Link> to attach evidence.
          </p>
        )}
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 font-semibold text-navy-900">Have you made a complaint to another organisation?</legend>
        <p className="mt-1 text-sm text-slate-600">
          For example, a state anti-discrimination or equal opportunity agency, a workers compensation agency,
          an ombudsman or the Fair Work Commission.
        </p>
        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="priorComplaintMade"
              checked={form.priorComplaintMade === true}
              onChange={() => setPriorComplaintMade(true)}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="priorComplaintMade"
              checked={form.priorComplaintMade === false}
              onChange={() => setPriorComplaintMade(false)}
            />
            <span>No</span>
          </label>
        </div>

        {form.priorComplaintMade === true && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="priorComplaintAgency" className="label">Name of agency</label>
              <input
                id="priorComplaintAgency"
                className="input"
                value={form.priorComplaintAgency}
                onChange={(e) => update({ priorComplaintAgency: e.target.value })}
                placeholder="e.g. Fair Work Commission"
              />
            </div>
            <div>
              <label htmlFor="priorComplaintDate" className="label">Date complaint was made</label>
              <input
                id="priorComplaintDate"
                type="date"
                className="input"
                max={today}
                value={form.priorComplaintDate}
                onChange={(e) => update({ priorComplaintDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="priorComplaintStatus" className="label">Status of complaint</label>
              <input
                id="priorComplaintStatus"
                className="input"
                value={form.priorComplaintStatus}
                onChange={(e) => update({ priorComplaintStatus: e.target.value })}
                placeholder="e.g. In progress, finalised, withdrawn"
              />
            </div>
            <div>
              <label htmlFor="priorComplaintFinalisedDate" className="label">Date complaint was finalised (optional)</label>
              <input
                id="priorComplaintFinalisedDate"
                type="date"
                className="input"
                max={today}
                value={form.priorComplaintFinalisedDate}
                onChange={(e) => update({ priorComplaintFinalisedDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="priorComplaintOutcome" className="label">Outcome of complaint (optional)</label>
              <textarea
                id="priorComplaintOutcome"
                className="input min-h-[90px]"
                value={form.priorComplaintOutcome}
                onChange={(e) => update({ priorComplaintOutcome: e.target.value })}
                placeholder="Tell us what happened with that complaint, if known."
              />
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="refOrg" className="label">Were you referred here by another organisation? (optional)</label>
        <input id="refOrg" className="input" value={form.referringOrganisation}
          onChange={(e) => update({ referringOrganisation: e.target.value })} placeholder="Name of the organisation" />
      </div>
    </div>
  );
}
