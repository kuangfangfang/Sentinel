import { useEffect, useRef, useState } from 'react';
import {
  DEMO_DISCLAIMER_TEXT,
  acceptDemoDisclaimer,
  hasAcceptedDemoDisclaimer,
} from '../data/demoDisclaimer';
import { QuickExitButton } from './QuickExitButton';

export function DemoDisclaimerGate() {
  const [accepted, setAccepted] = useState(() => hasAcceptedDemoDisclaimer());
  const [showRequiredMessage, setShowRequiredMessage] = useState(false);
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (accepted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    acceptButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [accepted]);

  function handleAccept() {
    acceptDemoDisclaimer();
    setAccepted(true);
  }

  function handleDecline() {
    setShowRequiredMessage(true);
    acceptButtonRef.current?.focus();
  }

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/80 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-disclaimer-title"
        aria-describedby="demo-disclaimer-description demo-disclaimer-required"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-700">Demo notice</p>
        <h2 id="demo-disclaimer-title" className="text-2xl font-semibold text-navy-900">
          Before you use Sentinel
        </h2>
        <p id="demo-disclaimer-description" className="mt-3 text-base leading-7 text-slate-700">
          {DEMO_DISCLAIMER_TEXT}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          By selecting Yes, you acknowledge that this site is for demonstration purposes only.
        </p>

        {showRequiredMessage && (
          <p id="demo-disclaimer-required" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            You must agree to this notice before using the demo.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <QuickExitButton compact />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={handleDecline}>
              No
            </button>
            <button ref={acceptButtonRef} type="button" className="btn-primary" onClick={handleAccept}>
              Yes, I understand
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
