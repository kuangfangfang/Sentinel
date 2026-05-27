import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api/complaints';
import { ApiError } from '../../api/client';
import type { GroundDto } from '../../types';
import { Spinner } from '../../components/Spinner';
import { WizardStepIndicator, WIZARD_STEPS } from '../../components/WizardStepIndicator';
import { emptyForm, fromDetail, toWriteDto, type WizardForm } from './wizardTypes';
import { StepAboutYou } from './steps/StepAboutYou';
import { StepRespondents } from './steps/StepRespondents';
import { StepWhatHappened } from './steps/StepWhatHappened';
import { StepSupporting } from './steps/StepSupporting';
import { StepReview } from './steps/StepReview';

export function WizardPage() {
  const { draftId: draftIdParam } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(emptyForm());
  const [serverDraftId, setServerDraftId] = useState<string | null>(draftIdParam ?? null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [loading, setLoading] = useState(Boolean(draftIdParam));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    complaintsApi.getGrounds().then(setGrounds).catch(() => setGrounds([]));
  }, []);

  useEffect(() => {
    if (!draftIdParam) return;
    let active = true;
    setLoading(true);
    complaintsApi
      .detail(draftIdParam)
      .then((detail) => {
        if (!active) return;
        setForm(fromDetail(detail));
        setStep(Math.min(Math.max(detail.wizardStep, 1), 5));
      })
      .catch(() => setErrors(['Could not load this draft.']))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [draftIdParam]);

  const update = (patch: Partial<WizardForm>) => setForm((prev) => ({ ...prev, ...patch }));

  function validateStep(target: number): string[] {
    const e: string[] = [];
    if (target === 1) {
      if (form.onBehalfOf && (!form.onBehalfOf.firstName.trim() || !form.onBehalfOf.lastName.trim()))
        e.push('Please give the first and last name of the person you are complaining for.');
      if (form.representative && (!form.representative.firstName.trim() || !form.representative.lastName.trim()))
        e.push('Please give the first and last name of your representative.');
      if (form.interpreterRequired && !form.preferredLanguage.trim())
        e.push('Please tell us your preferred language for an interpreter.');
    }
    if (target === 2) {
      if (!form.respondents.some((r) => r.name.trim()))
        e.push('Add at least one person or organisation the complaint is about.');
    }
    if (target === 3) {
      if (form.title.trim().length < 5) e.push('Give your complaint a short title (at least 5 characters).');
      if (form.grounds.length === 0) e.push('Select at least one ground of complaint.');
      if (form.description.trim().length < 20) e.push('Describe what happened in at least 20 characters.');
      if (!form.incidentDate) e.push('Enter the date the event happened.');
      else if (form.incidentDate > new Date().toISOString().slice(0, 10)) e.push('The incident date cannot be in the future.');
      if (!form.incidentLocation.trim()) e.push('Enter where it happened.');
    }
    if (target === 5) {
      if (form.genAiUsed === null) e.push('Please answer whether generative AI was used to prepare this complaint.');
      if (!form.privacyNoticeAccepted) e.push('You must confirm you have read the privacy notice before lodging.');
    }
    return e;
  }

  async function ensureDraftId(): Promise<string | null> {
    if (!isAuthenticated) return null;
    if (serverDraftId) return serverDraftId;
    const created = await complaintsApi.createDraft();
    setServerDraftId(created.id);
    return created.id;
  }

  async function persistDraft(currentStep: number) {
    if (!isAuthenticated) return; // anonymous complaints aren't persisted until final submit
    try {
      setSaving(true);
      const id = await ensureDraftId();
      if (id) await complaintsApi.saveDraft(id, toWriteDto(form, currentStep));
    } catch {
      /* draft save is best-effort; data stays in the form */
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (stepErrors.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await persistDraft(Math.min(step + 1, 5));
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveAndExit() {
    await persistDraft(step);
    navigate('/dashboard');
  }

  async function submit() {
    const allErrors = [...validateStep(2), ...validateStep(3), ...validateStep(5)];
    setErrors(allErrors);
    if (allErrors.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = toWriteDto(form, 5);
      const result = isAuthenticated
        ? await complaintsApi.submit((await ensureDraftId())!, payload)
        : await complaintsApi.submitAnonymous(payload);
      navigate('/confirmation', {
        state: { referenceCode: result.referenceCode, isAnonymous: !isAuthenticated },
        replace: true,
      });
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.fieldMessages.length ? err.fieldMessages : [err.message]) : ['Could not lodge your complaint. Please try again.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  const heading = useMemo(() => WIZARD_STEPS.find((s) => s.number === step)?.title ?? '', [step]);

  if (loading) return <Spinner label="Loading your draft…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Lodge a complaint</h1>
      {!isAuthenticated && (
        <div className="card mt-3 border-accent-200 bg-accent-50 p-4 text-sm text-accent-900" role="note">
          You are reporting <strong>anonymously</strong>. Your complaint won’t be linked to an account, so be sure
          to save the reference code shown at the end — it is the only way to track your complaint.
        </div>
      )}

      <div className="mt-6">
        <WizardStepIndicator current={step} />
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </div>
      )}

      <section className="card p-6" aria-label={`Step ${step}: ${heading}`}>
        {step === 1 && <StepAboutYou form={form} update={update} errors={errors} />}
        {step === 2 && <StepRespondents form={form} update={update} errors={errors} />}
        {step === 3 && <StepWhatHappened form={form} update={update} errors={errors} groundsCatalog={grounds} />}
        {step === 4 && <StepSupporting form={form} update={update} errors={errors} draftId={serverDraftId} isAuthenticated={isAuthenticated} />}
        {step === 5 && <StepReview form={form} update={update} errors={errors} groundsCatalog={grounds} />}
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {step > 1 && (
            <button type="button" className="btn-secondary" onClick={goBack} disabled={submitting}>
              ← Back
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isAuthenticated && (
            <button type="button" className="btn-ghost" onClick={saveAndExit} disabled={saving || submitting}>
              {saving ? 'Saving…' : 'Save & finish later'}
            </button>
          )}
          {step < 5 ? (
            <button type="button" className="btn-primary" onClick={goNext} disabled={saving}>
              Save & continue →
            </button>
          ) : (
            <button
              type="button"
              className={form.privacyNoticeAccepted ? 'btn-primary' : 'btn-locked'}
              onClick={submit}
              disabled={submitting}
              aria-disabled={!form.privacyNoticeAccepted}
              title={form.privacyNoticeAccepted ? undefined : 'Please tick the privacy collection notice box above to enable.'}
            >
              {submitting ? 'Lodging…' : 'Lodge complaint'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
