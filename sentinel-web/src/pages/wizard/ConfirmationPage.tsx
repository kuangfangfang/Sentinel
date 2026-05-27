import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ConfirmationState {
  referenceCode?: string;
  isAnonymous?: boolean;
}

export function ConfirmationPage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const state = location.state as ConfirmationState | null;

  if (!state?.referenceCode) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100" aria-hidden="true">
        <svg className="h-7 w-7 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Your complaint has been lodged</h1>
      <p className="mt-2 text-slate-600">Keep your reference code safe — you’ll use it to track progress.</p>

      <div className="card mt-6 p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Reference code</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-navy-900">{state.referenceCode}</p>
      </div>

      {state.isAnonymous && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900" role="note">
          You lodged this complaint anonymously. This code is the <strong>only</strong> way to track it — please
          write it down or save it now. We cannot recover it for you.
        </div>
      )}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
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
