export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500" role="status" aria-live="polite">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-accent-600"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
