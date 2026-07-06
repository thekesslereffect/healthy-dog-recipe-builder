import { describe, expect, it } from 'vitest';
import { computeStreak, localDateKey, mealsLogged, type FeedingLog } from './feedingLog';

const day = (offset: number, from: Date): string => {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return localDateKey(d);
};

describe('localDateKey', () => {
  it('formats as YYYY-MM-DD in local time', () => {
    expect(localDateKey(new Date(2026, 6, 5))).toBe('2026-07-05');
    expect(localDateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});

describe('mealsLogged', () => {
  it('returns the meal count for a day', () => {
    const log: FeedingLog = { '2026-07-05': 2 };
    expect(mealsLogged(log, '2026-07-05')).toBe(2);
    expect(mealsLogged(log, '2026-07-04')).toBe(0);
  });

  it('treats legacy boolean entries as one meal', () => {
    const log = { '2026-07-05': true } as unknown as FeedingLog;
    expect(mealsLogged(log, '2026-07-05')).toBe(1);
  });
});

describe('computeStreak', () => {
  const today = new Date(2026, 6, 5);

  it('returns 0 for an empty log', () => {
    expect(computeStreak({}, today)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const log: FeedingLog = {
      [day(0, today)]: 1,
      [day(-1, today)]: 2,
      [day(-2, today)]: 2,
    };
    expect(computeStreak(log, today)).toBe(3);
  });

  it('keeps the streak alive when today is not logged yet', () => {
    const log: FeedingLog = {
      [day(-1, today)]: 2,
      [day(-2, today)]: 1,
    };
    expect(computeStreak(log, today)).toBe(2);
  });

  it('resets when a day was missed before yesterday', () => {
    const log: FeedingLog = {
      [day(-2, today)]: 2,
      [day(-3, today)]: 2,
    };
    expect(computeStreak(log, today)).toBe(0);
  });

  it('stops counting at a gap', () => {
    const log: FeedingLog = {
      [day(0, today)]: 1,
      [day(-1, today)]: 1,
      [day(-3, today)]: 1,
    };
    expect(computeStreak(log, today)).toBe(2);
  });

  it('ignores days with a zero count', () => {
    const log: FeedingLog = {
      [day(0, today)]: 1,
      [day(-1, today)]: 0,
      [day(-2, today)]: 2,
    };
    expect(computeStreak(log, today)).toBe(1);
  });

  it('counts a streak across a month boundary', () => {
    const firstOfMonth = new Date(2026, 6, 1);
    const log: FeedingLog = {
      [day(0, firstOfMonth)]: 2,
      [day(-1, firstOfMonth)]: 2,
      [day(-2, firstOfMonth)]: 1,
    };
    expect(computeStreak(log, firstOfMonth)).toBe(3);
  });
});
