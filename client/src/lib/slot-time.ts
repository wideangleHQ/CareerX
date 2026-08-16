/**
 * Interview slot times come from a PostgreSQL TIME column — a pure wall-clock
 * value with no timezone. Prisma serializes it as "1970-01-01T09:00:00.000Z",
 * so the stored time lives in the HH:MM right after the "T".
 *
 * NEVER pass these strings through `new Date(...).toLocaleTimeString(...)`:
 * that treats the value as a UTC instant and shifts it into the browser's
 * timezone (e.g. 09:00 becomes 02:30 PM in IST). Always format via these
 * helpers, which read the digits directly and involve no Date object.
 */

/** Extract "YYYY-MM-DD" from any slot-date shape: ISO datetime or "YYYY-MM-DD". */
export function extractSlotDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : String(value);
  const match = str.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Extract "HH:MM" (24h) from any slot-time shape: ISO datetime, "HH:MM:SS", or "HH:MM". */
export function extractSlotTime(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : String(value);
  const match = str.match(/(?:T|^)(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

/**
 * Format a slot date for display, e.g. "Wednesday, August 13, 2026".
 * Parses the YYYY-MM-DD digits directly — no Date object, no timezone shift.
 */
export function formatSlotDate(value: string | Date | null | undefined): string {
  const ymd = extractSlotDate(value);
  if (!ymd) return value ? String(value) : '';
  const [yearStr, monthStr, dayStr] = ymd.split('-') as [string, string, string];
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = DAYS[dateObj.getUTCDay()];
  return `${dayOfWeek}, ${MONTHS[month]} ${String(day).padStart(2, '0')}, ${year}`;
}

/** Format a slot time for display as 12-hour wall-clock, e.g. "09:00 AM". */
export function formatSlotTime(value: string | Date | null | undefined): string {
  const hhmm = extractSlotTime(value);
  if (!hhmm) return value ? String(value) : '';
  const [hourStr, minute] = hhmm.split(':') as [string, string];
  const hour = Number(hourStr);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minute} ${suffix}`;
}
