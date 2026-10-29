/** Calendar dates as UTC midnight, so a date picked in any time zone means the same day everywhere. */
export function parseISODate(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

export const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * 864e5);

export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export const longDate = (d: Date): string =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Today's date (UTC) as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
}

/** Whole days from `a` to `b`. */
export const daysBetween = (a: Date, b: Date): number => Math.round((b.getTime() - a.getTime()) / 864e5);

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
