import { useEffect, useMemo, useState } from 'react';
import type { StepProps } from '../wizardTypes';
import type { ComplainantContactDto, OnBehalfOfDto, RepresentativeDto } from '../../../types';
import Combobox, { type ComboboxOption } from '../../../components/Combobox';
import { OTHER_LANGUAGE_VALUE, preferredLanguageOptions } from '../../../data/languages';
import {
  AUSTRALIAN_STATES,
  formatLocationLabel,
  loadAustralianSuburbs,
  locationValue,
  type AustralianSuburb,
} from '../../../data/australianLocations';

const knownPreferredLanguages = new Set(
  preferredLanguageOptions
    .filter((option) => option.value !== OTHER_LANGUAGE_VALUE)
    .map((option) => option.value),
);

const TITLE_OPTIONS = ['', 'Mr', 'Mrs', 'Ms', 'Miss', 'Mx', 'Dr', 'Prof'];

function titleOptions(current: string | null | undefined): string[] {
  const value = current?.trim();
  return value && !TITLE_OPTIONS.includes(value) ? [...TITLE_OPTIONS, value] : TITLE_OPTIONS;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

interface Props extends StepProps {
  isAuthenticated: boolean;
}

interface AddressPatch {
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}

export function StepAboutYou({ form, update, isAuthenticated }: Props) {
  const [specifyingOtherLanguage, setSpecifyingOtherLanguage] = useState(
    Boolean(form.preferredLanguage.trim()) && !knownPreferredLanguages.has(form.preferredLanguage),
  );

  function patchContact(patch: Partial<ComplainantContactDto>) {
    update({ complainantContact: { ...form.complainantContact, ...patch } });
  }

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
        ? {
            firstName: '',
            lastName: '',
            title: '',
            position: '',
            organisation: '',
            addressLine: '',
            suburb: '',
            state: '',
            postcode: '',
            email: '',
            phoneBh: '',
            mobile: '',
            assistanceRequired: '',
          }
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
          Tell us how to contact you, any help you need to take part, and whether someone else is involved.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="font-medium text-navy-900">Your contact details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-title" className="label">Title</label>
            <select
              id="contact-title"
              className="input"
              value={form.complainantContact.title ?? ''}
              onChange={(e) => patchContact({ title: e.target.value })}
            >
              {titleOptions(form.complainantContact.title).map((title) => (
                <option key={title || 'blank'} value={title} disabled={!title}>
                  {title || 'Select title'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-first" className="label">
              First name{isAuthenticated ? ' (required)' : ''}
            </label>
            <input
              id="contact-first"
              className="input"
              value={form.complainantContact.firstName ?? ''}
              onChange={(e) => patchContact({ firstName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contact-last" className="label">
              Last name{isAuthenticated ? ' (required)' : ''}
            </label>
            <input
              id="contact-last"
              className="input"
              value={form.complainantContact.lastName ?? ''}
              onChange={(e) => patchContact({ lastName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="label">
              Email{isAuthenticated ? ' (required)' : ''}
            </label>
            <input
              id="contact-email"
              type="email"
              className="input"
              value={form.complainantContact.email ?? ''}
              onChange={(e) => patchContact({ email: e.target.value })}
            />
          </div>
          <AddressFields
            idPrefix="contact"
            addressLine={form.complainantContact.addressLine}
            suburb={form.complainantContact.suburb}
            state={form.complainantContact.state}
            postcode={form.complainantContact.postcode}
            onPatch={patchContact}
          />
          <div>
            <label htmlFor="contact-mobile" className="label">Mobile</label>
            <input
              id="contact-mobile"
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.complainantContact.phoneBh ?? ''}
              onChange={(e) => patchContact({ phoneBh: digitsOnly(e.target.value), phoneAh: '' })}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contact-assist" className="label">Assistance required to participate (optional)</label>
            <textarea
              id="contact-assist"
              className="input min-h-[90px]"
              value={form.complainantContact.assistanceRequired ?? ''}
              onChange={(e) => patchContact({ assistanceRequired: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

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
              <label htmlFor="ob-email" className="label">Their email</label>
              <input id="ob-email" type="email" className="input" value={form.onBehalfOf.email ?? ''}
                onChange={(e) => patchOnBehalf({ email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="ob-rel" className="label">Your relationship to them</label>
              <input id="ob-rel" className="input" value={form.onBehalfOf.relationshipToComplainant ?? ''}
                onChange={(e) => patchOnBehalf({ relationshipToComplainant: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-assist" className="label">Do they need assistance to take part? (optional)</label>
              <textarea id="ob-assist" className="input min-h-[80px]" value={form.onBehalfOf.assistanceRequired ?? ''}
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
              <label htmlFor="rep-title" className="label">Title</label>
              <select
                id="rep-title"
                className="input"
                value={form.representative.title ?? ''}
                onChange={(e) => patchRep({ title: e.target.value })}
              >
                {titleOptions(form.representative.title).map((title) => (
                  <option key={title || 'blank'} value={title} disabled={!title}>
                    {title || 'Select title'}
                  </option>
                ))}
              </select>
            </div>
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
              <label htmlFor="rep-position" className="label">Position</label>
              <input id="rep-position" className="input" value={form.representative.position ?? ''}
                onChange={(e) => patchRep({ position: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rep-org" className="label">Organisation (optional)</label>
              <input id="rep-org" className="input" value={form.representative.organisation ?? ''}
                onChange={(e) => patchRep({ organisation: e.target.value })} />
            </div>
            <AddressFields
              idPrefix="rep"
              addressLine={form.representative.addressLine}
              suburb={form.representative.suburb}
              state={form.representative.state}
              postcode={form.representative.postcode}
              onPatch={patchRep}
            />
            <div>
              <label htmlFor="rep-email" className="label">Email (optional)</label>
              <input id="rep-email" type="email" className="input" value={form.representative.email ?? ''}
                onChange={(e) => patchRep({ email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="rep-mobile" className="label">Mobile</label>
              <input
                id="rep-mobile"
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.representative.mobile ?? ''}
                onChange={(e) => patchRep({ mobile: digitsOnly(e.target.value), phoneBh: '' })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rep-assist" className="label">Assistance required to participate (optional)</label>
              <textarea id="rep-assist" className="input min-h-[80px]" value={form.representative.assistanceRequired ?? ''}
                onChange={(e) => patchRep({ assistanceRequired: e.target.value })} />
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function AddressFields({
  idPrefix,
  addressLine,
  suburb,
  state,
  postcode,
  onPatch,
}: {
  idPrefix: string;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  onPatch: (patch: AddressPatch) => void;
}) {
  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address`} className="label">Address</label>
        <input
          id={`${idPrefix}-address`}
          className="input"
          value={addressLine ?? ''}
          onChange={(e) => onPatch({ addressLine: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-state`} className="label">State/Territory</label>
        <Combobox
          id={`${idPrefix}-state`}
          options={AUSTRALIAN_STATES}
          value={state ?? null}
          onChange={(val) => onPatch({ state: val ?? '', suburb: '', postcode: '' })}
          placeholder="Select state"
          noOptionsMessage="No states"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-suburb`} className="label">Suburb</label>
        <SuburbCombobox
          id={`${idPrefix}-suburb`}
          state={state ?? ''}
          suburb={suburb ?? ''}
          postcode={postcode ?? ''}
          onPatch={onPatch}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-postcode`} className="label">Postcode</label>
        <input
          id={`${idPrefix}-postcode`}
          className="input"
          value={postcode ?? ''}
          onChange={(e) => onPatch({ postcode: e.target.value })}
        />
      </div>
    </>
  );
}

function SuburbCombobox({
  id,
  state,
  suburb,
  postcode,
  onPatch,
}: {
  id: string;
  state: string;
  suburb: string;
  postcode: string;
  onPatch: (patch: AddressPatch) => void;
}) {
  const [locations, setLocations] = useState<AustralianSuburb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await loadAustralianSuburbs();
        if (mounted) setLocations(data);
      } catch {
        if (mounted) setLocations([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const options: ComboboxOption[] = useMemo(() => {
    if (!state) return [];
    return locations
      .filter((location) => location.state === state)
      .map((location) => ({
        label: formatLocationLabel(location),
        value: locationValue(location),
        searchText: `${location.suburb} ${location.postcode} ${location.state} ${location.stateCode}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations, state]);

  const selectedValue = suburb && state && postcode ? `${suburb}|${state}|${postcode}` : suburb || null;

  return (
    <Combobox
      id={id}
      options={options}
      value={selectedValue}
      displayValue={suburb || null}
      onChange={(val) => {
        if (!val) {
          onPatch({ suburb: '', postcode: '' });
          return;
        }
        const [nextSuburb, nextState, nextPostcode] = val.split('|');
        onPatch({ suburb: nextSuburb, state: nextState, postcode: nextPostcode });
      }}
      placeholder={state ? 'Search suburb or postcode' : 'Select a state first'}
      disabled={!state || loading}
      noOptionsMessage={loading ? 'Loading...' : 'No suburbs'}
    />
  );
}
