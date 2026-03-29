export type CalendarEventKey =
  | 'shabbat'
  | 'rosh-hashana'
  | 'yom-kippur'
  | 'sukkot'
  | 'simchat-torah'
  | 'hanukkah'
  | 'tu-bishvat'
  | 'purim'
  | 'pesach'
  | 'yom-haatzmaut'
  | 'lag-baomer'
  | 'shavuot'
  | 'season-summer'
  | 'season-winter'
  | 'season-spring'
  | 'season-autumn'
  | 'general';

export interface Song {
  id: string;
  titleHe: string;
  titleTranslit: string;
  spotifyTrackId: string;
  youtubeMusicId?: string;
  appleMusicId?: string;
  tags: CalendarEventKey[];
  emoji: string;
}

export interface WeekContext {
  primaryEvent: CalendarEventKey;
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  isShabbat: boolean;
  hebrewDateDisplay: string;
  greetingHe: string;
  greetingTranslit: string;
  theme: ThemeConfig;
  upcomingEvent?: CalendarEventKey;
  daysUntilUpcoming?: number;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  headerEmoji: string;
  backgroundClass: string;
}
