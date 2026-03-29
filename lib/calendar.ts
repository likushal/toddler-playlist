import { HDate, HebrewCalendar, gematriya } from '@hebcal/core';
import { toZonedTime } from 'date-fns-tz';
import { CalendarEventKey, WeekContext } from '@/types';
import { THEME_MAP } from './theme-map';

const ISRAEL_TZ = 'Asia/Jerusalem';

// Day-of-week greetings (0=Sun … 6=Sat) used when no holiday is active
const DAY_GREETINGS: { he: string; translit: string }[] = [
  { he: 'שבוע טוב!',        translit: 'Shavua Tov!' },        // Sun
  { he: 'יום שני שמח!',     translit: 'Happy Monday!' },      // Mon
  { he: 'יום שלישי שמח!',   translit: 'Happy Tuesday!' },     // Tue
  { he: 'יום רביעי שמח!',   translit: 'Happy Wednesday!' },   // Wed
  { he: 'יום חמישי שמח!',   translit: 'Happy Thursday!' },    // Thu
  { he: 'שבת שלום!',        translit: 'Shabbat Shalom!' },    // Fri
  { he: 'שבת שלום!',        translit: 'Shabbat Shalom!' },    // Sat
];

// Priority order: higher index = higher priority
const EVENT_PRIORITY: CalendarEventKey[] = [
  'general',
  'season-summer',
  'season-winter',
  'season-spring',
  'season-autumn',
  'shabbat',
  'tu-bishvat',
  'lag-baomer',
  'shavuot',
  'sukkot',
  'simchat-torah',
  'yom-haatzmaut',
  'hanukkah',
  'purim',
  'pesach',
  'rosh-hashana',
  'yom-kippur',
];

function getPriority(event: CalendarEventKey): number {
  return EVENT_PRIORITY.indexOf(event);
}

function detectSeasonFromHMonth(month: number): CalendarEventKey {
  // Hebrew months: Tishrei(7)=autumn, Cheshvan(8)=autumn, Kislev(9)=winter,
  // Tevet(10)=winter, Shevat(11)=winter, Adar(12)=spring,
  // Nisan(1)=spring, Iyar(2)=spring, Sivan(3)=summer,
  // Tammuz(4)=summer, Av(5)=summer, Elul(6)=autumn
  if ([9, 10, 11].includes(month)) return 'season-winter';
  if ([12, 1, 2].includes(month)) return 'season-spring';
  if ([3, 4, 5].includes(month)) return 'season-summer';
  return 'season-autumn'; // 6, 7, 8
}

function mapEventDescription(desc: string): CalendarEventKey | null {
  const d = desc.toLowerCase();
  if (d.startsWith('hanukkah') || d.includes('chanukah')) return 'hanukkah';
  if (d.startsWith('purim') || d.includes('purim')) return 'purim';
  if (d.startsWith('pesach') || d.includes('passover')) return 'pesach';
  if (d.startsWith('rosh hashana') || d.includes('rosh hashana')) return 'rosh-hashana';
  if (d.includes('yom kippur')) return 'yom-kippur';
  if (d.startsWith('sukkot') || d.includes('sukkot')) return 'sukkot';
  if (d.includes('simchat torah') || d.includes('shemini atzeret')) return 'simchat-torah';
  if (d.includes("tu b'shvat") || d.includes('tu bishvat')) return 'tu-bishvat';
  if (d.includes("yom ha'atzmaut") || d.includes('yom haatzmaut')) return 'yom-haatzmaut';
  if (d.includes("lag b'omer") || d.includes('lag baomer')) return 'lag-baomer';
  if (d.startsWith('shavuot')) return 'shavuot';
  return null;
}

