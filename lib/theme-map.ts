import { CalendarEventKey, ThemeConfig } from '@/types';

interface ThemeEntry {
  theme: ThemeConfig;
  greetingHe: string;
  greetingTranslit: string;
}

export const THEME_MAP: Record<CalendarEventKey, ThemeEntry> = {
  hanukkah: {
    theme: {
      primaryColor: 'bg-blue-600',
      accentColor: 'bg-yellow-400',
      headerEmoji: '🕎',
      backgroundClass: 'bg-dreidels',
    },
    greetingHe: 'חנוכה שמח!',
    greetingTranslit: 'Hanukkah Sameach!',
  },
  purim: {
    theme: {
      primaryColor: 'bg-purple-500',
      accentColor: 'bg-pink-400',
      headerEmoji: '🎭',
      backgroundClass: 'bg-confetti',
    },
    greetingHe: 'פורים שמח!',
    greetingTranslit: 'Purim Sameach!',
  },
  pesach: {
    theme: {
      primaryColor: 'bg-sky-500',
      accentColor: 'bg-amber-300',
      headerEmoji: '🫓',
      backgroundClass: 'bg-matzah',
    },
    greetingHe: 'חג פסח שמח!',
    greetingTranslit: 'Chag Pesach Sameach!',
  },
  shabbat: {
    theme: {
      primaryColor: 'bg-purple-600',
      accentColor: 'bg-yellow-300',
      headerEmoji: '✨',
      backgroundClass: 'bg-stars',
    },
    greetingHe: 'שבת שלום!',
    greetingTranslit: 'Shabbat Shalom!',
  },
  'rosh-hashana': {
    theme: {
      primaryColor: 'bg-amber-600',
      accentColor: 'bg-red-400',
      headerEmoji: '🍎',
      backgroundClass: 'bg-apples',
    },
    greetingHe: 'שנה טובה!',
    greetingTranslit: 'Shana Tova!',
  },
  'yom-kippur': {
    theme: {
      primaryColor: 'bg-white',
      accentColor: 'bg-gray-300',
      headerEmoji: '🕯️',
      backgroundClass: 'bg-candles',
    },
    greetingHe: 'גמר חתימה טובה',
    greetingTranslit: 'Gmar Chatima Tova',
  },
  sukkot: {
    theme: {
      primaryColor: 'bg-green-600',
      accentColor: 'bg-yellow-400',
      headerEmoji: '🌿',
      backgroundClass: 'bg-leaves',
    },
    greetingHe: 'חג סוכות שמח!',
    greetingTranslit: 'Chag Sukkot Sameach!',
  },
  'simchat-torah': {
    theme: {
      primaryColor: 'bg-blue-500',
      accentColor: 'bg-orange-400',
      headerEmoji: '📜',
      backgroundClass: 'bg-confetti',
    },
    greetingHe: 'חג שמח!',
    greetingTranslit: 'Chag Sameach!',
  },
  'tu-bishvat': {
    theme: {
      primaryColor: 'bg-green-500',
      accentColor: 'bg-emerald-300',
      headerEmoji: '🌳',
      backgroundClass: 'bg-leaves',
    },
    greetingHe: 'חג טו בשבט שמח!',
    greetingTranslit: "Tu B'Shvat Sameach!",
  },
  'yom-haatzmaut': {
    theme: {
      primaryColor: 'bg-blue-700',
      accentColor: 'bg-sky-300',
      headerEmoji: '🇮🇱',
      backgroundClass: 'bg-fireworks',
    },
    greetingHe: 'יום העצמאות שמח!',
    greetingTranslit: "Yom Ha'atzmaut Sameach!",
  },
  'lag-baomer': {
    theme: {
      primaryColor: 'bg-orange-600',
      accentColor: 'bg-red-400',
      headerEmoji: '🔥',
      backgroundClass: 'bg-fire',
    },
    greetingHe: 'חג לג בעומר שמח!',
    greetingTranslit: "Lag Ba'Omer Sameach!",
  },
  shavuot: {
    theme: {
      primaryColor: 'bg-green-500',
      accentColor: 'bg-white',
      headerEmoji: '🌸',
      backgroundClass: 'bg-flowers',
    },
    greetingHe: 'חג שבועות שמח!',
    greetingTranslit: 'Chag Shavuot Sameach!',
  },
  'season-summer': {
    theme: {
      primaryColor: 'bg-yellow-500',
      accentColor: 'bg-orange-400',
      headerEmoji: '☀️',
      backgroundClass: 'bg-sun',
    },
    greetingHe: 'קיץ שמח!',
    greetingTranslit: 'Happy Summer!',
  },
  'season-winter': {
    theme: {
      primaryColor: 'bg-sky-500',
      accentColor: 'bg-blue-300',
      headerEmoji: '🌧️',
      backgroundClass: 'bg-rain',
    },
    greetingHe: 'חורף נעים!',
    greetingTranslit: 'Pleasant Winter!',
  },
  'season-spring': {
    theme: {
      primaryColor: 'bg-green-400',
      accentColor: 'bg-pink-300',
      headerEmoji: '🌷',
      backgroundClass: 'bg-flowers',
    },
    greetingHe: 'אביב שמח!',
    greetingTranslit: 'Happy Spring!',
  },
  'season-autumn': {
    theme: {
      primaryColor: 'bg-orange-500',
      accentColor: 'bg-amber-300',
      headerEmoji: '🍂',
      backgroundClass: 'bg-leaves',
    },
    greetingHe: 'סתיו נעים!',
    greetingTranslit: 'Pleasant Autumn!',
  },
  general: {
    theme: {
      primaryColor: 'bg-teal-500',
      accentColor: 'bg-yellow-300',
      headerEmoji: '🎵',
      backgroundClass: 'bg-music',
    },
    greetingHe: 'שלום וברכה!',
    greetingTranslit: 'Shalom U\'vracha!',
  },
};
