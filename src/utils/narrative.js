// Pure helpers for time-narrative features. No I/O, no async.

import { formatYear } from './formatYear.js';

export const TIMELINE_MARKERS = [
  { year: -2000, label: '青铜文明萌发' },
  { year: -1200, label: '青铜晚期崩溃 / 商殷盛期' },
  { year: -500, label: '轴心时代' },
  { year: -221, label: '秦统一中国' },
  { year: 0, label: '公元元年 / 罗马帝国' },
  { year: 476, label: '西罗马灭亡' },
  { year: 632, label: '伊斯兰兴起' },
  { year: 1000, label: '中世纪盛期' },
  { year: 1492, label: '哥伦布抵达美洲' },
  { year: 1644, label: '清军入关' },
  { year: 1789, label: '法国大革命' },
  { year: 1914, label: '一战爆发' },
  { year: 1945, label: '二战结束' },
  { year: 2025, label: '当代' },
];

/** Find the era containing a given year. */
export function findEra(eras, year) {
  // Match by inclusive start, exclusive end (except for last era).
  for (let i = 0; i < eras.length; i++) {
    const era = eras[i];
    const isLast = i === eras.length - 1;
    if (year >= era.startYear && (isLast ? year <= era.endYear : year < era.endYear)) {
      return era;
    }
  }
  return eras[eras.length - 1];
}

/**
 * Collect events from active dynasties within ±window years of the current year.
 * Returns at most `limit` items, sorted by absolute distance to year.
 */
export function findNearbyEvents(dynasties, year, { window = 30, limit = 5 } = {}) {
  const hits = [];
  for (const dynasty of dynasties) {
    if (!Array.isArray(dynasty.events)) continue;
    for (const event of dynasty.events) {
      const distance = Math.abs(event.year - year);
      if (distance > window) continue;
      hits.push({
        key: `${dynasty.id}-${event.year}-${event.title}`,
        year: event.year,
        title: event.title,
        dynastyId: dynasty.id,
        dynastyName: dynasty.name,
        color: dynasty.color,
        distance,
      });
    }
  }
  hits.sort((a, b) => a.distance - b.distance || a.year - b.year);
  return hits.slice(0, limit);
}

/**
 * For each currently-active dynasty, attach a lifecycle hint when its start or
 * end is within `window` years of the current year.
 *   { phase: 'rising' | 'falling' | null, hint: string | null }
 */
export function annotateLifecycle(dynasties, year, { window = 30 } = {}) {
  return dynasties.map((dynasty) => {
    if (year < dynasty.startYear || year > dynasty.endYear) {
      return { dynasty, phase: null, hint: null };
    }
    const sinceStart = year - dynasty.startYear;
    const untilEnd = dynasty.endYear - year;
    if (sinceStart <= window && sinceStart <= untilEnd) {
      return { dynasty, phase: 'rising', hint: `即将兴起 · ${formatYear(dynasty.startYear)}` };
    }
    if (untilEnd <= window) {
      return { dynasty, phase: 'falling', hint: `正在衰落 · ${formatYear(dynasty.endYear)}` };
    }
    return { dynasty, phase: null, hint: null };
  });
}