function formatHebrewDate(hdate: HDate): string {
  const hebrewMonths: Record<number, string> = {
    1: 'ניסן', 2: 'אייר', 3: 'סיון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
    7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט', 12: 'אדר', 13: 'אדר ב׳',
  };
  const day = hdate.getDate();
  const month = hdate.getMonth();
  const year = hdate.getFullYear();

  const dayHe = gematriya(day);
  // Abbreviated year: strip thousands (5000s)
  const yearHe = gematriya(year % 1000);
  const monthName = hebrewMonths[month] || '';

  return `${dayHe} ${monthName} ${yearHe}`;
}

export function getCurrentWeekContext(): WeekContext {
  const now = toZonedTime(new Date(), ISRAEL_TZ);
  const today = new HDate(now);

  // Scan 7-day window
  let primaryEvent: CalendarEventKey = 'general';

  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 6);

  const events = HebrewCalendar.calendar({
    start: startDate,
    end: endDate,
    il: true,
    candlelighting: false,
    sedrot: false,
    omer: false,
  });

  for (const ev of events) {
    const desc = ev.getDesc();
    const mapped = mapEventDescription(desc);
    if (mapped && getPriority(mapped) > getPriority(primaryEvent)) {
      primaryEvent = mapped;
    }
  }

  // Check for Shabbat (Friday after noon or Saturday)
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const isShabbat =
    dayOfWeek === 6 ||
    (dayOfWeek === 5 && now.getHours() >= 12);

  if (isShabbat && getPriority('shabbat') > getPriority(primaryEvent)) {
    primaryEvent = 'shabbat';
  }

  // If still general, use season
  if (primaryEvent === 'general') {
    primaryEvent = detectSeasonFromHMonth(today.getMonth());
  }

  // Determine calendar season for WeekContext
  const hebrewMonth = today.getMonth();
  let season: WeekContext['season'] = 'spring';
  if ([9, 10, 11].includes(hebrewMonth)) season = 'winter';
  else if ([3, 4, 5].includes(hebrewMonth)) season = 'summer';
  else if ([6, 7, 8].includes(hebrewMonth)) season = 'autumn';

  // Scan days 1–14 for upcoming major holidays (full two-week window)
  const MAJOR_HOLIDAY_MIN_PRIORITY = getPriority('shavuot'); // index 8

  const upcomingStart = new Date(now);
  upcomingStart.setDate(upcomingStart.getDate() + 1);
  const upcomingEnd = new Date(now);
  upcomingEnd.setDate(upcomingEnd.getDate() + 14);

  const upcomingEvents = HebrewCalendar.calendar({
    start: upcomingStart,
    end: upcomingEnd,
    il: true,
    candlelighting: false,
    sedrot: false,
    omer: false,
  });

  let upcomingEvent: CalendarEventKey | undefined;
  let daysUntilUpcoming: number | undefined;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const ev of upcomingEvents) {
    const mapped = mapEventDescription(ev.getDesc());
    if (mapped && getPriority(mapped) >= MAJOR_HOLIDAY_MIN_PRIORITY) {
      if (!upcomingEvent || getPriority(mapped) > getPriority(upcomingEvent)) {
        upcomingEvent = mapped;
        const evDate = ev.getDate().greg();
        daysUntilUpcoming = Math.round((evDate.getTime() - now.getTime()) / MS_PER_DAY);
      }
    }
  }

  const themeEntry = THEME_MAP[primaryEvent];

  // Use day-of-week greeting when no holiday/shabbat is active
  const isSeasonOrGeneral = primaryEvent.startsWith('season-') || primaryEvent === 'general';
  const greetingHe = isSeasonOrGeneral ? DAY_GREETINGS[dayOfWeek].he : themeEntry.greetingHe;
  const greetingTranslit = isSeasonOrGeneral ? DAY_GREETINGS[dayOfWeek].translit : themeEntry.greetingTranslit;

  return {
    primaryEvent,
    season,
    isShabbat,
    hebrewDateDisplay: formatHebrewDate(today),
    greetingHe,
    greetingTranslit,
    theme: themeEntry.theme,
    upcomingEvent,
    daysUntilUpcoming,
  };
}
