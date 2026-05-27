import { useEffect, useState } from 'react';
import { resourcesApi } from '../api/resources';
import type { ResourceDto } from '../types';
import { Spinner } from '../components/Spinner';

export function ResourcesPage() {
  const [resources, setResources] = useState<ResourceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resourcesApi.list().then(setResources).catch(() => setError('Could not load resources right now.'));
  }, []);

  const groups = (resources ?? []).reduce<Record<string, ResourceDto[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support resources</h1>
        <p className="mt-1 text-slate-600">Help lines, crisis support and legal aid. You can use these without an account.</p>
      </div>

      <div className="card border-red-200 bg-red-50 p-4" role="note">
        <p className="font-semibold text-red-800">In immediate danger?</p>
        <p className="text-red-800">Call <a href="tel:000" className="font-bold underline">000</a> now.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
      {resources === null && !error && <Spinner />}

      <div className="space-y-6">
        {Object.entries(groups).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-lg font-semibold text-navy-900">{category}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((r) => (
                <li key={r.id} className="card p-4">
                  <h3 className="font-semibold text-navy-900">{r.name}</h3>
                  {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {r.phoneNumber && (
                      <a href={`tel:${r.phoneNumber.replace(/\s/g, '')}`} className="font-medium text-accent-700 hover:underline">
                        Call {r.phoneNumber}
                      </a>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-700 hover:underline">
                        Visit website
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
