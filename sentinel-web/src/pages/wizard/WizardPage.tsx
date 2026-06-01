import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch, type FieldErrors, type Path, type Resolver } from 'react-hook-form';
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
import { createWizardSchema } from '../../validation/schemas';

const STEP_FIELDS: Record<number, Array<Path<WizardForm>>> = {
  1: ['complainantContact', 'interpreterRequired', 'preferredLanguage', 'onBehalfOf', 'representative'],
  2: ['respondents'],
  3: ['title', 'grounds', 'description', 'incidentDate', 'incidentLocation', 'delayReason', 'desiredOutcome'],
  4: [
    'priorComplaintMade',
    'priorComplaintAgency',
    'priorComplaintDate',
    'priorComplaintStatus',
    'priorComplaintFinalisedDate',
    'priorComplaintOutcome',
    'referringOrganisation',
  ],
  5: ['genAiUsed', 'privacyNoticeAccepted'],
};

export function WizardPage() {
  const { draftId: draftIdParam } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const wizardSchema = useMemo(() => createWizardSchema({ isAuthenticated, step }), [isAuthenticated, step]);
  const methods = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema) as Resolver<WizardForm>,
    defaultValues: emptyForm(),
    mode: 'onChange',
  });
  const { control, formState, getValues, reset, trigger } = methods;
  const form = useWatch({ control }) as WizardForm;

  const [serverDraftId, setServerDraftId] = useState<string | null>(draftIdParam ?? null);
  const [grounds, setGrounds] = useState<GroundDto[]>([]);
  const [loading, setLoading] = useState(Boolean(draftIdParam));
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    complaintsApi.getGrounds().then(setGrounds).catch(() => setGrounds([]));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user || draftIdParam) return;

    const current = getValues();
    if (
      current.complainantContact.firstName ||
      current.complainantContact.lastName ||
      current.complainantContact.email
    ) {
      return;
    }

    const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
    reset({
      ...current,
      complainantContact: {
        ...current.complainantContact,
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
        email: user.email,
      },
    });
  }, [draftIdParam, getValues, isAuthenticated, reset, user]);

  useEffect(() => {
    if (!draftIdParam) return;
    let active = true;
    setLoading(true);
    complaintsApi
      .detail(draftIdParam)
      .then((detail) => {
        if (!active) return;
        reset(fromDetail(detail));
        setStep(Math.min(Math.max(detail.wizardStep, 1), 5));
      })
      .catch(() => setServerErrors(['Could not load this draft.']))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [draftIdParam, reset]);

  async function triggerStepValidation(target: number): Promise<boolean> {
    setServerErrors([]);
    return trigger(STEP_FIELDS[target] ?? undefined, { shouldFocus: true });
  }

  async function ensureDraftId(): Promise<string | null> {
    if (!isAuthenticated) return null;
    if (serverDraftId) return serverDraftId;
    const created = await complaintsApi.createDraft();
    setServerDraftId(created.id);
    return created.id;
  }

  async function persistDraft(currentStep: number) {
    if (!isAuthenticated) return;
    try {
      setSaving(true);
      const id = await ensureDraftId();
      if (id) await complaintsApi.saveDraft(id, toWriteDto(getValues(), currentStep));
    } catch {
      /* draft save is best-effort; data stays in the form */
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    const isValid = await triggerStepValidation(step);
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await persistDraft(Math.min(step + 1, 5));
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setServerErrors([]);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveAndExit() {
    await persistDraft(step);
    navigate('/dashboard');
  }

  async function submit() {
    setServerErrors([]);
    const parsed = createWizardSchema({ isAuthenticated, validateAll: true }).safeParse(getValues());
    if (!parsed.success) {
      setServerErrors([...new Set(parsed.error.issues.map((issue) => issue.message))]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = toWriteDto(parsed.data as WizardForm, 5);
      const result = isAuthenticated
        ? await complaintsApi.submit((await ensureDraftId())!, payload)
        : await complaintsApi.submitAnonymous(payload);
      navigate('/confirmation', {
        state: { referenceCode: result.referenceCode, isAnonymous: !isAuthenticated },
        replace: true,
      });
    } catch (err) {
      setServerErrors(
        err instanceof ApiError
          ? err.fieldMessages.length
            ? err.fieldMessages
            : [err.message]
          : ['Could not lodge your complaint. Please try again.'],
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  const heading = useMemo(() => WIZARD_STEPS.find((s) => s.number === step)?.title ?? '', [step]);
  const clientErrors = useMemo(() => collectErrorMessages(formState.errors), [formState.errors]);
  const errors = [...clientErrors, ...serverErrors];

  if (loading) return <Spinner label="Loading your draft..." />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Lodge a complaint</h1>
      {!isAuthenticated && (
        <div className="card mt-3 border-accent-200 bg-accent-50 p-4 text-sm text-accent-900" role="note">
          You are reporting <strong>anonymously</strong>. Your complaint will not be linked to an account, so be sure
          to save the reference code shown at the end. It is the only way to track your complaint.
        </div>
      )}

      <div className="mt-6">
        <WizardStepIndicator current={step} />
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert" aria-live="assertive">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((msg, i) => <li key={`${msg}-${i}`}>{msg}</li>)}
          </ul>
        </div>
      )}

      <FormProvider {...methods}>
        <section className="card p-6" aria-label={`Step ${step}: ${heading}`}>
          {step === 1 && <StepAboutYou isAuthenticated={isAuthenticated} />}
          {step === 2 && <StepRespondents />}
          {step === 3 && <StepWhatHappened groundsCatalog={grounds} />}
          {step === 4 && <StepSupporting draftId={serverDraftId} isAuthenticated={isAuthenticated} />}
          {step === 5 && <StepReview groundsCatalog={grounds} />}
        </section>
      </FormProvider>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {step > 1 && (
            <button type="button" className="btn-secondary" onClick={goBack} disabled={submitting}>
              Back
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isAuthenticated && (
            <button type="button" className="btn-ghost" onClick={saveAndExit} disabled={saving || submitting}>
              {saving ? 'Saving...' : 'Save & finish later'}
            </button>
          )}
          {step < 5 ? (
            <button type="button" className="btn-primary" onClick={goNext} disabled={saving}>
              Save & continue
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
              {submitting ? 'Lodging...' : 'Lodge complaint'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function collectErrorMessages(errors: FieldErrors<WizardForm>): string[] {
  const messages: string[] = [];

  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;

    const maybeError = value as { message?: unknown };
    if (typeof maybeError.message === 'string') messages.push(maybeError.message);

    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      if (key === 'message' || key === 'type' || key === 'ref') return;
      visit(child);
    });
  }

  visit(errors);
  return [...new Set(messages)];
}
