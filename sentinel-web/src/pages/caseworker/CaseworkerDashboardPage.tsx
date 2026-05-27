import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { caseworkerApi } from '../../api/caseworker';
import type { AnalyticsDto, DashboardSummaryDto } from '../../types';
import { Spinner } from '../../components/Spinner';

export function CaseworkerDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([caseworkerApi.dashboard(), caseworkerApi.analytics()])
      .then(([s, a]) => {
        setSummary(s);
        setAnalytics(a);
      })
      .catch(() => setError('Could not load the dashboard.'));
  }, []);

  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>;
  if (!summary || !analytics) return <Spinner />;

  const stats = [
    { label: 'Total complaints', value: summary.total },
    { label: 'Open', value: summary.openCount },
    { label: 'Under review', value: summary.byStatus['UnderReview'] ?? 0 },
    { label: 'Resolved', value: summary.byStatus['Resolved'] ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Caseworker dashboard</h1>
        <Link to="/caseworker/queue" className="btn-primary">Open the triage queue</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-navy-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-navy-900">Complaints by category</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byGround} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Accessible text alternative to the chart (FR-39). */}
          <table className="sr-only">
            <caption>Complaints by category</caption>
            <thead><tr><th>Category</th><th>Count</th></tr></thead>
            <tbody>
              {analytics.byGround.map((g) => <tr key={g.category}><td>{g.category}</td><td>{g.count}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-navy-900">Complaints by month</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byMonth} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1f3760" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Complaints by month</caption>
            <thead><tr><th>Month</th><th>Count</th></tr></thead>
            <tbody>
              {analytics.byMonth.map((m) => <tr key={m.month}><td>{m.month}</td><td>{m.count}</td></tr>)}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
