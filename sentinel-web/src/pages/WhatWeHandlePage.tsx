import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaints';
import type { GroundDto } from '../types';
import { Spinner } from '../components/Spinner';

export function WhatWeHandlePage() {
  const [grounds, setGrounds] = useState<GroundDto[] | null>(null);

  useEffect(() => {
    complaintsApi.getGrounds().then(setGrounds).catch(() => setGrounds([]));
  }, []);

  const groups = (grounds ?? []).reduce<Record<string, GroundDto[]>>((acc, g) => {
    (acc[g.group] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">What kinds of complaint can I make?</h1>
      <p className="text-slate-700">
        Sentinel mirrors the grounds recognised by the Australian Human Rights Commission. You can make a
        complaint about discrimination, harassment, racial hatred, breaches of human rights by a Commonwealth
        body, and victimisation. Below are the grounds you can choose from.
      </p>

      {grounds === null ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} className="card p-5">
              <h2 className="text-lg font-semibold text-navy-900">{group}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {items.map((g) => (
                  <li key={g.value} className="flex items-start gap-2 text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-600" aria-hidden="true" />
                    {g.label}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link to="/report" className="btn-primary">Start a complaint</Link>
    </div>
  );
}
