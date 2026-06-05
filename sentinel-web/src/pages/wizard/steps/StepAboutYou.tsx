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
import { rankAustralianSuburbsForQuery } from '../../../data/australianLocationRanking';
import { inputClass, invalidAria, RequiredMark, useFieldValidationDisplay } from '../fieldUi';

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
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 10) : '';
}

function postcodeDigits(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 4) : '';
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
  const showValidation = useFieldValidationDisplay();
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
  const contactFirstNameError = showValidation ? fieldErrorMessage(contactErrors.firstName) : undefined;
  const contactLastNameError = showValidation ? fieldErrorMessage(contactErrors.lastName) : undefined;
  const contactEmailError = showValidation ? fieldErrorMessage(contactErrors.email) : undefined;
  const contactMobileError = showValidation ? fieldErrorMessage(contactErrors.phoneBh) : undefined;
  const preferredLanguageError = showValidation ? fieldErrorMessage(errors.preferredLanguage) : undefined;
  const onBehalfFirstNameError = showValidation ? fieldErrorMessage(onBehalfErrors.firstName) : undefined;
  const onBehalfLastNameError = showValidation ? fieldErrorMessage(onBehalfErrors.lastName) : undefined;
  const onBehalfEmailError = showValidation ? fieldErrorMessage(onBehalfErrors.email) : undefined;
  const onBehalfRelationshipError = showValidation ? fieldErrorMessage(onBehalfErrors.relationshipToComplainant) : undefined;
  const representativeTitleError = showValidation ? fieldErrorMessage(representativeErrors.title) : undefined;
  const representativeFirstNameError = showValidation ? fieldErrorMessage(representativeErrors.firstName) : undefined;
  const representativeLastNameError = showValidation ? fieldErrorMessage(representativeErrors.lastName) : undefined;
  const representativePositionError = showValidation ? fieldErrorMessage(representativeErrors.position) : undefined;
  const representativeOrganisationError = showValidation ? fieldErrorMessage(representativeErrors.organisation) : undefined;
  const representativeEmailError = showValidation ? fieldErrorMessage(representativeErrors.email) : undefined;
  const representativeMobileError = showValidation ? fieldErrorMessage(representativeErrors.mobile) : undefined;

  function renderRepresentativeMobile() {
    const repMobile = register('representative.mobile', { setValueAs: digitsOnly });

    return (
      <input
        id="rep-mobile"
        className={inputClass(Boolean(representativeMobileError))}
        aria-invalid={invalidAria(Boolean(representativeMobileError))}
        inputMode="numeric"
        pattern="[0-9]*"
        {...repMobile}
        onChange={(e) => {
          e.target.value = digitsOnly(e.target.value);
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
        {!isAuthenticated && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
            You can continue without giving contact details. If you leave them blank, the team may not be able to
            follow up with you or ask for information that could help assess the complaint.
          </div>
        )}
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
              First name{isAuthenticated && <RequiredMark />}
            </label>
            <input
              id="contact-first"
              className={inputClass(Boolean(contactFirstNameError))}
              aria-invalid={invalidAria(Boolean(contactFirstNameError))}
              {...register('complainantContact.firstName')}
            />
            {contactFirstNameError && (
              <p className="error-text">{contactFirstNameError}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-last" className="label">
              Last name{isAuthenticated && <RequiredMark />}
            </label>
            <input
              id="contact-last"
              className={inputClass(Boolean(contactLastNameError))}
              aria-invalid={invalidAria(Boolean(contactLastNameError))}
              {...register('complainantContact.lastName')}
            />
            {contactLastNameError && (
              <p className="error-text">{contactLastNameError}</p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className="label">
              Email{isAuthenticated && <RequiredMark />}
            </label>
            <input
              id="contact-email"
              type="email"
              className={inputClass(Boolean(contactEmailError))}
              aria-invalid={invalidAria(Boolean(contactEmailError))}
              {...register('complainantContact.email')}
            />
            {contactEmailError && (
              <p className="error-text">{contactEmailError}</p>
            )}
          </div>
          <AddressFields
            idPrefix="contact"
            namePrefix="complainantContact"
            addressLine={form.complainantContact.addressLine}
            suburb={form.complainantContact.suburb}
            state={form.complainantContact.state}
            postcode={form.complainantContact.postcode}
            required={isAuthenticated}
          />
          <div>
            <label htmlFor="contact-mobile" className="label">Mobile{isAuthenticated && <RequiredMark />}</label>
            <input
              id="contact-mobile"
              className={inputClass(Boolean(contactMobileError))}
              aria-invalid={invalidAria(Boolean(contactMobileError))}
              inputMode="numeric"
              pattern="[0-9]*"
              {...contactMobile}
              onChange={(e) => {
                e.target.value = digitsOnly(e.target.value);
                setValue('complainantContact.phoneAh', '', RHF_UPDATE);
                contactMobile.onChange(e);
              }}
            />
            {contactMobileError && (
              <p className="error-text">{contactMobileError}</p>
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
            <label htmlFor="lang" className="label">Preferred language<RequiredMark /></label>
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
                    hasError={Boolean(preferredLanguageError)}
                  />
                )}
              />
            </div>
            {preferredLanguageError && (
              <p className="error-text">{preferredLanguageError}</p>
            )}
            {specifyingOtherLanguage && (
              <div className="mt-3 max-w-sm">
                <label htmlFor="lang-other" className="label">Please specify language<RequiredMark /></label>
                <input
                  id="lang-other"
                  className={inputClass(Boolean(preferredLanguageError))}
                  aria-invalid={invalidAria(Boolean(preferredLanguageError))}
                  {...register('preferredLanguage')}
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
              <label htmlFor="ob-first" className="label">Their first name<RequiredMark /></label>
              <input
                id="ob-first"
                className={inputClass(Boolean(onBehalfFirstNameError))}
                aria-invalid={invalidAria(Boolean(onBehalfFirstNameError))}
                {...register('onBehalfOf.firstName')}
              />
              {onBehalfFirstNameError && (
                <p className="error-text">{onBehalfFirstNameError}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-last" className="label">Their last name<RequiredMark /></label>
              <input
                id="ob-last"
                className={inputClass(Boolean(onBehalfLastNameError))}
                aria-invalid={invalidAria(Boolean(onBehalfLastNameError))}
                {...register('onBehalfOf.lastName')}
              />
              {onBehalfLastNameError && (
                <p className="error-text">{onBehalfLastNameError}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-email" className="label">Their email<RequiredMark /></label>
              <input
                id="ob-email"
                type="email"
                className={inputClass(Boolean(onBehalfEmailError))}
                aria-invalid={invalidAria(Boolean(onBehalfEmailError))}
                {...register('onBehalfOf.email')}
              />
              {onBehalfEmailError && (
                <p className="error-text">{onBehalfEmailError}</p>
              )}
            </div>
            <div>
              <label htmlFor="ob-rel" className="label">Your relationship to them<RequiredMark /></label>
              <input
                id="ob-rel"
                className={inputClass(Boolean(onBehalfRelationshipError))}
                aria-invalid={invalidAria(Boolean(onBehalfRelationshipError))}
                {...register('onBehalfOf.relationshipToComplainant')}
              />
              {onBehalfRelationshipError && (
                <p className="error-text">{onBehalfRelationshipError}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-assist" className="label">Do they need assistance to take part? (optional)</label>
              <textarea
                id="ob-assist"
                className="input min-h-[80px]"
                {...register('onBehalfOf.assistanceRequired')}
              />
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
              <label htmlFor="rep-title" className="label">Title<RequiredMark /></label>
              <select
                id="rep-title"
                className={inputClass(Boolean(representativeTitleError))}
                aria-invalid={invalidAria(Boolean(representativeTitleError))}
                {...register('representative.title')}
              >
                {titleOptions(form.representative.title).map((title) => (
                  <option key={title || 'blank'} value={title} disabled={!title}>
                    {title || 'Select title'}
                  </option>
                ))}
              </select>
              {representativeTitleError && (
                <p className="error-text">{representativeTitleError}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-first" className="label">First name<RequiredMark /></label>
              <input
                id="rep-first"
                className={inputClass(Boolean(representativeFirstNameError))}
                aria-invalid={invalidAria(Boolean(representativeFirstNameError))}
                {...register('representative.firstName')}
              />
              {representativeFirstNameError && (
                <p className="error-text">{representativeFirstNameError}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-last" className="label">Last name<RequiredMark /></label>
              <input
                id="rep-last"
                className={inputClass(Boolean(representativeLastNameError))}
                aria-invalid={invalidAria(Boolean(representativeLastNameError))}
                {...register('representative.lastName')}
              />
              {representativeLastNameError && (
                <p className="error-text">{representativeLastNameError}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-position" className="label">Position<RequiredMark /></label>
              <input
                id="rep-position"
                className={inputClass(Boolean(representativePositionError))}
                aria-invalid={invalidAria(Boolean(representativePositionError))}
                {...register('representative.position')}
              />
              {representativePositionError && (
                <p className="error-text">{representativePositionError}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-org" className="label">Organisation<RequiredMark /></label>
              <input
                id="rep-org"
                className={inputClass(Boolean(representativeOrganisationError))}
                aria-invalid={invalidAria(Boolean(representativeOrganisationError))}
                {...register('representative.organisation')}
              />
              {representativeOrganisationError && (
                <p className="error-text">{representativeOrganisationError}</p>
              )}
            </div>
            <AddressFields
              idPrefix="rep"
              namePrefix="representative"
              addressLine={form.representative.addressLine}
              suburb={form.representative.suburb}
              state={form.representative.state}
              postcode={form.representative.postcode}
              required
            />
            <div>
              <label htmlFor="rep-email" className="label">Email<RequiredMark /></label>
              <input
                id="rep-email"
                type="email"
                className={inputClass(Boolean(representativeEmailError))}
                aria-invalid={invalidAria(Boolean(representativeEmailError))}
                {...register('representative.email')}
              />
              {representativeEmailError && (
                <p className="error-text">{representativeEmailError}</p>
              )}
            </div>
            <div>
              <label htmlFor="rep-mobile" className="label">Mobile<RequiredMark /></label>
              {renderRepresentativeMobile()}
              {representativeMobileError && (
                <p className="error-text">{representativeMobileError}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rep-assist" className="label">Assistance required to participate (optional)</label>
              <textarea
                id="rep-assist"
                className="input min-h-[80px]"
                {...register('representative.assistanceRequired')}
              />
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
  required = false,
}: {
  idPrefix: string;
  namePrefix: AddressPrefix;
  addressLine?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  required?: boolean;
}) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<WizardForm>();
  const showValidation = useFieldValidationDisplay();
  const fieldErrors = namePrefix === 'complainantContact' ? errors.complainantContact : errors.representative;
  const addressError = showValidation ? fieldErrorMessage(fieldErrors?.addressLine) : undefined;
  const stateError = showValidation ? fieldErrorMessage(fieldErrors?.state) : undefined;
  const suburbError = showValidation ? fieldErrorMessage(fieldErrors?.suburb) : undefined;
  const postcodeError = showValidation ? fieldErrorMessage(fieldErrors?.postcode) : undefined;
  const postcodeRegistration = register(addressPath(namePrefix, 'postcode'), { setValueAs: postcodeDigits });

  function patchAddress(patch: AddressPatch) {
    (Object.entries(patch) as Array<[AddressField, string | null | undefined]>).forEach(([field, value]) => {
      setValue(addressPath(namePrefix, field), value ?? '', RHF_UPDATE);
    });
  }

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address`} className="label">Address{required && <RequiredMark />}</label>
        <input
          id={`${idPrefix}-address`}
          className={inputClass(Boolean(addressError))}
          aria-invalid={invalidAria(Boolean(addressError))}
          {...register(addressPath(namePrefix, 'addressLine'))}
        />
        {addressError && (
          <p className="error-text">{addressError}</p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-state`} className="label">State/Territory{required && <RequiredMark />}</label>
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
              hasError={Boolean(stateError)}
            />
          )}
        />
        {stateError && (
          <p className="error-text">{stateError}</p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-suburb`} className="label">Suburb{required && <RequiredMark />}</label>
        <SuburbCombobox
          id={`${idPrefix}-suburb`}
          state={state ?? ''}
          suburb={suburb ?? ''}
          postcode={postcode ?? ''}
          onPatch={patchAddress}
          hasError={Boolean(suburbError)}
        />
        {suburbError && (
          <p className="error-text">{suburbError}</p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-postcode`} className="label">Postcode{required && <RequiredMark />}</label>
        <input
          id={`${idPrefix}-postcode`}
          className={inputClass(Boolean(postcodeError))}
          aria-invalid={invalidAria(Boolean(postcodeError))}
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          {...postcodeRegistration}
          onChange={(e) => {
            e.target.value = postcodeDigits(e.target.value);
            postcodeRegistration.onChange(e);
          }}
        />
        {postcodeError && (
          <p className="error-text">{postcodeError}</p>
        )}
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
  hasError = false,
}: {
  id: string;
  state: string;
  suburb: string;
  postcode: string;
  onPatch: (patch: AddressPatch) => void;
  hasError?: boolean;
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
    return rankAustralianSuburbsForQuery(locations, state)
      .map((location) => ({
        label: formatLocationLabel(location),
        value: locationValue(location),
        searchText: `${location.suburb} ${location.postcode} ${location.state} ${location.stateCode}`,
      }));
  }, [locations, state]);

  const filterSuburbOptions = useMemo(() => {
    const optionByValue = new Map(options.map((option) => [option.value, option]));
    return (_options: ComboboxOption[], query: string) => rankAustralianSuburbsForQuery(locations, state, query)
      .map((location) => optionByValue.get(locationValue(location)))
      .filter((option): option is ComboboxOption => Boolean(option));
  }, [locations, options, state]);

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
      hasError={hasError}
      filterOptions={filterSuburbOptions}
    />
  );
}
