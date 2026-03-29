import { CalendarEventKey, Song, WeekContext } from '@/types';
import { ALL_SONGS } from './playlist-data';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDayNumber(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function getPlaylist(context: WeekContext): Song[] {
  const { primaryEvent, upcomingEvent, season, isShabbat } = context;
  const seasonTag = `season-${season}` as CalendarEventKey;
  const dayNum = getDayNumber();
  const used = new Set<string>();

  function take(pool: Song[], seed: number): Song[] {
    const chosen = seededShuffle(pool.filter(s => !used.has(s.id)), seed);
    chosen.forEach(s => used.add(s.id));
    return chosen;
  }

  const allByTag = (tag: CalendarEventKey) => ALL_SONGS.filter(s => s.tags.includes(tag));

  // 1. Primary event songs (all matching)
  const primarySongs = take(allByTag(primaryEvent), dayNum);

  // 2. Current season (all matching) — skip if primaryEvent IS the season
  const seasonSongs = primaryEvent === seasonTag
    ? []
    : take(allByTag(seasonTag), dayNum + 10);

  // 3. Shabbat songs on Friday/Saturday — skip if already primary
  const shabbatSongs = isShabbat && primaryEvent !== 'shabbat'
    ? take(allByTag('shabbat'), dayNum + 20)
    : [];

  // 4. Upcoming holiday in next 14 days (all matching)
  const upcomingSongs = upcomingEvent && upcomingEvent !== primaryEvent
    ? take(allByTag(upcomingEvent), dayNum + 42)
    : [];

  // 5. Always add a few general songs for variety
  const fillSongs = take(allByTag('general'), dayNum + 1).slice(0, 3);

  return [
    ...primarySongs,
    ...seasonSongs,
    ...shabbatSongs,
    ...upcomingSongs,
    ...fillSongs,
  ];
}
