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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Supporting information</h2>
        <p className="mt-1 text-sm text-slate-600">Add any evidence and tell us if another organisation referred you. This step is optional.</p>
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

      <div>
        <label htmlFor="refOrg" className="label">Were you referred here by another organisation? (optional)</label>
        <input id="refOrg" className="input" value={form.referringOrganisation}
          onChange={(e) => update({ referringOrganisation: e.target.value })} placeholder="Name of the organisation" />
      </div>
    </div>
  );
}
