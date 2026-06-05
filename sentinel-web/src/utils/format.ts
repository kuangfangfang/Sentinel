function parseApiDateTime(value: string): Date {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  const d = parseApiDateTime(iso);
  if (Number.isNaN(d.getTime())) return '-';

  const formatter = new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  });
  const parts = Object.fromEntries(formatter.formatToParts(d).map((part) => [part.type, part.value]));
  const dayPeriod = (parts.dayPeriod ?? '').toLowerCase();
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${dayPeriod}`.trim();
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats a DateOnly string ("yyyy-MM-dd") without timezone surprises. */
export function formatDateOnly(value?: string | null): string {
  if (!value) return '-';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Converts a local Date object to a DateOnly string without UTC conversion. */
export function toDateOnlyString(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
