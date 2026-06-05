import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { StepProps, WizardForm } from '../wizardTypes';
import type { GroundDto } from '../../../types';
import { InfoTooltip } from '../../../components/InfoTooltip';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parse, isValid, isAfter } from 'date-fns';
import { inputClass, invalidAria, RequiredMark, useFieldValidationDisplay } from '../fieldUi';
import { toDateOnlyString } from '../../../utils/format';
import { filterGroundGroups } from '../groundsFilter';

interface Props extends StepProps {
  groundsCatalog: GroundDto[];
  groundsLoading?: boolean;
  groundsLoadError?: string | null;
  onRetryGrounds?: () => void;
}

const RHF_UPDATE = { shouldDirty: true, shouldValidate: true };

function fieldErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('message' in error)) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

export function StepWhatHappened({ groundsCatalog, groundsLoading = false, groundsLoadError = null, onRetryGrounds }: Props) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<WizardForm>();
  const form = useWatch({ control }) as WizardForm;
  const showValidation = useFieldValidationDisplay();
  const [dateError, setDateError] = useState(false);
  const [groundQuery, setGroundQuery] = useState('');
  const titleError = showValidation ? fieldErrorMessage(errors.title) : undefined;
  const groundsError = showValidation ? fieldErrorMessage(errors.grounds) : undefined;
  const descriptionError = showValidation ? fieldErrorMessage(errors.description) : undefined;
  const incidentDateError = showValidation ? fieldErrorMessage(errors.incidentDate) : undefined;
  const incidentLocationError = showValidation ? fieldErrorMessage(errors.incidentLocation) : undefined;
  const delayReasonError = showValidation ? fieldErrorMessage(errors.delayReason) : undefined;

  const delayThreshold = new Date();
  delayThreshold.setHours(0, 0, 0, 0);
  delayThreshold.setMonth(delayThreshold.getMonth() - 24);
  const isLongDelay = form.incidentDate !== '' && new Date(`${form.incidentDate}T00:00:00`) < delayThreshold;

  const isSelected = (value: string) => form.grounds.some((g) => g.groundType === value);

  function groundDetailError(index: number): string | undefined {
    if (!showValidation) return undefined;
    const groundErrors = errors.grounds as Array<{ conditionalDetail?: unknown }> | undefined;
    return fieldErrorMessage(groundErrors?.[index]?.conditionalDetail);
  }

  function toggle(value: string) {
    const next = isSelected(value)
      ? form.grounds.filter((g) => g.groundType !== value)
      : [...form.grounds, { groundType: value, conditionalDetail: '' }];
    setValue('grounds', next, RHF_UPDATE);
  }

  function setDetail(value: string, detail: string) {
    setValue(
      'grounds',
      form.grounds.map((g) => (g.groundType === value ? { ...g, conditionalDetail: detail } : g)),
      RHF_UPDATE,
    );
  }

  const groups = useMemo(() => filterGroundGroups(groundsCatalog, groundQuery), [groundsCatalog, groundQuery]);

  function applyDateFromDate(d: Date | null) {
    if (!d) {
      setDateError(false);
      setValue('incidentDate', '', RHF_UPDATE);
      return;
    }
    const iso = toDateOnlyString(d);
    const longDelay = iso !== '' && new Date(`${iso}T00:00:00`) < delayThreshold;
    setDateError(false);
    setValue('incidentDate', iso, RHF_UPDATE);
    if (!longDelay) setValue('delayReason', '', RHF_UPDATE);
  }

  function applyDateFromInput(input: string) {
    const parsed = parse(input, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed) || isAfter(parsed, new Date())) {
      setDateError(true);
      return;
    }
    applyDateFromDate(parsed);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What happened?</h2>
        <p className="mt-1 text-sm text-slate-600">Choose the grounds that apply and tell us, in your own words, what happened.</p>
      </div>

      <div>
        <label htmlFor="title" className="label">A short title for your complaint<RequiredMark /></label>
        <input
          id="title"
          className={inputClass(Boolean(titleError))}
          aria-invalid={invalidAria(Boolean(titleError))}
          maxLength={150}
          placeholder="e.g. Refused workplace adjustments"
          {...register('title')}
        />
        {titleError && <p className="error-text">{titleError}</p>}
        <p className="help">A few words so you can recognise this complaint later.</p>
      </div>

      <fieldset className={groundsError ? 'fieldset-error' : undefined} aria-invalid={invalidAria(Boolean(groundsError))}>
        <legend className="label">Grounds of complaint (select all that apply)<RequiredMark /></legend>
        <p className="help">
          Search or browse the groups below. Select every ground that seems relevant; you can choose more than one.
        </p>
        <div className="mt-3 max-w-md">
          <label htmlFor="grounds-search" className="sr-only">Search grounds of complaint</label>
          <input
            id="grounds-search"
            type="search"
            className="input"
            placeholder="Search grounds, for example disability or race"
            value={groundQuery}
            onChange={(event) => setGroundQuery(event.target.value)}
          />
        </div>
        {groundsLoading && (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600" role="status">
            Loading grounds of complaint...
          </p>
        )}
        {groundsLoadError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <p>{groundsLoadError}</p>
            {onRetryGrounds && (
              <button type="button" className="btn-secondary mt-3" onClick={onRetryGrounds}>
                Retry
              </button>
            )}
          </div>
        )}
        <div className="space-y-4">
          {!groundsLoading && !groundsLoadError && groups.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              No grounds match your search. Try a broader term or clear the search.
            </p>
          )}
          {groups.map(({ group, items }) => (
            <details key={group} open className="rounded-lg border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-navy-900">
                {group} <span className="font-normal text-slate-500">({items.length})</span>
              </summary>
              <div className="mt-3 space-y-2">
                {items.map((g) => {
                  const selectedIndex = form.grounds.findIndex((x) => x.groundType === g.value);
                  const detailError = selectedIndex >= 0 ? groundDetailError(selectedIndex) : undefined;
                  const prompt = g.detailPrompt ?? `Details for ${g.label}`;

                  return (
                    <div key={g.value}>
                      <label className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 h-4 w-4" checked={isSelected(g.value)} onChange={() => toggle(g.value)} />
                        <span>{g.label}</span>
                      </label>
                      {selectedIndex >= 0 && g.requiresDetail && (
                        <div className="mt-2 ml-7 max-w-md" data-field-container>
                          <label htmlFor={`ground-detail-${g.value}`} className="label">
                            {prompt}<RequiredMark />
                          </label>
                          <input
                            id={`ground-detail-${g.value}`}
                            className={inputClass(Boolean(detailError))}
                            aria-invalid={invalidAria(Boolean(detailError))}
                            placeholder={prompt}
                            value={form.grounds[selectedIndex]?.conditionalDetail ?? ''}
                            onChange={(e) => setDetail(g.value, e.target.value)}
                          />
                          {detailError && <p className="error-text">{detailError}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
        {groundsError && <p className="error-text">{groundsError}</p>}
      </fieldset>

      <div>
        <label htmlFor="description" className="label">Describe what happened<RequiredMark /></label>
        <textarea
          id="description"
          className={inputClass(Boolean(descriptionError), 'min-h-[160px]')}
          aria-invalid={invalidAria(Boolean(descriptionError))}
          placeholder="What happened, where, and who was involved. There is no length limit. Take the space you need."
          {...register('description')}
        />
        {descriptionError && <p className="error-text">{descriptionError}</p>}
        <p className="help">{form.description.trim().length} characters (minimum 20).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <label htmlFor="incidentDate" className="text-sm font-medium text-navy-800">
              When did it happen?<RequiredMark />
            </label>
            <InfoTooltip label="Time limits for lodging a complaint">
              <span className="block">
                <span className="font-semibold text-slate-800">Note:</span> The President of the Commission can
                decide not to investigate into a complaint alleging unlawful discrimination where the complaint is
                lodged more than twenty-four (24) months after the alleged event(s) happened. If the event(s) being
                complained about happened more than 24 months ago, please explain the reasons for the delay in
                making a complaint to the Commission.
              </span>
              <span className="block">
                For complaints alleging human rights breaches and discrimination in employment under the ILO
                Convention, the relevant time frame is twelve (12) months.
              </span>
            </InfoTooltip>
          </div>
          <ReactDatePicker
            id="incidentDate"
            selected={form.incidentDate ? new Date(`${form.incidentDate}T00:00:00`) : null}
            onChange={(d: Date | null) => applyDateFromDate(d)}
            onChangeRaw={() => setDateError(false)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (!e.target.value) {
                applyDateFromDate(null);
                return;
              }
              applyDateFromInput(e.target.value);
            }}
            maxDate={new Date()}
            dateFormat="dd/MM/yyyy"
            className={inputClass(Boolean(dateError || incidentDateError), dateError || incidentDateError ? 'datepicker-error' : undefined)}
            placeholderText="dd/MM/yyyy"
            shouldCloseOnSelect
            showPopperArrow={false}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable
          />
          {dateError && <p className="help text-red-600">Please enter a valid date (DD/MM/YYYY) on or before today.</p>}
          {incidentDateError && <p className="error-text">{incidentDateError}</p>}
        </div>
        <div>
          <label htmlFor="incidentLocation" className="label">Where exactly did it happen?<RequiredMark /></label>
          <input
            id="incidentLocation"
            className={inputClass(Boolean(incidentLocationError))}
            aria-invalid={invalidAria(Boolean(incidentLocationError))}
            placeholder="e.g. Cafe name, street address or landmark, Suburb, State"
            {...register('incidentLocation')}
          />
          {incidentLocationError && <p className="error-text">{incidentLocationError}</p>}
          <p className="help">Give a specific location such as a venue name, street address or landmark.</p>
        </div>
      </div>

      {isLongDelay && (
        <div>
          <label htmlFor="delayReason" className="label">Reason for the delay in making this complaint<RequiredMark /></label>
          <textarea
            id="delayReason"
            className={inputClass(Boolean(delayReasonError), 'min-h-[90px]')}
            aria-invalid={invalidAria(Boolean(delayReasonError))}
            placeholder="The event happened more than 24 months ago. Please tell us why the complaint is being made now."
            {...register('delayReason')}
          />
          {delayReasonError && <p className="error-text">{delayReasonError}</p>}
          <p className="help">
            The Commission may decide not to investigate complaints lodged more than 24 months after the event
            (12 months for human-rights or ILO employment matters), but you can explain the delay here.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="outcome" className="label">How do you think this could be resolved? (optional)</label>
        <textarea
          id="outcome"
          className="input min-h-[90px]"
          placeholder="e.g. an apology, a change to a policy, training, or compensation."
          {...register('desiredOutcome')}
        />
      </div>
    </div>
  );
}
