
// All-time rows use a fixed epoch so the unique key never contains NULL.
export const ALL_TIME_START = new Date(0);

// Start of the current week, Monday 00:00 UTC.
export function currentWeekStart(now: Date = new Date()): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}