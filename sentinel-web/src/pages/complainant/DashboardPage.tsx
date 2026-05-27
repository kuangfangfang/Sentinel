import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsApi } from '../../api/complaints';
import { useAuth } from '../../context/AuthContext';
import type { ComplaintListItemDto } from '../../types';
import { Spinner } from '../../components/Spinner';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintListItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setComplaints(await complaintsApi.mine());
    } catch {
      setError('Could not load your complaints.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteDraft(id: string) {
    if (!confirm('Delete this draft? This cannot be undone.')) return;
    try {
      await complaintsApi.deleteDraft(id);
      await load();
    } catch {
      setError('Could not delete that draft.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My complaints</h1>
          <p className="text-slate-600">Welcome back, {user?.fullName}.</p>
        </div>
        <Link to="/report" className="btn-primary">Start a new complaint</Link>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
      {complaints === null && !error && <Spinner />}

      {complaints && complaints.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-slate-600">You haven’t lodged any complaints yet.</p>
          <Link to="/report" className="btn-primary mt-4">Start your first complaint</Link>
        </div>
      )}

      {complaints && complaints.length > 0 && (
        <ul className="space-y-3">
          {complaints.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status} />
                    {c.referenceCode && <span className="font-mono text-xs text-slate-500">{c.referenceCode}</span>}
                  </div>
                  <h2 className="mt-1 font-semibold text-navy-900">{c.title || 'Untitled draft'}</h2>
                  <p className="text-sm text-slate-500">
                    {c.status === 'Draft' ? `Last edited ${formatDate(c.updatedAt)}` : `Lodged ${formatDate(c.submittedAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {c.status === 'Draft' ? (
                    <>
                      <button className="btn-secondary" onClick={() => navigate(`/report/${c.id}`)}>Resume</button>
                      <button className="btn-ghost text-red-700" onClick={() => deleteDraft(c.id)}>Delete</button>
                    </>
                  ) : (
                    <Link to={`/complaints/${c.id}`} className="btn-secondary">View</Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
