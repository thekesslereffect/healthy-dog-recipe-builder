/** Meals logged as fed per local date (YYYY-MM-DD -> count). */
export type FeedingLog = Record<string, number>;

export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Meals logged on a given day (tolerates legacy boolean entries). */
export function mealsLogged(log: FeedingLog, key: string): number {
  const value = log[key] as number | boolean | undefined;
  if (typeof value === 'number') return value;
  return value ? 1 : 0;
}

/**
 * Consecutive days with at least one logged meal, ending today. If today has
 * no log yet, the streak counts back from yesterday so it doesn't read as
 * broken before the user has had a chance to log.
 */
export function computeStreak(log: FeedingLog, today: Date = new Date()): number {
  const cursor = new Date(today);
  if (mealsLogged(log, localDateKey(cursor)) === 0) {
    cursor.setDate(cursor.getDate() - 1);
    if (mealsLogged(log, localDateKey(cursor)) === 0) return 0;
  }
  let streak = 0;
  while (mealsLogged(log, localDateKey(cursor)) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
