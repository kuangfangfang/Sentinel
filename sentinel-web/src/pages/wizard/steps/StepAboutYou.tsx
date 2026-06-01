import { useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import type { StepProps, WizardForm } from '../wizardTypes';
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
const RHF_UPDATE = { shouldDirty: true, shouldValidate: true };

type AddressPrefix = 'complainantContact' | 'representative';
type AddressField = 'addressLine' | 'suburb' | 'state' | 'postcode';

interface AddressPatch {
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}

function titleOptions(current: string | null | undefined): string[] {
  const value = current?.trim();
  return value && !TITLE_OPTIONS.includes(value) ? [...TITLE_OPTIONS, value] : TITLE_OPTIONS;
}

function digitsOnly(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function fieldErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('message' in error)) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

function addressPath(prefix: AddressPrefix, field: AddressField): FieldPath<WizardForm> {
  return `${prefix}.${field}` as FieldPath<WizardForm>;
}

interface Props extends StepProps {
  isAuthenticated: boolean;
}

export function StepAboutYou({ isAuthenticated }: Props) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<WizardForm>();
  const form = useWatch({ control }) as WizardForm;
  const [specifyingOtherLanguage, setSpecifyingOtherLanguage] = useState(
    Boolean(form.preferredLanguage.trim()) && !knownPreferredLanguages.has(form.preferredLanguage),
  );

  useEffect(() => {
    if (form.preferredLanguage.trim() && !knownPreferredLanguages.has(form.preferredLanguage)) {
      setSpecifyingOtherLanguage(true);
    }
  }, [form.preferredLanguage]);

  function toggleOnBehalf(on: boolean) {
    setValue(
      'onBehalfOf',
      on
        ? { firstName: '', lastName: '', email: '', relationshipToComplainant: '', assistanceRequired: '' }
        : null,
      RHF_UPDATE,
    );
  }

  function toggleRep(on: boolean) {
    setValue(
      'representative',
      on
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
      RHF_UPDATE,
    );
  }

  function setPreferredLanguage(value: string | null) {
    if (value === OTHER_LANGUAGE_VALUE) {
      setSpecifyingOtherLanguage(true);
      setValue('preferredLanguage', '', RHF_UPDATE);
      return;
    }

    setSpecifyingOtherLanguage(false);
    setValue('preferredLanguage', value ?? '', RHF_UPDATE);
  }

  const contactMobile = register('complainantContact.phoneBh', { setValueAs: digitsOnly });
  const selectedLanguageValue = specifyingOtherLanguage
    ? OTHER_LANGUAGE_VALUE
    : form.preferredLanguage || null;

  const contactErrors = errors.complainantContact ?? {};
  const onBehalfErrors = errors.onBehalfOf ?? {};
  const representativeErrors = errors.representative ?? {};

  function renderRepresentativeMobile() {
    const repMobile = register('representative.mobile', { setValueAs: digitsOnly });

    return (
      <input
        id="rep-mobile"
        className="input"
        inputMode="numeric"
        pattern="[0-9]*"
        {...repMobile}
        onChange={(e) => {
          setValue('representative.phoneBh', '', RHF_UPDATE);
          repMobile.onChange(e);
        }}
      />
    );
  }

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
            <select id="contact-title" className="input" {...register('complainantContact.title')}>
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
            <input id="contact-first" className="input" {...register('complainantContact.firstName')} />
            {fieldErrorMessage(contactErrors.firstName) && (
              <p className="error-text">{fieldErrorMessage(contactErrors.firstName)}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-last" className="label">
              Last name{isAuthenticated ? ' (required)' : ''}
            </label>
            <input id="contact-last" className="input" {...register('complainantContact.lastName')} />
            {fieldErrorMessage(contactErrors.lastName) && (
              <p className="error-text">{fieldErrorMessage(contactErrors.lastName)}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className="label">
              Email{isAuthenticated ? ' (required)' : ''}
            </label>
            <input id="contact-email" type="email" className="input" {...register('complainantContact.email')} />
            {fieldErrorMessage(contactErrors.email) && (
              <p className="error-text">{fieldErrorMessage(contactErrors.email)}</p>
            )}
          </div>
          <AddressFields
            idPrefix="contact"
            namePrefix="complainantContact"
            addressLine={form.complainantContact.addressLine}
            suburb={form.complainantContact.suburb}
            state={form.complainantContact.state}
            postcode={form.complainantContact.postcode}
          />
          <div>
            <label htmlFor="contact-mobile" className="label">Mobile</label>
            <input
              id="contact-mobile"
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              {...contactMobile}
              onChange={(e) => {
                setValue('complainantContact.phoneAh', '', RHF_UPDATE);
                contactMobile.onChange(e);
              }}
            />
            {fieldErrorMessage(contactErrors.phoneBh) && (
              <p className="error-text">{fieldErrorMessage(contactErrors.phoneBh)}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contact-assist" className="label">Assistance required to participate (optional)</label>
            <textarea
              id="contact-assist"
              className="input min-h-[90px]"
              {...register('complainantContact.assistanceRequired')}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-medium text-navy-900">Assistance</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4" {...register('interpreterRequired')} />
          <span>I need an interpreter to take part in this process.</span>
        </label>
        {form.interpreterRequired && (
          <div>
            <label htmlFor="lang" className="label">Preferred language</label>
            <div className="max-w-sm">
              <Controller
                control={control}
                name="preferredLanguage"
                render={() => (
                  <Combobox
                    id="lang"
                    options={preferredLanguageOptions}
                    value={selectedLanguageValue}
                    onChange={setPreferredLanguage}
                    placeholder="Search preferred language"
                    noOptionsMessage="No languages"
                  />
                )}
              />
            </div>
            {fieldErrorMessage(errors.preferredLanguage) && (
              <p className="error-text">{fieldErrorMessage(errors.preferredLanguage)}</p>
            )}
            {specifyingOtherLanguage && (
              <div className="mt-3 max-w-sm">
                <label htmlFor="lang-other" className="label">Please specify language</label>
                <input id="lang-other" className="input" {...register('preferredLanguage')} />
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
              <input id="ob-first" className="input" {...register('onBehalfOf.firstName')} />
              {fieldErrorMessage(onBehalfErrors.firstName) && (
                <p className="error-text">{fieldErrorMessage(onBehalfErrors.firstName)}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-last" className="label">Their last name</label>
              <input id="ob-last" className="input" {...register('onBehalfOf.lastName')} />
              {fieldErrorMessage(onBehalfErrors.lastName) && (
                <p className="error-text">{fieldErrorMessage(onBehalfErrors.lastName)}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-email" className="label">Their email</label>
              <input id="ob-email" type="email" className="input" {...register('onBehalfOf.email')} />
              {fieldErrorMessage(onBehalfErrors.email) && (
                <p className="error-text">{fieldErrorMessage(onBehalfErrors.email)}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-rel" className="label">Your relationship to them</label>
              <input id="ob-rel" className="input" {...register('onBehalfOf.relationshipToComplainant')} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-assist" className="label">Do they need assistance to take part? (optional)</label>
              <textarea id="ob-assist" className="input min-h-[80px]" {...register('onBehalfOf.assistanceRequired')} />
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
              <select id="rep-title" className="input" {...register('representative.title')}>
                {titleOptions(form.representative.title).map((title) => (
                  <option key={title || 'blank'} value={title} disabled={!title}>
                    {title || 'Select title'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rep-first" className="label">First name</label>
              <input id="rep-first" className="input" {...register('representative.firstName')} />
              {fieldErrorMessage(representativeErrors.firstName) && (
                <p className="error-text">{fieldErrorMessage(representativeErrors.firstName)}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-last" className="label">Last name</label>
              <input id="rep-last" className="input" {...register('representative.lastName')} />
              {fieldErrorMessage(representativeErrors.lastName) && (
                <p className="error-text">{fieldErrorMessage(representativeErrors.lastName)}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-position" className="label">Position</label>
              <input id="rep-position" className="input" {...register('representative.position')} />
            </div>
            <div>
              <label htmlFor="rep-org" className="label">Organisation (optional)</label>
              <input id="rep-org" className="input" {...register('representative.organisation')} />
            </div>
            <AddressFields
              idPrefix="rep"
              namePrefix="representative"
              addressLine={form.representative.addressLine}
              suburb={form.representative.suburb}
              state={form.representative.state}
              postcode={form.representative.postcode}
            />
            <div>
              <label htmlFor="rep-email" className="label">Email (optional)</label>
              <input id="rep-email" type="email" className="input" {...register('representative.email')} />
              {fieldErrorMessage(representativeErrors.email) && (
                <p className="error-text">{fieldErrorMessage(representativeErrors.email)}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-mobile" className="label">Mobile</label>
              {renderRepresentativeMobile()}
              {fieldErrorMessage(representativeErrors.mobile) && (
                <p className="error-text">{fieldErrorMessage(representativeErrors.mobile)}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rep-assist" className="label">Assistance required to participate (optional)</label>
              <textarea id="rep-assist" className="input min-h-[80px]" {...register('representative.assistanceRequired')} />
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function AddressFields({
  idPrefix,
  namePrefix,
  addressLine,
  suburb,
  state,
  postcode,
}: {
  idPrefix: string;
  namePrefix: AddressPrefix;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}) {
  const { control, register, setValue } = useFormContext<WizardForm>();

  function patchAddress(patch: AddressPatch) {
    (Object.entries(patch) as Array<[AddressField, string | null | undefined]>).forEach(([field, value]) => {
      setValue(addressPath(namePrefix, field), value ?? '', RHF_UPDATE);
    });
  }

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address`} className="label">Address</label>
        <input
          id={`${idPrefix}-address`}
          className="input"
          {...register(addressPath(namePrefix, 'addressLine'))}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-state`} className="label">State/Territory</label>
        <Controller
          control={control}
          name={addressPath(namePrefix, 'state')}
          render={({ field }) => (
            <Combobox
              id={`${idPrefix}-state`}
              options={AUSTRALIAN_STATES}
              value={(field.value as string | null | undefined) ?? null}
              onChange={(val) => {
                field.onChange(val ?? '');
                setValue(addressPath(namePrefix, 'suburb'), '', RHF_UPDATE);
                setValue(addressPath(namePrefix, 'postcode'), '', RHF_UPDATE);
              }}
              placeholder="Select state"
              noOptionsMessage="No states"
            />
          )}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-suburb`} className="label">Suburb</label>
        <SuburbCombobox
          id={`${idPrefix}-suburb`}
          state={state ?? ''}
          suburb={suburb ?? ''}
          postcode={postcode ?? ''}
          onPatch={patchAddress}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-postcode`} className="label">Postcode</label>
        <input
          id={`${idPrefix}-postcode`}
          className="input"
          {...register(addressPath(namePrefix, 'postcode'))}
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
