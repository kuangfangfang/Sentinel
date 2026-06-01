import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import type { StepProps, WizardForm } from '../wizardTypes';
import type { AttachmentDto } from '../../../types';
import { complaintsApi } from '../../../api/complaints';
import { ApiError } from '../../../api/client';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { isAfter, isValid, parse } from 'date-fns';

interface Props extends StepProps {
  draftId: string | null;
  isAuthenticated: boolean;
}

const RHF_UPDATE = { shouldDirty: true, shouldValidate: true };

export function StepSupporting({ draftId, isAuthenticated }: Props) {
  const { register, setValue, control } = useFormContext<WizardForm>();
  const form = useWatch({ control }) as WizardForm;
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priorComplaintDateError, setPriorComplaintDateError] = useState(false);
  const [priorComplaintFinalisedDateError, setPriorComplaintFinalisedDateError] = useState(false);

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
    setValue('priorComplaintMade', value, RHF_UPDATE);
    if (!value) {
      setValue('priorComplaintAgency', '', RHF_UPDATE);
      setValue('priorComplaintDate', '', RHF_UPDATE);
      setValue('priorComplaintStatus', '', RHF_UPDATE);
      setValue('priorComplaintFinalisedDate', '', RHF_UPDATE);
      setValue('priorComplaintOutcome', '', RHF_UPDATE);
    }
  }

  function applyPriorComplaintDate(date: Date | null) {
    setPriorComplaintDateError(false);
    setValue('priorComplaintDate', date ? toIsoDate(date) : '', RHF_UPDATE);
  }

  function applyPriorComplaintFinalisedDate(date: Date | null) {
    setPriorComplaintFinalisedDateError(false);
    setValue('priorComplaintFinalisedDate', date ? toIsoDate(date) : '', RHF_UPDATE);
  }

  function applyPriorComplaintDateInput(value: string) {
    const parsed = parseDisplayDate(value);
    if (!parsed) {
      setPriorComplaintDateError(true);
      return;
    }

    applyPriorComplaintDate(parsed);
  }

  function applyPriorComplaintFinalisedDateInput(value: string) {
    const parsed = parseDisplayDate(value);
    if (!parsed) {
      setPriorComplaintFinalisedDateError(true);
      return;
    }

    applyPriorComplaintFinalisedDate(parsed);
  }

  function handlePriorComplaintDateBlur(e: FocusEvent<HTMLInputElement>) {
    if (!e.target.value) {
      applyPriorComplaintDate(null);
      return;
    }
    applyPriorComplaintDateInput(e.target.value);
  }

  function handlePriorComplaintFinalisedDateBlur(e: FocusEvent<HTMLInputElement>) {
    if (!e.target.value) {
      applyPriorComplaintFinalisedDate(null);
      return;
    }
    applyPriorComplaintFinalisedDateInput(e.target.value);
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
              {uploading ? 'Uploading...' : 'Choose a file'}
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
                placeholder="e.g. Fair Work Commission"
                {...register('priorComplaintAgency')}
              />
            </div>
            <div>
              <label htmlFor="priorComplaintDate" className="label">Date complaint was made</label>
              <ReactDatePicker
                id="priorComplaintDate"
                selected={form.priorComplaintDate ? new Date(`${form.priorComplaintDate}T00:00:00`) : null}
                onChange={(date: Date | null) => applyPriorComplaintDate(date)}
                onChangeRaw={() => setPriorComplaintDateError(false)}
                onBlur={handlePriorComplaintDateBlur}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className={`input ${priorComplaintDateError ? 'datepicker-error' : ''}`}
                placeholderText="dd/MM/yyyy"
                shouldCloseOnSelect
                showPopperArrow={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
              />
              {priorComplaintDateError && <p className="help text-red-600">Please enter a valid date (DD/MM/YYYY) on or before today.</p>}
            </div>
            <div>
              <label htmlFor="priorComplaintStatus" className="label">Status of complaint</label>
              <select id="priorComplaintStatus" className="input" {...register('priorComplaintStatus')}>
                <option value="">Select status</option>
                <option value="In progress">In progress</option>
                <option value="Finalised">Finalised</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label htmlFor="priorComplaintFinalisedDate" className="label">Date complaint was finalised (optional)</label>
              <ReactDatePicker
                id="priorComplaintFinalisedDate"
                selected={form.priorComplaintFinalisedDate ? new Date(`${form.priorComplaintFinalisedDate}T00:00:00`) : null}
                onChange={(date: Date | null) => applyPriorComplaintFinalisedDate(date)}
                onChangeRaw={() => setPriorComplaintFinalisedDateError(false)}
                onBlur={handlePriorComplaintFinalisedDateBlur}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className={`input ${priorComplaintFinalisedDateError ? 'datepicker-error' : ''}`}
                placeholderText="dd/MM/yyyy"
                shouldCloseOnSelect
                showPopperArrow={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
              />
              {priorComplaintFinalisedDateError && <p className="help text-red-600">Please enter a valid date (DD/MM/YYYY) on or before today.</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="priorComplaintOutcome" className="label">Outcome of complaint (optional)</label>
              <textarea
                id="priorComplaintOutcome"
                className="input min-h-[90px]"
                placeholder="Tell us what happened with that complaint, if known."
                {...register('priorComplaintOutcome')}
              />
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="refOrg" className="label">Were you referred here by another organisation? (optional)</label>
        <input id="refOrg" className="input" placeholder="Name of the organisation" {...register('referringOrganisation')} />
      </div>
    </div>
  );
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDisplayDate(value: string): Date | null {
  const parsed = parse(value, 'dd/MM/yyyy', new Date());
  return isValid(parsed) && !isAfter(parsed, new Date()) ? parsed : null;
}
