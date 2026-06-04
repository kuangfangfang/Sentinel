import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import Combobox, { type ComboboxOption } from '../../../components/Combobox';
import { complaintsApi } from '../../../api/complaints';
import { ApiError } from '../../../api/client';
import type { StepProps, WizardForm, WizardRespondent } from '../wizardTypes';
import { newRespondent } from '../wizardTypes';
import {
  AUSTRALIAN_STATES,
  formatLocationLabel,
  loadAustralianSuburbs,
  locationValue,
  type AustralianSuburb,
} from '../../../data/australianLocations';
import {
  isValidAbn,
  normalizeAbnAcn,
  validateAbnAcn,
  type RespondentPartyType,
} from '../respondentIdentity';
import { inputClass, invalidAria, RequiredMark, useFieldValidationDisplay } from '../fieldUi';

const RHF_UPDATE = { shouldDirty: true, shouldValidate: true };

interface LookupState {
  tone: 'neutral' | 'success' | 'warning';
  message: string;
  entityName?: string;
}

interface RespondentFieldsetProps {
  respondent: WizardRespondent;
  index: number;
  onRemove: () => void;
}

function fieldErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('message' in error)) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

function digitsOnly(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 10) : '';
}

function postcodeDigits(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 4) : '';
}

function RespondentFieldset({ respondent, index, onRemove }: RespondentFieldsetProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<WizardForm>();
  const showValidation = useFieldValidationDisplay();
  const [lookup, setLookup] = useState<LookupState | null>(null);
  const abnAcn = respondent.abnAcn ?? '';
  const validation = respondent.partyType === 'organisation' ? validateAbnAcn(abnAcn) : { kind: 'empty' as const };
  const respondentErrors = errors.respondents?.[index] ?? {};
  const nameError = showValidation ? fieldErrorMessage(respondentErrors.name) : undefined;
  const abnAcnError = showValidation ? fieldErrorMessage(respondentErrors.abnAcn) : undefined;
  const relationshipError = showValidation ? fieldErrorMessage(respondentErrors.relationshipToComplainant) : undefined;
  const addressError = showValidation ? fieldErrorMessage(respondentErrors.addressLine) : undefined;
  const stateError = showValidation ? fieldErrorMessage(respondentErrors.state) : undefined;
  const suburbError = showValidation ? fieldErrorMessage(respondentErrors.suburb) : undefined;
  const postcodeError = showValidation ? fieldErrorMessage(respondentErrors.postcode) : undefined;
  const emailError = showValidation ? fieldErrorMessage(respondentErrors.contactEmail) : undefined;
  const phoneError = showValidation ? fieldErrorMessage(respondentErrors.contactPhone) : undefined;
  const mobileError = showValidation ? fieldErrorMessage(respondentErrors.mobile) : undefined;

  useEffect(() => {
    if (respondent.partyType !== 'organisation') {
      setLookup(null);
      return;
    }

    if (abnAcn.length !== 11 || !isValidAbn(abnAcn)) {
      setLookup(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLookup({ tone: 'neutral', message: 'Checking ABN details...' });

      try {
        const result = await complaintsApi.lookupAbn(abnAcn, controller.signal);
        if (result.isVerified) {
          setLookup({
            tone: 'success',
            message: 'ABN verified.',
            entityName: result.entityName ?? undefined,
          });
          return;
        }

        setLookup({
          tone: result.lookupAvailable ? 'warning' : 'neutral',
          message: result.message ?? 'ABN could not be verified. Please double-check.',
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof ApiError
            ? error.message
            : 'Online ABN verification is unavailable right now.';
        setLookup({ tone: 'neutral', message });
      }
    }, 1000);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [abnAcn, respondent.partyType]);

  function setPartyType(next: RespondentPartyType) {
    setValue(`respondents.${index}.partyType`, next, RHF_UPDATE);
    setValue(`respondents.${index}.abnAcn`, next === 'organisation' ? respondent.abnAcn ?? '' : null, RHF_UPDATE);
    if (next === 'person') setLookup(null);
  }

  const helperText = validation.kind === 'empty'
    ? 'Use the organisation identifier if you know it.'
    : validation.kind === 'valid'
      ? validation.label === 'ACN'
        ? 'ACN format looks valid.'
        : lookup?.message ?? 'ABN format looks valid.'
      : validation.message;

  const helperTone =
    validation.kind === 'invalid' || validation.kind === 'incomplete'
      ? 'text-red-700'
      : validation.kind === 'valid'
        ? lookup?.tone === 'warning'
          ? 'text-amber-700'
          : lookup?.tone === 'neutral'
            ? 'text-slate-600'
            : 'text-green-700'
        : 'text-slate-500';

  const abnRegistration = register(`respondents.${index}.abnAcn`, { setValueAs: normalizeAbnAcn });
  const phoneRegistration = register(`respondents.${index}.contactPhone`, { setValueAs: digitsOnly });
  const mobileRegistration = register(`respondents.${index}.mobile`, { setValueAs: digitsOnly });
  const postcodeRegistration = register(`respondents.${index}.postcode`, { setValueAs: postcodeDigits });

  return (
    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-base font-semibold text-navy-900">Respondent {index + 1}</legend>

      <div className="mb-4 mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-800">Type</p>
          <div className="mt-2 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1">
            <button
              type="button"
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                respondent.partyType === 'person'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-slate-600 hover:text-navy-900',
              ].join(' ')}
              aria-pressed={respondent.partyType === 'person'}
              onClick={() => setPartyType('person')}
            >
              Person
            </button>
            <button
              type="button"
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                respondent.partyType === 'organisation'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-slate-600 hover:text-navy-900',
              ].join(' ')}
              aria-pressed={respondent.partyType === 'organisation'}
              onClick={() => setPartyType('organisation')}
            >
              Organisation
            </button>
          </div>
        </div>

        {index > 0 && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`r-name-${respondent.uiKey}`} className="label">
            {respondent.partyType === 'person'
              ? 'Name of person'
              : respondent.partyType === 'organisation'
              ? 'Name of organisation'
              : 'Name of person or organisation'}
            <RequiredMark />
          </label>
          <input
            id={`r-name-${respondent.uiKey}`}
            className={inputClass(Boolean(nameError))}
            aria-invalid={invalidAria(Boolean(nameError))}
            {...register(`respondents.${index}.name`)}
          />
          {nameError && (
            <p className="error-text">{nameError}</p>
          )}
        </div>

        {respondent.partyType === 'organisation' && (
          <div className="sm:col-span-2">
            <label htmlFor={`r-abn-${respondent.uiKey}`} className="label">ABN / ACN<RequiredMark /></label>
            <input
              id={`r-abn-${respondent.uiKey}`}
              className={inputClass(Boolean(abnAcnError))}
              aria-invalid={invalidAria(Boolean(abnAcnError))}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 12345678901 (ABN) or 123456789 (ACN)"
              {...abnRegistration}
              onChange={(e) => {
                e.target.value = normalizeAbnAcn(e.target.value);
                abnRegistration.onChange(e);
              }}
            />
            <p className={`mt-1 text-sm ${helperTone}`}>{helperText}</p>
            {abnAcnError && (
              <p className="error-text">{abnAcnError}</p>
            )}
            {lookup?.entityName && validation.kind === 'valid' && validation.label === 'ABN' && (
              <p className="mt-1 text-sm font-medium text-navy-900">{lookup.entityName}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`r-rel-${respondent.uiKey}`} className="label">Your relationship to them<RequiredMark /></label>
          <input
            id={`r-rel-${respondent.uiKey}`}
            className={inputClass(Boolean(relationshipError))}
            aria-invalid={invalidAria(Boolean(relationshipError))}
            placeholder="e.g. Employer, service provider"
            {...register(`respondents.${index}.relationshipToComplainant`)}
          />
          {relationshipError && (
            <p className="error-text">{relationshipError}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`r-address-${respondent.uiKey}`} className="label">Address<RequiredMark /></label>
          <input
            id={`r-address-${respondent.uiKey}`}
            className={inputClass(Boolean(addressError))}
            aria-invalid={invalidAria(Boolean(addressError))}
            {...register(`respondents.${index}.addressLine`)}
          />
          {addressError && (
            <p className="error-text">{addressError}</p>
          )}
        </div>
        <div>
          <label htmlFor={`r-state-${respondent.uiKey}`} className="label">State/Territory<RequiredMark /></label>
          <StateCombobox index={index} respondent={respondent} hasError={Boolean(stateError)} />
          {stateError && (
            <p className="error-text">{stateError}</p>
          )}
        </div>
        <div>
          <label htmlFor={`r-suburb-${respondent.uiKey}`} className="label">Suburb<RequiredMark /></label>
          <SuburbCombobox index={index} respondent={respondent} hasError={Boolean(suburbError)} />
          {suburbError && (
            <p className="error-text">{suburbError}</p>
          )}
        </div>
        <div>
          <label htmlFor={`r-postcode-${respondent.uiKey}`} className="label">Postcode<RequiredMark /></label>
          <input
            id={`r-postcode-${respondent.uiKey}`}
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
        <div>
          <label htmlFor={`r-email-${respondent.uiKey}`} className="label">Email<RequiredMark /></label>
          <input
            id={`r-email-${respondent.uiKey}`}
            type="email"
            className={inputClass(Boolean(emailError))}
            aria-invalid={invalidAria(Boolean(emailError))}
            {...register(`respondents.${index}.contactEmail`)}
          />
          {emailError && (
            <p className="error-text">{emailError}</p>
          )}
        </div>
        <div>
          <label htmlFor={`r-phone-${respondent.uiKey}`} className="label">Phone (BH)</label>
          <input
            id={`r-phone-${respondent.uiKey}`}
            className={inputClass(Boolean(phoneError))}
            aria-invalid={invalidAria(Boolean(phoneError))}
            inputMode="numeric"
            pattern="[0-9]*"
            {...phoneRegistration}
            onChange={(e) => {
              e.target.value = digitsOnly(e.target.value);
              phoneRegistration.onChange(e);
            }}
          />
          {phoneError && (
            <p className="error-text">{phoneError}</p>
          )}
        </div>
        <div>
          <label htmlFor={`r-mobile-${respondent.uiKey}`} className="label">Mobile<RequiredMark /></label>
          <input
            id={`r-mobile-${respondent.uiKey}`}
            className={inputClass(Boolean(mobileError))}
            aria-invalid={invalidAria(Boolean(mobileError))}
            inputMode="numeric"
            pattern="[0-9]*"
            {...mobileRegistration}
            onChange={(e) => {
              e.target.value = digitsOnly(e.target.value);
              mobileRegistration.onChange(e);
            }}
          />
          {mobileError && (
            <p className="error-text">{mobileError}</p>
          )}
        </div>
      </div>
    </fieldset>
  );
}

function StateCombobox({
  index,
  respondent,
  hasError = false,
}: {
  index: number;
  respondent: WizardRespondent;
  hasError?: boolean;
}) {
  const { control, setValue } = useFormContext<WizardForm>();

  return (
    <Controller
      control={control}
      name={`respondents.${index}.state`}
      render={({ field }) => (
        <Combobox
          id={`r-state-${respondent.uiKey}`}
          options={AUSTRALIAN_STATES}
          value={(field.value as string | null | undefined) ?? null}
          onChange={(val) => {
            field.onChange(val ?? '');
            setValue(`respondents.${index}.suburb`, '', RHF_UPDATE);
            setValue(`respondents.${index}.postcode`, null, RHF_UPDATE);
          }}
          placeholder="Select state"
          noOptionsMessage="No states"
          hasError={hasError}
        />
      )}
    />
  );
}

function SuburbCombobox({
  index,
  respondent,
  hasError = false,
}: {
  index: number;
  respondent: WizardRespondent;
  hasError?: boolean;
}) {
  const { setValue } = useFormContext<WizardForm>();
  const [locations, setLocations] = useState<AustralianSuburb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await loadAustralianSuburbs();
        if (!mounted) return;
        setLocations(data);
      } catch {
        setLocations([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const options: ComboboxOption[] = useMemo(() => {
    if (!respondent.state) return [];

    return locations
      .filter((location) => location.state === respondent.state)
      .map((location) => ({
        label: formatLocationLabel(location),
        value: locationValue(location),
        searchText: `${location.suburb} ${location.postcode} ${location.state} ${location.stateCode}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations, respondent.state]);

  const selectedValue =
    respondent.suburb && respondent.state && respondent.postcode
      ? `${respondent.suburb}|${respondent.state}|${respondent.postcode}`
      : respondent.suburb ?? null;

  return (
    <Combobox
      id={`r-suburb-${respondent.uiKey}`}
      options={options}
      value={selectedValue}
      displayValue={respondent.suburb ?? null}
      onChange={(val) => {
        if (!val) {
          setValue(`respondents.${index}.suburb`, '', RHF_UPDATE);
          setValue(`respondents.${index}.postcode`, null, RHF_UPDATE);
          return;
        }

        const [suburb, state, postcode] = val.split('|');
        setValue(`respondents.${index}.suburb`, suburb, RHF_UPDATE);
        setValue(`respondents.${index}.state`, state, RHF_UPDATE);
        setValue(`respondents.${index}.postcode`, postcode, RHF_UPDATE);
      }}
      placeholder={respondent.state ? 'Search suburb or postcode' : 'Select a state first'}
      disabled={!respondent.state || loading}
      noOptionsMessage={loading ? 'Loading...' : 'No suburbs'}
      hasError={hasError}
    />
  );
}

export function StepRespondents(_props: StepProps) {
  const { control } = useFormContext<WizardForm>();
  const respondents = (useWatch({ control, name: 'respondents' }) ?? []) as WizardRespondent[];
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'respondents',
    keyName: 'fieldKey',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Who is the complaint about?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add the person or organisation you are complaining about. You can add more than one.
        </p>
      </div>

      <div className="space-y-5">
        {fields.map((field, index) => {
          const respondent = respondents[index] ?? (field as unknown as WizardRespondent);
          return (
            <RespondentFieldset
              key={field.fieldKey}
              respondent={respondent}
              index={index}
              onRemove={() => remove(index)}
            />
          );
        })}
      </div>

      <button type="button" className="btn-secondary" onClick={() => append(newRespondent())}>
        + Add another respondent
      </button>
    </div>
  );
}
