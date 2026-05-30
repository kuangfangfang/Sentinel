import { useState } from 'react';
import type { StepProps } from '../wizardTypes';
import type { OnBehalfOfDto, RepresentativeDto } from '../../../types';
import Combobox from '../../../components/Combobox';
import { OTHER_LANGUAGE_VALUE, preferredLanguageOptions } from '../../../data/languages';

const knownPreferredLanguages = new Set(
  preferredLanguageOptions
    .filter((option) => option.value !== OTHER_LANGUAGE_VALUE)
    .map((option) => option.value),
);

export function StepAboutYou({ form, update }: StepProps) {
  const [specifyingOtherLanguage, setSpecifyingOtherLanguage] = useState(
    Boolean(form.preferredLanguage.trim()) && !knownPreferredLanguages.has(form.preferredLanguage),
  );

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

  function setPreferredLanguage(value: string | null) {
    if (value === OTHER_LANGUAGE_VALUE) {
      setSpecifyingOtherLanguage(true);
      update({ preferredLanguage: '' });
      return;
    }

    setSpecifyingOtherLanguage(false);
    update({ preferredLanguage: value ?? '' });
  }

  const selectedLanguageValue = specifyingOtherLanguage
    ? OTHER_LANGUAGE_VALUE
    : form.preferredLanguage || null;

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
            <div className="max-w-sm">
              <Combobox
                id="lang"
                options={preferredLanguageOptions}
                value={selectedLanguageValue}
                onChange={setPreferredLanguage}
                placeholder="Search preferred language"
                noOptionsMessage="No languages"
              />
            </div>
            {specifyingOtherLanguage && (
              <div className="mt-3 max-w-sm">
                <label htmlFor="lang-other" className="label">Please specify language</label>
                <input
                  id="lang-other"
                  className="input"
                  value={form.preferredLanguage}
                  onChange={(e) => update({ preferredLanguage: e.target.value })}
                />
              </div>
            )}
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
