import { quickExit } from '../hooks/useQuickExit';

/**
 * The persistent Quick Exit control (FR-37). Always visible. Communicates the
 * double-Escape shortcut on screen (FR-38). Styled to be obvious but not alarming.
 */
export function QuickExitButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={quickExit}
      className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
      title="Leave this site immediately (or press Escape twice)"
      aria-label="Quick exit — leave this site immediately. You can also press the Escape key twice."
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Z" />
        <path d="M5.05 5.05a1 1 0 0 1 0 1.414 5 5 0 1 0 9.9 1.05 5 5 0 0 0-2.55-4.36 1 1 0 0 1 .98-1.744A7 7 0 1 1 3.636 6.464a1 1 0 0 1 1.414-1.414Z" />
      </svg>
      <span>Quick exit</span>
      {!compact && <span className="hidden sm:inline text-xs font-normal opacity-90">(Esc ×2)</span>}
    </button>
  );
}
