import { useId, useRef, useState, type ReactNode } from 'react';

interface InfoTooltipProps {
  /** Accessible name for the trigger button (announced to screen readers). */
  label: string;
  /** The note content shown in the popover. */
  children: ReactNode;
}

/**
 * Small accessible "i" affordance that reveals an explanatory note.
 * Opens on hover, on keyboard focus, and toggles (pins open) on click/tap, so
 * it works for mouse, touch and keyboard users alike (WCAG 1.4.13 / FR-39).
 */
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const open = hovered || focused || pinned;

  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setPinned(false);
            btnRef.current?.blur();
          }
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400
                   text-[11px] font-bold italic leading-none text-slate-500 transition-colors
                   hover:border-accent-500 hover:text-accent-600"
      >
        i
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-2 block w-72 max-w-[calc(100vw-3rem)] space-y-2
                     rounded-lg border border-slate-200 bg-white p-3 text-left text-xs font-normal
                     normal-case leading-relaxed text-slate-600 shadow-lg sm:w-80"
        >
          {children}
        </span>
      )}
    </span>
  );
}
