import { useEffect, useMemo, useState } from 'react';
import Combobox, { type ComboboxOption } from '../../../components/Combobox';
import { complaintsApi } from '../../../api/complaints';
import { ApiError } from '../../../api/client';
import type { StepProps } from '../wizardTypes';
import { newRespondent, type WizardRespondent } from '../wizardTypes';
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

interface LookupState {
  tone: 'neutral' | 'success' | 'warning';
  message: string;
  entityName?: string;
}

interface RespondentFieldsetProps {
  respondent: WizardRespondent;
  index: number;
  onPatch: (patch: Partial<WizardRespondent>) => void;
  onRemove: () => void;
}

function RespondentFieldset({ respondent, index, onPatch, onRemove }: RespondentFieldsetProps) {
  const [lookup, setLookup] = useState<LookupState | null>(null);
  const abnAcn = respondent.abnAcn ?? '';
  const validation = respondent.partyType === 'organisation' ? validateAbnAcn(abnAcn) : { kind: 'empty' as const };

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
    onPatch({
      partyType: next,
      abnAcn: next === 'organisation' ? respondent.abnAcn ?? '' : null,
    });
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
          </label>
          <input
            id={`r-name-${respondent.uiKey}`}
            className="input"
            value={respondent.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            required
          />
        </div>

        {respondent.partyType === 'organisation' && (
          <div className="sm:col-span-2">
            <label htmlFor={`r-abn-${respondent.uiKey}`} className="label">ABN / ACN</label>
            <input
              id={`r-abn-${respondent.uiKey}`}
              className="input"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={abnAcn}
              onChange={(e) => onPatch({ abnAcn: normalizeAbnAcn(e.target.value) })}
              placeholder="e.g. 12345678901 (ABN) or 123456789 (ACN)"
            />
            <p className={`mt-1 text-sm ${helperTone}`}>{helperText}</p>
            {lookup?.entityName && validation.kind === 'valid' && validation.label === 'ABN' && (
              <p className="mt-1 text-sm font-medium text-navy-900">{lookup.entityName}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`r-rel-${respondent.uiKey}`} className="label">Your relationship to them</label>
          <input
            id={`r-rel-${respondent.uiKey}`}
            className="input"
            value={respondent.relationshipToComplainant ?? ''}
            onChange={(e) => onPatch({ relationshipToComplainant: e.target.value })}
            placeholder="e.g. Employer, service provider"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`r-address-${respondent.uiKey}`} className="label">Address</label>
          <input
            id={`r-address-${respondent.uiKey}`}
            className="input"
            value={respondent.addressLine ?? ''}
            onChange={(e) => onPatch({ addressLine: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`r-state-${respondent.uiKey}`} className="label">State/Territory</label>
          <StateCombobox
            id={`r-state-${respondent.uiKey}`}
            respondent={respondent}
            onPatch={(p) => onPatch(p)}
          />
        </div>
        <div>
          <label htmlFor={`r-suburb-${respondent.uiKey}`} className="label">Suburb</label>
          <SuburbCombobox
            id={`r-suburb-${respondent.uiKey}`}
            respondent={respondent}
            onPatch={(p) => onPatch(p)}
          />
        </div>
        <div>
          <label htmlFor={`r-postcode-${respondent.uiKey}`} className="label">Postcode</label>
          <input
            id={`r-postcode-${respondent.uiKey}`}
            className="input"
            value={respondent.postcode ?? ''}
            onChange={(e) => onPatch({ postcode: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`r-email-${respondent.uiKey}`} className="label">Email</label>
          <input
            id={`r-email-${respondent.uiKey}`}
            type="email"
            className="input"
            value={respondent.contactEmail ?? ''}
            onChange={(e) => onPatch({ contactEmail: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`r-phone-${respondent.uiKey}`} className="label">Phone (BH)</label>
          <input
            id={`r-phone-${respondent.uiKey}`}
            className="input"
            value={respondent.contactPhone ?? ''}
            onChange={(e) => onPatch({ contactPhone: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`r-mobile-${respondent.uiKey}`} className="label">Mobile</label>
          <input
            id={`r-mobile-${respondent.uiKey}`}
            className="input"
            value={respondent.mobile ?? ''}
            onChange={(e) => onPatch({ mobile: e.target.value })}
          />
        </div>
      </div>
    </fieldset>
  );
}

function StateCombobox({
  id,
  respondent,
  onPatch,
}: {
  id: string;
  respondent: WizardRespondent;
  onPatch: (p: Partial<WizardRespondent>) => void;
}) {
  return (
    <Combobox
      id={id}
      options={AUSTRALIAN_STATES}
      value={respondent.state ?? null}
      onChange={(val) => {
        onPatch({ state: val ?? '', suburb: '', postcode: null });
      }}
      placeholder="Select state"
      noOptionsMessage="No states"
    />
  );
}

function SuburbCombobox({
  id,
  respondent,
  onPatch,
}: {
  id: string;
  respondent: WizardRespondent;
  onPatch: (p: Partial<WizardRespondent>) => void;
}) {
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
      id={id}
      options={options}
      value={selectedValue}
      onChange={(val) => {
        if (!val) {
          onPatch({ suburb: '', postcode: null });
          return;
        }

        const [suburb, state, postcode] = val.split('|');
        onPatch({ suburb, state, postcode });
      }}
      placeholder={respondent.state ? 'Search suburb or postcode' : 'Select a state first'}
      disabled={!respondent.state || loading}
      noOptionsMessage={loading ? 'Loading...' : 'No suburbs'}
    />
  );
}

export function StepRespondents({ form, update }: StepProps) {
  function patch(index: number, p: Partial<WizardRespondent>) {
    const next = form.respondents.map((r, i) => (i === index ? { ...r, ...p } : r));
    update({ respondents: next });
  }

  function add() {
    update({ respondents: [...form.respondents, newRespondent()] });
  }

  function remove(index: number) {
    update({ respondents: form.respondents.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Who is the complaint about?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add the person or organisation you are complaining about. You can add more than one.
        </p>
      </div>

      <div className="space-y-5">
        {form.respondents.map((respondent, index) => (
          <RespondentFieldset
            key={respondent.uiKey}
            respondent={respondent}
            index={index}
            onPatch={(next) => patch(index, next)}
            onRemove={() => remove(index)}
          />
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={add}>+ Add another respondent</button>
    </div>
  );
}
