import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { StepProps } from '../wizardTypes';
import type { WizardForm } from '../wizardTypes';
import type { ComplainantContactDto, GroundDto, OnBehalfOfDto, RepresentativeDto, RespondentDto } from '../../../types';
import { formatDateOnly } from '../../../utils/format';
import { InfoTooltip } from '../../../components/InfoTooltip';
import { classNames, invalidAria, RequiredMark, useFieldValidationDisplay } from '../fieldUi';

interface Props extends StepProps {
  groundsCatalog: GroundDto[];
}

const RHF_UPDATE = { shouldDirty: true, shouldValidate: true };

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value || <span className="text-slate-400">Not provided</span>}</dd>
    </div>
  );
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(', ');
}

function formatName(firstName?: string | null, lastName?: string | null): string {
  return joinParts([firstName, lastName]);
}

function formatAddress(value: { addressLine?: string | null; suburb?: string | null; state?: string | null; postcode?: string | null }): string {
  return joinParts([value.addressLine, value.suburb, value.state, value.postcode]);
}

function DetailList({ items }: { items: Array<[string, ReactNode]> }) {
  const visible = items.filter(([, value]) => Boolean(value));
  if (visible.length === 0) return <span className="text-slate-400">Not provided</span>;

  return (
    <dl className="space-y-1">
      {visible.map(([label, value]) => (
        <div key={label}>
          <dt className="inline font-medium text-slate-500">{label}: </dt>
          <dd className="inline">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ComplainantContactSummary({ contact }: { contact: ComplainantContactDto }) {
  return (
    <DetailList
      items={[
        ['Name', joinParts([contact.title, formatName(contact.firstName, contact.lastName)])],
        ['Email', contact.email],
        ['Address', formatAddress(contact)],
        ['Mobile', contact.phoneBh || contact.phoneAh],
        ['Assistance', contact.assistanceRequired],
      ]}
    />
  );
}

function OnBehalfSummary({ person }: { person: OnBehalfOfDto }) {
  return (
    <DetailList
      items={[
        ['Name', formatName(person.firstName, person.lastName)],
        ['Email', person.email],
        ['Relationship', person.relationshipToComplainant],
        ['Assistance', person.assistanceRequired],
      ]}
    />
  );
}

function RepresentativeSummary({ representative }: { representative: RepresentativeDto }) {
  return (
    <DetailList
      items={[
        ['Name', joinParts([representative.title, formatName(representative.firstName, representative.lastName)])],
        ['Position', representative.position],
        ['Organisation', representative.organisation],
        ['Address', formatAddress(representative)],
        ['Email', representative.email],
        ['Mobile', representative.mobile],
        ['Assistance', representative.assistanceRequired],
      ]}
    />
  );
}

function RespondentsSummary({ respondents }: { respondents: RespondentDto[] }) {
  const visible = respondents.filter((r) => r.name.trim());
  if (visible.length === 0) return <span className="text-slate-400">Not provided</span>;

  return (
    <ul className="space-y-3">
      {visible.map((respondent, index) => (
        <li key={`${respondent.name}-${index}`} className="rounded border border-slate-100 p-3">
          <p className="font-medium text-navy-900">{respondent.name}</p>
          <DetailList
            items={[
              ['ABN / ACN', respondent.abnAcn],
              ['Relationship', respondent.relationshipToComplainant],
              ['Address', formatAddress(respondent)],
              ['Email', respondent.contactEmail],
              ['Phone (BH)', respondent.contactPhone],
              ['Mobile', respondent.mobile],
            ]}
          />
        </li>
      ))}
    </ul>
  );
}

export function StepReview({ groundsCatalog }: Props) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<WizardForm>();
  const form = useWatch({ control }) as WizardForm;
  const showValidation = useFieldValidationDisplay();
  const labelFor = (value: string) => groundsCatalog.find((g) => g.value === value)?.label ?? value;
  const privacyNoticeAcceptedError =
    showValidation && typeof errors.privacyNoticeAccepted?.message === 'string'
      ? errors.privacyNoticeAccepted.message
      : undefined;
  const genAiUsedError =
    showValidation && typeof errors.genAiUsed?.message === 'string' ? errors.genAiUsed.message : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review &amp; lodge</h2>
        <p className="mt-1 text-sm text-slate-600">Please check your complaint before lodging it.</p>
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 p-4">
        <Row label="Your contact details" value={<ComplainantContactSummary contact={form.complainantContact} />} />
        {form.interpreterRequired && <Row label="Interpreter" value={`Yes - ${form.preferredLanguage || 'language not specified'}`} />}
        {form.onBehalfOf && <Row label="On behalf of" value={<OnBehalfSummary person={form.onBehalfOf} />} />}
        {form.representative && <Row label="Representative" value={<RepresentativeSummary representative={form.representative} />} />}
        <Row label="Title" value={form.title} />
        <Row label="Grounds" value={form.grounds.map((g) => labelFor(g.groundType)).join(', ')} />
        <Row label="What happened" value={<span className="whitespace-pre-wrap">{form.description}</span>} />
        <Row label="When" value={formatDateOnly(form.incidentDate || null)} />
        {form.delayReason.trim().length > 0 && (
          <Row label="Reason for delay" value={<span className="whitespace-pre-wrap">{form.delayReason}</span>} />
        )}
        <Row label="Where exactly" value={form.incidentLocation} />
        <Row label="Respondents" value={<RespondentsSummary respondents={form.respondents} />} />
        <Row label="Desired outcome" value={form.desiredOutcome} />
        {form.priorComplaintMade !== null && (
          <Row label="Complaint elsewhere" value={form.priorComplaintMade ? 'Yes' : 'No'} />
        )}
        {form.priorComplaintMade === true && (
          <>
            <Row label="Other agency" value={form.priorComplaintAgency} />
            <Row label="Other complaint date" value={formatDateOnly(form.priorComplaintDate || null)} />
            <Row label="Other complaint status" value={form.priorComplaintStatus} />
            <Row label="Finalised date" value={formatDateOnly(form.priorComplaintFinalisedDate || null)} />
            <Row label="Other complaint outcome" value={<span className="whitespace-pre-wrap">{form.priorComplaintOutcome}</span>} />
          </>
        )}
      </dl>

      <section className="rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-navy-900">Privacy collection notice</h3>
        <p className="mt-2 text-sm text-slate-600">
          The Australian Human Rights Commission collects and handles personal information in accordance with the
          Privacy Act 1988 (Cth), the Archives Act 1983 (Cth) and its{' '}
          <a
            href="https://humanrights.gov.au/our-work/commission-general/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent-700 underline decoration-accent-600 decoration-2 underline-offset-4 hover:text-accent-800 hover:decoration-accent-800"
          >
            Privacy Policy
          </a>
          . The information you provide is collected to assess and handle your complaint. If a complaint proceeds,
          relevant information may be shared with the party complained about or others involved in handling the complaint.
        </p>
        <label className={classNames('mt-3 flex items-start gap-3', privacyNoticeAcceptedError && 'choice-group-error')}>
          <input
            type="checkbox"
            className={classNames('mt-1 h-4 w-4', privacyNoticeAcceptedError && 'input-error')}
            aria-invalid={invalidAria(Boolean(privacyNoticeAcceptedError))}
            {...register('privacyNoticeAccepted')}
          />
          <span className="text-sm">I have read and understood the privacy collection notice.<RequiredMark /></span>
        </label>
        {privacyNoticeAcceptedError && <p className="error-text">{privacyNoticeAcceptedError}</p>}
      </section>

      <fieldset
        className={classNames('rounded-lg border border-slate-200 p-4', genAiUsedError && 'fieldset-error')}
        aria-invalid={invalidAria(Boolean(genAiUsedError))}
      >
        <legend className="px-1 font-semibold text-navy-900">
          <span>Use of generative AI<RequiredMark /></span>{' '}
          <InfoTooltip label="About using generative AI">
            <span className="block">
              Generative AI (GenAI) includes tools such as OpenAI&apos;s ChatGPT, Claude, Google Gemini and
              Microsoft Copilot.
            </span>
            <span className="block">
              If you use GenAI to help write your complaint, you are responsible for making sure it is accurate.
              GenAI comes with risks - it can create information that is not accurate and, in some cases, wrong.
            </span>
            <span className="block">
              If you answer <span className="font-semibold text-slate-800">Yes</span>, please read and check all
              the information in your complaint to make sure it is correct, relevant, and captures what you want
              to say.
            </span>
          </InfoTooltip>
        </legend>
        <p className="text-sm text-slate-600">
          Did you use generative AI (for example ChatGPT, Claude, Gemini or Copilot) to help prepare this complaint?
          If you did, you are responsible for making sure the information is accurate.
        </p>
        <div className={classNames('mt-3 flex gap-4', genAiUsedError && 'choice-group-error')}>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="genai"
              checked={form.genAiUsed === true}
              onChange={() => setValue('genAiUsed', true, RHF_UPDATE)}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="genai"
              checked={form.genAiUsed === false}
              onChange={() => setValue('genAiUsed', false, RHF_UPDATE)}
            />
            <span>No</span>
          </label>
        </div>
        {genAiUsedError && <p className="error-text">{genAiUsedError}</p>}
      </fieldset>
    </div>
  );
}
