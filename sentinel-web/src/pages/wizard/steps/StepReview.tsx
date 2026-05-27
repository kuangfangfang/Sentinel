import type { ReactNode } from 'react';
import type { StepProps } from '../wizardTypes';
import type { GroundDto } from '../../../types';
import { formatDateOnly } from '../../../utils/format';
import { InfoTooltip } from '../../../components/InfoTooltip';

interface Props extends StepProps {
  groundsCatalog: GroundDto[];
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value || <span className="text-slate-400">Not provided</span>}</dd>
    </div>
  );
}

export function StepReview({ form, update, groundsCatalog }: Props) {
  const labelFor = (value: string) => groundsCatalog.find((g) => g.value === value)?.label ?? value;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review &amp; lodge</h2>
        <p className="mt-1 text-sm text-slate-600">Please check your complaint before lodging it.</p>
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 p-4">
        <Row label="Title" value={form.title} />
        <Row label="Grounds" value={form.grounds.map((g) => labelFor(g.groundType)).join(', ')} />
        <Row label="What happened" value={<span className="whitespace-pre-wrap">{form.description}</span>} />
        <Row label="When" value={formatDateOnly(form.incidentDate || null)} />
        {form.delayReason.trim().length > 0 && (
          <Row label="Reason for delay" value={<span className="whitespace-pre-wrap">{form.delayReason}</span>} />
        )}
        <Row label="Where" value={form.incidentLocation} />
        <Row label="Respondents" value={form.respondents.filter((r) => r.name.trim()).map((r) => r.name).join(', ')} />
        <Row label="Desired outcome" value={form.desiredOutcome} />
        {form.interpreterRequired && <Row label="Interpreter" value={`Yes — ${form.preferredLanguage || 'language not specified'}`} />}
        {form.onBehalfOf && <Row label="On behalf of" value={`${form.onBehalfOf.firstName} ${form.onBehalfOf.lastName}`} />}
      </dl>

      <section className="rounded-lg bg-slate-50 p-4">
        <h3 className="font-semibold text-navy-900">Privacy collection notice</h3>
        <p className="mt-2 text-sm text-slate-600">
          The information you provide is collected to assess and handle your complaint. It is stored securely and
          is only accessible to authorised caseworkers. If a complaint proceeds, relevant information may be shared
          with the party complained about. You can ask to access or correct your information at any time. By
          continuing you consent to this collection and use of your information.
        </p>
        <label className="mt-3 flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={form.privacyNoticeAccepted}
            onChange={(e) => update({ privacyNoticeAccepted: e.target.checked })} />
          <span className="text-sm">I have read and understood the privacy collection notice.</span>
        </label>
      </section>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 font-semibold text-navy-900">
          Use of generative AI{' '}
          <InfoTooltip label="About using generative AI">
            <span className="block">
              Generative AI (GenAI) includes tools such as OpenAI&apos;s ChatGPT, Claude, Google Gemini and
              Microsoft Copilot.
            </span>
            <span className="block">
              If you use GenAI to help write your complaint, you are responsible for making sure it is accurate.
              GenAI comes with risks — it can create information that is not accurate and, in some cases, wrong.
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
        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="genai" checked={form.genAiUsed === true} onChange={() => update({ genAiUsed: true })} />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="genai" checked={form.genAiUsed === false} onChange={() => update({ genAiUsed: false })} />
            <span>No</span>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
