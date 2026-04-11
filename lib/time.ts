/**
 * Time handling conventions for Mihraby.
 *
 * STORAGE
 *   All timestamps in MySQL are stored as UTC via `DATETIME` columns. MySQL
 *   `DATETIME` is timezone-naive — we take the responsibility of only writing
 *   UTC values and only reading them as UTC.
 *
 * DISPLAY
 *   The default user-facing timezone is Africa/Cairo (EGY, UTC+2, no DST).
 *   Frontend components render times using `formatInCairo` below or the
 *   equivalent `Intl.DateTimeFormat` pattern.
 *
 * VALIDATION
 *   Incoming datetimes must be ISO 8601 strings (e.g. 2026-04-15T14:30:00Z).
 *   Zod validators use `z.string().datetime()` which enforces this.
 */

export const APP_TIMEZONE = 'Africa/Cairo';

/**
 * Serialize a Date to the ISO 8601 UTC string that our API contracts use.
 * Equivalent to `date.toISOString()` but named so intent is obvious at call sites.
 */
export function toIsoUtc(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO 8601 string into a Date. Throws on malformed input so callers
 * don't silently propagate `Invalid Date` downstream.
 */
export function parseIso(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO datetime: ${value}`);
  }
  return date;
}

/**
 * Format a UTC date for display in Cairo local time.
 *
 * @example
 *   formatInCairo(new Date('2026-04-15T14:30:00Z'))
 *   // => "Apr 15, 2026, 4:30 PM"
 */
export function formatInCairo(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }
): string {
  return new Intl.DateTimeFormat('en-GB', {
    ...options,
    timeZone: APP_TIMEZONE
  }).format(date);
}

/**
 * Convenience: minutes-from-now comparisons used by the booking hold expiry.
 */
export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Compute duration in minutes between two Dates.
 */
export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}
