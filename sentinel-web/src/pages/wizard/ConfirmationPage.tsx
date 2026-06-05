import { useLayoutEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buildReferenceCodeText,
  type ConfirmationComplaintSummary,
} from './confirmationActions';
import { formatDateTime } from '../../utils/format';

interface ConfirmationState {
  referenceCode?: string;
  submittedAtUtc?: string;
  isAnonymous?: boolean;
  complaintSummary?: ConfirmationComplaintSummary;
}

export function ConfirmationPage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const state = location.state as ConfirmationState | null;
  const [copied, setCopied] = useState(false);

  if (!state?.referenceCode) return <Navigate to="/" replace />;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    const timeoutId = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  async function copyReferenceCode() {
    if (!state?.referenceCode) return;
    const text = buildReferenceCodeText(state.referenceCode, Boolean(state.isAnonymous));
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100" aria-hidden="true">
        <svg className="h-7 w-7 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Your complaint has been lodged</h1>
      <p className="mt-2 text-slate-600">Keep your reference code safe. You will use it to track progress.</p>

      <div className="card mt-6 p-6 print:border-2 print:border-navy-900">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Reference code</p>
        <p className="notranslate mt-2 break-all font-mono text-3xl font-bold tracking-wider text-navy-900" translate="no">
          {state.referenceCode}
        </p>
        {state.submittedAtUtc && (
          <p className="mt-3 text-sm text-slate-500">
            Lodged <span className="notranslate" translate="no">{formatDateTime(state.submittedAtUtc)}</span>
          </p>
        )}
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
          <button type="button" className="btn-secondary" onClick={copyReferenceCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            Print / save summary
          </button>
        </div>
      </div>

      {state.complaintSummary?.sections.length ? (
        <div className="mt-6 space-y-4 text-left">
          <div className="hidden print:block">
            <h2 className="text-xl font-semibold text-navy-900">Complaint summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Printed on {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {state.complaintSummary.sections.map((section) => (
            <section key={section.title} className="card p-5 print:break-inside-avoid print:border print:border-slate-300 print:shadow-none">
              <h2 className="text-base font-semibold text-navy-900">{section.title}</h2>
              <dl className="mt-3 divide-y divide-slate-100">
                {section.rows.map((row) => (
                  <div key={`${section.title}-${row.label}`} className="grid gap-1 py-2 sm:grid-cols-[11rem,1fr] sm:gap-4">
                    <dt className="text-sm font-medium text-slate-500">{row.label}</dt>
                    <dd
                      className={[
                        'text-sm text-slate-900',
                        row.preserveWhitespace ? 'whitespace-pre-wrap' : '',
                        row.notranslate ? 'notranslate' : '',
                      ].filter(Boolean).join(' ')}
                      translate={row.notranslate ? 'no' : undefined}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : null}

      {state.isAnonymous && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900" role="note">
          You lodged this complaint anonymously. This code is the <strong>only</strong> way to track it. Please
          write it down or save it now. We cannot recover it for you.
        </div>
      )}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
        <Link to="/track" className="btn-secondary">Track this complaint</Link>
        {isAuthenticated ? (
          <Link to="/dashboard" className="btn-primary">Go to my complaints</Link>
        ) : (
          <Link to="/" className="btn-primary">Return home</Link>
        )}
      </div>
    </div>
  );
}
