import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface ComboboxOption {
  label: string;
  value: string;
  searchText?: string;
}

interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value?: string | null;
  displayValue?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  noOptionsMessage?: string;
  hasError?: boolean;
  ariaDescribedBy?: string;
  className?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debounced;
}

export default function Combobox({
  id,
  options,
  value,
  displayValue,
  onChange,
  placeholder,
  disabled,
  noOptionsMessage,
  hasError = false,
  ariaDescribedBy,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const debouncedQuery = useDebouncedValue(query, 120);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const idRef = useRef<string>(id ?? `combobox-${Math.random().toString(36).slice(2, 9)}`);
  const listId = `${idRef.current}-list`;

  useEffect(() => {
    if (!open) setHighlight(0);
  }, [open]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.value} ${option.searchText ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [debouncedQuery, options]);

  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (!inputRef.current) return;
      if (
        e.target instanceof Node &&
        !inputRef.current.parentElement?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, []);

  useEffect(() => {
    const idx = filtered.findIndex((o) => o.value === value || o.label === value);
    if (idx >= 0) setHighlight(idx);
    else setHighlight(0);
  }, [filtered, value]);

  useEffect(() => {
    if (open && value === null) return;

    const selected = options.find((option) => option.value === value || option.label === value);
    setQuery(displayValue ?? selected?.label ?? value ?? '');
  }, [displayValue, open, options, value]);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const input = inputRef.current;
      if (!input) return;

      const rect = input.getBoundingClientRect();
      const viewportGap = 8;
      const availableBelow = window.innerHeight - rect.bottom - viewportGap;
      const availableAbove = rect.top - viewportGap;
      const preferredMaxHeight = 288;
      const openAbove = availableBelow < 180 && availableAbove > availableBelow;
      const maxHeight = Math.max(120, Math.min(preferredMaxHeight, openAbove ? availableAbove - 4 : availableBelow - 4));

      setDropdownPosition({
        top: openAbove ? Math.max(viewportGap, rect.top - maxHeight - 4) : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered[highlight]) {
        onChange(filtered[highlight].value);
        setQuery(filtered[highlight].label);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <input
        id={idRef.current}
        ref={inputRef}
        className={['input', className, hasError ? 'input-error' : ''].filter(Boolean).join(' ')}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && filtered[highlight] ? `${listId}-option-${highlight}` : undefined}
        aria-autocomplete="list"
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange(null);
        }}
        onKeyDown={handleKey}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          ref={listRef}
          className="z-50 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          style={{
            position: 'fixed',
            top: dropdownPosition?.top ?? 0,
            left: dropdownPosition?.left ?? 0,
            width: dropdownPosition?.width ?? undefined,
            maxHeight: dropdownPosition?.maxHeight ?? 288,
          }}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{noOptionsMessage ?? 'No options'}</li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value + i}
                id={`${listId}-option-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={`cursor-pointer px-3 py-2 text-sm ${i === highlight ? 'bg-slate-100' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  selectOption(opt);
                }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
