import type { StepProps } from '../wizardTypes';
import type { OnBehalfOfDto, RepresentativeDto } from '../../../types';

export function StepAboutYou({ form, update }: StepProps) {
  function toggleOnBehalf(on: boolean) {
    update({
      onBehalfOf: on
        ? { firstName: '', lastName: '', email: '', relationshipToComplainant: '', assistanceRequired: '' }
        : null,
    });
  }
  function patchOnBehalf(patch: Partial<OnBehalfOfDto>) {
    update({ onBehalfOf: { ...(form.onBehalfOf as OnBehalfOfDto), ...patch } });
  }
  function toggleRep(on: boolean) {
    update({
      representative: on
        ? { firstName: '', lastName: '', title: '', position: '', organisation: '', email: '', phoneBh: '', mobile: '', assistanceRequired: '' }
        : null,
    });
  }
  function patchRep(patch: Partial<RepresentativeDto>) {
    update({ representative: { ...(form.representative as RepresentativeDto), ...patch } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">About you</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tell us about any help you need to take part, and whether you are complaining for someone else.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-medium text-navy-900">Assistance</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={form.interpreterRequired}
            onChange={(e) => update({ interpreterRequired: e.target.checked })} />
          <span>I need an interpreter to take part in this process.</span>
        </label>
        {form.interpreterRequired && (
          <div>
            <label htmlFor="lang" className="label">Preferred language</label>
            <input id="lang" className="input max-w-sm" value={form.preferredLanguage}
              onChange={(e) => update({ preferredLanguage: e.target.value })} placeholder="e.g. Vietnamese" />
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3 border-t border-slate-100 pt-5">
        <legend className="font-medium text-navy-900">Are you complaining on behalf of someone else?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="onBehalf" checked={!!form.onBehalfOf} onChange={() => toggleOnBehalf(true)} />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="onBehalf" checked={!form.onBehalfOf} onChange={() => toggleOnBehalf(false)} />
            <span>No</span>
          </label>
        </div>
        {form.onBehalfOf && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ob-first" className="label">Their first name</label>
              <input id="ob-first" className="input" value={form.onBehalfOf.firstName}
                onChange={(e) => patchOnBehalf({ firstName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="ob-last" className="label">Their last name</label>
              <input id="ob-last" className="input" value={form.onBehalfOf.lastName}
                onChange={(e) => patchOnBehalf({ lastName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="ob-rel" className="label">Your relationship to them</label>
              <input id="ob-rel" className="input" value={form.onBehalfOf.relationshipToComplainant ?? ''}
                onChange={(e) => patchOnBehalf({ relationshipToComplainant: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-assist" className="label">Do they need assistance to take part? (optional)</label>
              <input id="ob-assist" className="input" value={form.onBehalfOf.assistanceRequired ?? ''}
                onChange={(e) => patchOnBehalf({ assistanceRequired: e.target.value })} />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3 border-t border-slate-100 pt-5">
        <legend className="font-medium text-navy-900">Is someone helping you (e.g. a legal or advocacy representative)?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="rep" checked={!!form.representative} onChange={() => toggleRep(true)} />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="rep" checked={!form.representative} onChange={() => toggleRep(false)} />
            <span>No</span>
          </label>
        </div>
        {form.representative && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rep-first" className="label">First name</label>
              <input id="rep-first" className="input" value={form.representative.firstName}
                onChange={(e) => patchRep({ firstName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rep-last" className="label">Last name</label>
              <input id="rep-last" className="input" value={form.representative.lastName}
                onChange={(e) => patchRep({ lastName: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rep-org" className="label">Organisation (optional)</label>
              <input id="rep-org" className="input" value={form.representative.organisation ?? ''}
                onChange={(e) => patchRep({ organisation: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rep-email" className="label">Email (optional)</label>
              <input id="rep-email" type="email" className="input" value={form.representative.email ?? ''}
                onChange={(e) => patchRep({ email: e.target.value })} />
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
