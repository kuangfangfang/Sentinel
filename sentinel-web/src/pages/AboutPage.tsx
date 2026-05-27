import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">About Sentinel</h1>

      <div className="card border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-900">Important: who we are (and are not)</h2>
        <p className="mt-2 text-amber-900">
          Sentinel is an <strong>independent demonstration project</strong>. It is <strong>not</strong> the
          Australian Human Rights Commission (AHRC), is not affiliated with any government body, and does not
          provide legal advice. It exists to show a better, more accessible way to make and track a complaint.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Why Sentinel exists</h2>
        <p className="text-slate-700">
          The traditional complaint process assumes you have a printer, a scanner, an email account, and the
          stamina to write a long, unstructured account of a distressing event. Each of those assumptions
          excludes someone — older people, people with disability, people with limited English, people without
          stable housing, or people in crisis.
        </p>
        <p className="text-slate-700">
          Sentinel captures a complaint as structured information from the first keystroke, gives you a way to
          track progress, and removes the printer, scanner and post office from the path entirely.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your safety and privacy</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>A <strong>Quick exit</strong> control is on every page, and pressing <kbd className="rounded border border-slate-300 px-1">Esc</kbd> twice leaves instantly.</li>
          <li>You can lodge a complaint <strong>anonymously</strong> and track it with a reference code only.</li>
          <li>Your information is sent securely and is only ever seen by authorised caseworkers.</li>
        </ul>
      </section>

      <div className="flex gap-3">
        <Link to="/what-we-handle" className="btn-secondary">What we can help with</Link>
        <Link to="/report" className="btn-primary">Start a complaint</Link>
      </div>
    </div>
  );
}
