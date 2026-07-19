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

/** Extract "HH:MM" (24h) from any slot-time shape: ISO datetime, "HH:MM:SS", or "HH:MM". */
export function extractSlotTime(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : String(value);
  const match = str.match(/(?:T|^)(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
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
