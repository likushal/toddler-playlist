import { CalendarEventKey, WeekContext } from '@/types';
import { THEME_MAP } from '@/lib/theme-map';

interface Props {
  context: WeekContext;
}

const HOLIDAY_NAME_HE: Partial<Record<CalendarEventKey, string>> = {
  'rosh-hashana': 'ראש השנה',
  'yom-kippur': 'יום כיפור',
  sukkot: 'סוכות',
  'simchat-torah': 'שמחת תורה',
  hanukkah: 'חנוכה',
  'tu-bishvat': 'טו בשבט',
  purim: 'פורים',
  pesach: 'פסח',
  'yom-haatzmaut': 'יום העצמאות',
  'lag-baomer': 'לג בעומר',
  shavuot: 'שבועות',
};

export default function WeeklyHeader({ context }: Props) {
  const { theme, greetingHe, greetingTranslit, hebrewDateDisplay, upcomingEvent, daysUntilUpcoming } = context;

  return (
    <header className="flex flex-col items-center gap-4 py-10 px-4 text-center">
      {/* Bouncing main emoji */}
      <div
        className="animate-bounce select-none"
        style={{ fontSize: '100px', lineHeight: 1 }}
        aria-hidden="true"
      >
        {theme.headerEmoji}
      </div>

      {/* Hebrew greeting */}
      <h1 className="text-5xl font-bold leading-tight tracking-wide" lang="he">
        {greetingHe}
      </h1>

      {/* Transliteration */}
      <p className="text-lg text-gray-600 font-medium">{greetingTranslit}</p>

      {/* Hebrew date badge */}
      <span
        className={`inline-block rounded-full px-4 py-1 text-sm font-semibold text-white ${theme.primaryColor}`}
        lang="he"
      >
        {hebrewDateDisplay}
      </span>

      {/* Upcoming holiday teaser pill */}
      {upcomingEvent && daysUntilUpcoming !== undefined && HOLIDAY_NAME_HE[upcomingEvent] && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold bg-amber-100 text-amber-800 animate-pulse"
          lang="he"
          dir="rtl"
        >
          {THEME_MAP[upcomingEvent].theme.headerEmoji}{' '}
          {HOLIDAY_NAME_HE[upcomingEvent]} בעוד {daysUntilUpcoming} ימים
        </span>
      )}
    </header>
  );
}
