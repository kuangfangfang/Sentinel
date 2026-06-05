export interface WizardStepInfo {
  number: number;
  title: string;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  { number: 1, title: 'About you' },
  { number: 2, title: 'Who it is about' },
  { number: 3, title: 'What happened' },
  { number: 4, title: 'Supporting information' },
  { number: 5, title: 'Review & lodge' },
];

/** Visible progress indicator showing the current step and total steps (FR-13). */
export function WizardStepIndicator({ current }: { current: number }) {
  const currentStep = WIZARD_STEPS.find((step) => step.number === current);

  return (
    <nav aria-label="Progress" className="mb-6">
      <p className="sr-only">
        Step {current} of {WIZARD_STEPS.length}{currentStep ? `: ${currentStep.title}` : ''}
      </p>
      <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
        {WIZARD_STEPS.map((step, i) => {
          const isComplete = step.number < current;
          const isCurrent = step.number === current;
          return (
            <li key={step.number} className="flex items-center sm:flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isCurrent ? 'bg-accent-600 text-white' : isComplete ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.31a1 1 0 0 1-1.42 0L4.29 10.23a1 1 0 1 1 1.42-1.41l3.04 3.064 6.54-6.588a1 1 0 0 1 1.414-.006z" clipRule="evenodd" />
                    </svg>
                  ) : step.number}
                </span>
                <span className={`hidden text-sm ${isCurrent ? 'font-semibold text-navy-900' : 'text-slate-500'} sm:inline`}>
                  {step.title}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <span className="mx-2 hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      {currentStep && (
        <p className="mt-2 text-sm font-semibold text-navy-900 sm:hidden">
          Step {current} of {WIZARD_STEPS.length}: {currentStep.title}
        </p>
      )}
    </nav>
  );
}
