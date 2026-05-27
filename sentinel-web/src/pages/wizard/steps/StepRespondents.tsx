import type { StepProps } from '../wizardTypes';
import type { RespondentDto } from '../../../types';

export function StepRespondents({ form, update }: StepProps) {
  function patch(index: number, p: Partial<RespondentDto>) {
    const next = form.respondents.map((r, i) => (i === index ? { ...r, ...p } : r));
    update({ respondents: next });
  }
  function add() {
    update({ respondents: [...form.respondents, { name: '', relationshipToComplainant: '' }] });
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
        {form.respondents.map((r, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-navy-900">Respondent {i + 1}</h3>
              {form.respondents.length > 1 && (
                <button type="button" className="text-sm font-medium text-red-700 hover:underline" onClick={() => remove(i)}>
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={`r-name-${i}`} className="label">Name of person or organisation</label>
                <input id={`r-name-${i}`} className="input" value={r.name}
                  onChange={(e) => patch(i, { name: e.target.value })} required />
              </div>
              <div>
                <label htmlFor={`r-abn-${i}`} className="label">ABN/ACN (if an organisation, optional)</label>
                <input id={`r-abn-${i}`} className="input" value={r.abnAcn ?? ''}
                  onChange={(e) => patch(i, { abnAcn: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`r-rel-${i}`} className="label">Your relationship to them</label>
                <input id={`r-rel-${i}`} className="input" value={r.relationshipToComplainant ?? ''}
                  onChange={(e) => patch(i, { relationshipToComplainant: e.target.value })} placeholder="e.g. Employer, service provider" />
              </div>
              <div>
                <label htmlFor={`r-suburb-${i}`} className="label">Suburb (optional)</label>
                <input id={`r-suburb-${i}`} className="input" value={r.suburb ?? ''}
                  onChange={(e) => patch(i, { suburb: e.target.value })} />
              </div>
              <div>
                <label htmlFor={`r-state-${i}`} className="label">State (optional)</label>
                <input id={`r-state-${i}`} className="input" value={r.state ?? ''}
                  onChange={(e) => patch(i, { state: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={add}>+ Add another respondent</button>
    </div>
  );
}
