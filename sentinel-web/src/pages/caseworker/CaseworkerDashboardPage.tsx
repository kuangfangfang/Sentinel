import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { caseworkerApi } from '../../api/caseworker';
import type { AnalyticsDto, DashboardSummaryDto } from '../../types';
import { Spinner } from '../../components/Spinner';

// Palettes mirror StatusBadge / SeverityBadge so the charts stay visually consistent.
const STATUS_ORDER = ['Submitted', 'UnderReview', 'MoreInfoNeeded', 'Resolved', 'Closed', 'Withdrawn'] as const;
const STATUS_LABELS: Record<string, string> = {
  Submitted: 'Submitted',
  UnderReview: 'Under review',
  MoreInfoNeeded: 'More info needed',
  Resolved: 'Resolved',
  Closed: 'Closed',
  Withdrawn: 'Withdrawn',
};
const STATUS_COLORS: Record<string, string> = {
  Submitted: '#2563eb',
  UnderReview: '#d97706',
  MoreInfoNeeded: '#7c3aed',
  Resolved: '#16a34a',
  Closed: '#64748b',
  Withdrawn: '#e11d48',
};
const SEVERITY_COLORS: Record<string, string> = {
  Low: '#64748b',
  Medium: '#ca8a04',
  High: '#ea580c',
  Critical: '#dc2626',
};

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

  // The category chart axis shows concise ground names; the tooltip restores the full label.
  const fullLabelByShort = Object.fromEntries(analytics.byGround.map((g) => [g.shortCategory, g.category]));

  const statusData = STATUS_ORDER
    .map((s) => ({ name: STATUS_LABELS[s], value: (summary.byStatus ?? {})[s] ?? 0, color: STATUS_COLORS[s] }))
    .filter((d) => d.value > 0);
  const severityData = (analytics.bySeverity ?? [])
    .map((s) => ({ name: s.category, value: s.count, color: SEVERITY_COLORS[s.category] ?? '#64748b' }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Caseworker dashboard</h1>
        <Link to="/caseworker/queue" className="btn-primary">Open the triage queue</Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">My work</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SignalCard label="Assigned to me (open)" value={summary.assignedToMeOpen} to="/caseworker/queue?assignee=me&openOnly=1" />
          <SignalCard label="My cases awaiting info" value={summary.myAwaitingInfo} to="/caseworker/queue?assignee=me&status=MoreInfoNeeded" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Needs attention</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SignalCard label="Unassigned" value={summary.unassigned} hint="Awaiting triage" to="/caseworker/queue?unassigned=1" />
          <SignalCard label="More info needed" value={summary.byStatus['MoreInfoNeeded'] ?? 0} hint="Waiting on complainant" to="/caseworker/queue?status=MoreInfoNeeded" />
          <SignalCard label="High / Critical open" value={summary.highSeverityOpen} hint="Highest severity first" to="/caseworker/queue?openOnly=1&sort=severity&dir=desc" />
          <SignalCard label="Aging open (>30 days)" value={summary.agingOpen} hint="Oldest first" to="/caseworker/queue?openOnly=1&sort=submitted&dir=asc" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total complaints" value={summary.total} />
          <StatCard label="Open" value={summary.openCount} />
          <StatCard label="Under review" value={summary.byStatus['UnderReview'] ?? 0} />
          <StatCard label="Resolved" value={summary.byStatus['Resolved'] ?? 0} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trends</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-semibold text-navy-900">Complaints by status</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="sr-only">
              <table>
                <caption>Complaints by status</caption>
                <thead><tr><th>Status</th><th>Count</th></tr></thead>
                <tbody>
                  {statusData.map((d) => <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-navy-900">Complaints by severity</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {severityData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="sr-only">
              <table>
                <caption>Complaints by severity</caption>
                <thead><tr><th>Severity</th><th>Count</th></tr></thead>
                <tbody>
                  {severityData.map((d) => <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <section className="card p-5">
            <h3 className="font-semibold text-navy-900">Complaints by category</h3>
            <div className="mt-4" style={{ height: Math.max(288, analytics.byGround.length * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byGround} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="shortCategory"
                    width={150}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip labelFormatter={(label) => fullLabelByShort[String(label)] ?? label} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Accessible text alternative to the chart (FR-39). */}
            <div className="sr-only">
              <table>
                <caption>Complaints by category</caption>
                <thead><tr><th>Category</th><th>Count</th></tr></thead>
                <tbody>
                  {analytics.byGround.map((g) => <tr key={g.category}><td>{g.category}</td><td>{g.count}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-semibold text-navy-900">Lodged vs resolved by month</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byMonth} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lodged" name="Lodged" fill="#1f3760" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="sr-only">
              <table>
                <caption>Complaints lodged and resolved by month</caption>
                <thead><tr><th>Month</th><th>Lodged</th><th>Resolved</th></tr></thead>
                <tbody>
                  {analytics.byMonth.map((m) => <tr key={m.month}><td>{m.month}</td><td>{m.lodged}</td><td>{m.resolved}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SignalCard({ label, value, hint, to }: { label: string; value: number; hint?: string; to: string }) {
  return (
    <Link to={to} className="card p-5 transition hover:border-accent-300 hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-accent-700">{hint ?? 'View in queue'} &rarr;</p>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
