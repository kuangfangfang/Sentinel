import { useEffect, useState } from 'react';
import type { StepProps } from '../wizardTypes';
import type { GroundDto } from '../../../types';
import { InfoTooltip } from '../../../components/InfoTooltip';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props extends StepProps {
  groundsCatalog: GroundDto[];
}

export function StepWhatHappened({ form, update, groundsCatalog }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  // AHRC form Part C: events older than 24 months may need an explanation for the delay.
  const delayThreshold = new Date();
  delayThreshold.setHours(0, 0, 0, 0);
  delayThreshold.setMonth(delayThreshold.getMonth() - 24);
  const isLongDelay = form.incidentDate !== '' && new Date(`${form.incidentDate}T00:00:00`) < delayThreshold;

  const isSelected = (value: string) => form.grounds.some((g) => g.groundType === value);

  function toggle(value: string) {
    if (isSelected(value)) {
      update({ grounds: form.grounds.filter((g) => g.groundType !== value) });
    } else {
      update({ grounds: [...form.grounds, { groundType: value, conditionalDetail: '' }] });
    }
  }

  function setDetail(value: string, detail: string) {
    update({ grounds: form.grounds.map((g) => (g.groundType === value ? { ...g, conditionalDetail: detail } : g)) });
  }

  const groups = groundsCatalog.reduce<Record<string, GroundDto[]>>((acc, g) => {
    (acc[g.group] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What happened?</h2>
        <p className="mt-1 text-sm text-slate-600">Choose the grounds that apply and tell us, in your own words, what happened.</p>
      </div>

      <div>
        <label htmlFor="title" className="label">A short title for your complaint</label>
        <input id="title" className="input" maxLength={150} value={form.title}
          onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Refused workplace adjustments" />
        <p className="help">A few words so you can recognise this complaint later.</p>
      </div>

      <fieldset>
        <legend className="label">Grounds of complaint (select all that apply)</legend>
        <div className="space-y-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="text-sm font-semibold text-slate-500">{group}</p>
              <div className="mt-2 space-y-2">
                {items.map((g) => (
                  <div key={g.value}>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4" checked={isSelected(g.value)} onChange={() => toggle(g.value)} />
                      <span>{g.label}</span>
                    </label>
                    {isSelected(g.value) && g.requiresDetail && (
                      <input
                        className="input mt-2 ml-7 max-w-md"
                        placeholder={g.detailPrompt ?? 'Please give details'}
                        aria-label={g.detailPrompt ?? `Details for ${g.label}`}
                        value={form.grounds.find((x) => x.groundType === g.value)?.conditionalDetail ?? ''}
                        onChange={(e) => setDetail(g.value, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="description" className="label">Describe what happened</label>
        <textarea id="description" className="input min-h-[160px]" value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What happened, where, and who was involved. There is no length limit — take the space you need." />
        <p className="help">{form.description.trim().length} characters (minimum 20).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <label htmlFor="incidentDate" className="text-sm font-medium text-navy-800">When did it happen?</label>
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
          {/* Pop-up calendar: replace native date input with ReactDatePicker */}
          <ReactDatePicker
            id="incidentDate"
            selected={form.incidentDate ? new Date(`${form.incidentDate}T00:00:00`) : null}
            onChange={(d: Date | null) => {
              const value = d ? d.toISOString().slice(0, 10) : '';
              const longDelay = value !== '' && new Date(`${value}T00:00:00`) < delayThreshold;
              update(longDelay ? { incidentDate: value } : { incidentDate: value, delayReason: '' });
            }}
            maxDate={new Date()}
            dateFormat="yyyy-MM-dd"
            className="input"
            placeholderText="Select a date"
            shouldCloseOnSelect
            showPopperArrow={false}
            showMonthDropdown={false}
            showYearDropdown={false}
            renderCustomHeader={({ monthDate, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
              <div className="react-datepicker__header flex items-center justify-between px-3 py-2">
                <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="btn-ghost">←</button>
                <div className="text-sm font-medium">{monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
                <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="btn-ghost">→</button>
              </div>
            )}
          />
        </div>
        <div>
          <label htmlFor="incidentLocation" className="label">Where exactly did it happen?</label>
          <input id="incidentLocation" className="input" value={form.incidentLocation}
            onChange={(e) => update({ incidentLocation: e.target.value })} placeholder="e.g. Café name, street address or landmark, Suburb, State" />
          <p className="help">Give a specific location such as a venue name, street address or landmark.</p>
        </div>
      </div>

      {isLongDelay && (
        <div>
          <label htmlFor="delayReason" className="label">Reason for the delay in making this complaint</label>
          <textarea id="delayReason" className="input min-h-[90px]" value={form.delayReason}
            onChange={(e) => update({ delayReason: e.target.value })}
            placeholder="The event happened more than 24 months ago. Please tell us why the complaint is being made now." />
          <p className="help">
            The Commission may decide not to investigate complaints lodged more than 24 months after the event
            (12 months for human-rights or ILO employment matters) — but you can explain the delay here.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="outcome" className="label">How do you think this could be resolved? (optional)</label>
        <textarea id="outcome" className="input min-h-[90px]" value={form.desiredOutcome}
          onChange={(e) => update({ desiredOutcome: e.target.value })}
          placeholder="e.g. an apology, a change to a policy, training, or compensation." />
      </div>
    </div>
  );
}
