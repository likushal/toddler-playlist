import { CalendarEventKey, ThemeConfig } from '@/types';

interface Props {
  event: CalendarEventKey;
  theme: ThemeConfig;
  greetingHe: string;
}

const EVENT_LABELS: Record<CalendarEventKey, string> = {
  hanukkah: 'חנוכה',
  purim: 'פורים',
  pesach: 'פסח',
  shabbat: 'שבת',
  'rosh-hashana': 'ראש השנה',
  'yom-kippur': 'יום כיפור',
  sukkot: 'סוכות',
  'simchat-torah': 'שמחת תורה',
  'tu-bishvat': 'ט״ו בשבט',
  'yom-haatzmaut': 'יום העצמאות',
  'lag-baomer': 'לג בעומר',
  shavuot: 'שבועות',
  'season-summer': 'קיץ',
  'season-winter': 'חורף',
  'season-spring': 'אביב',
  'season-autumn': 'סתיו',
  general: 'שירי ילדים',
};

export default function HolidayBadge({ event, theme }: Props) {
  return (
    <div className="flex justify-center">
      <span
        className={`inline-block rounded-full px-6 py-2 text-base font-bold text-white shadow-md ${theme.primaryColor}`}
        lang="he"
      >
        {EVENT_LABELS[event]}
      </span>
    </div>
  );
}
