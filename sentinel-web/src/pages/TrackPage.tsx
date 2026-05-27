import { FormEvent, useState } from 'react';
import { trackingApi } from '../api/tracking';
import { ApiError } from '../api/client';
import type { TrackResultDto } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { formatDateTime } from '../utils/format';

export function TrackPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      setResult(await trackingApi.track(code.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not look up that reference code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Track a complaint</h1>
        <p className="mt-1 text-slate-600">
          Enter the reference code you received when you lodged your complaint. You don’t need an account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="code" className="label">Reference code</label>
          <input id="code" className="input font-mono uppercase" placeholder="SEN-2026-XXXXXX"
            value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Looking up…' : 'Check status'}
        </button>
      </form>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}

      {result && (
        <div className="card space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-sm text-slate-500">{result.referenceCode}</p>
              <h2 className="text-lg font-semibold">{result.title}</h2>
            </div>
            <StatusBadge status={result.status} />
          </div>
          <p className="text-sm text-slate-500">Lodged {formatDateTime(result.submittedAt)}</p>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Progress</h3>
            <StatusTimeline history={result.statusHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
