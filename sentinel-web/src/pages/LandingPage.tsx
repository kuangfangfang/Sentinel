import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { isCaseworker } = useAuth();
  return (
    <div className="space-y-16">
      {/* Hero — names the problem and gives a clear call to action (FR-1) */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 inline-block rounded-full bg-accent-100 px-3 py-1 text-sm font-medium text-accent-700">
            A simpler, safer way to be heard
          </p>
          <h1 className="text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
            Report a human rights or discrimination incident — without the printer, scanner or post office.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            The traditional complaint process asks you to download a long form, fill it in, and post or email it back.
            Sentinel replaces that with a guided, plain-language process you can complete on your phone, save and resume,
            and track — anonymously if you choose.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isCaseworker ? (
              <Link to="/caseworker" className="btn-primary text-base">Go to your dashboard</Link>
            ) : (
              <>
                <Link to="/report" className="btn-primary text-base">Start a complaint</Link>
                <Link to="/track" className="btn-secondary text-base">Track an existing complaint</Link>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Worried about privacy? Use the <strong>Quick exit</strong> button at any time, or press <kbd className="rounded border border-slate-300 px-1">Esc</kbd> twice, to leave instantly.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-navy-900">How it works</h2>
          <ol className="mt-4 space-y-4">
            {[
              ['1', 'Tell us about you', 'Or report anonymously — no account required.'],
              ['2', 'Who and what', 'Add who the complaint is about and describe what happened, in steps.'],
              ['3', 'Review & lodge', 'Check everything, then receive a reference code to track progress.'],
            ].map(([n, title, body]) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">{n}</span>
                <div>
                  <p className="font-medium text-navy-900">{title}</p>
                  <p className="text-sm text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          ['Built for a phone', 'Designed mobile-first for people whose only device is a phone, on a limited data plan.'],
          ['Save and resume', 'Distressing to recount? Save your progress and come back when you are ready.'],
          ['Track your complaint', 'A private reference code lets you follow your complaint’s status at any time.'],
        ].map(([title, body]) => (
          <div key={title} className="card p-5">
            <h3 className="font-semibold text-navy-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-navy-900 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-semibold text-white">You don’t have to face it alone.</h2>
        <p className="mx-auto mt-2 max-w-2xl text-navy-100">
          If you are in immediate danger, call <strong>000</strong>. For crisis support and legal help, see our resources.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/resources" className="btn-secondary">View support resources</Link>
          {isCaseworker ? (
            <Link to="/caseworker" className="btn-primary">Go to your dashboard</Link>
          ) : (
            <Link to="/report" className="btn-primary">Start a complaint</Link>
          )}
        </div>
      </section>
    </div>
  );
}
