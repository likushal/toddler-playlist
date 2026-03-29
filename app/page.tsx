import { getCurrentWeekContext } from '@/lib/calendar';
import { getPlaylist } from '@/lib/get-playlist';
import { ALL_SONGS } from '@/lib/playlist-data';
import WeeklyHeader from '@/components/WeeklyHeader';
import HolidayBadge from '@/components/HolidayBadge';
import PlaylistClientWrapper from '@/components/PlaylistClientWrapper';
import AnimatedBackground from '@/components/AnimatedBackground';

export const revalidate = 86400; // ISR: revalidate daily

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function Home() {
  const context = getCurrentWeekContext();
  const songs = getPlaylist(context);
  const weekKey = getDayKey(new Date());

  return (
    <main className="relative min-h-screen">
      {/* Animated background particles */}
      <AnimatedBackground bgClass={context.theme.backgroundClass} />

      {/* Page content */}
      <div className="relative z-10">
        <WeeklyHeader context={context} />

        <div className="mb-6">
          <HolidayBadge
            event={context.primaryEvent}
            theme={context.theme}
            greetingHe={context.greetingHe}
          />
        </div>

        <PlaylistClientWrapper
          defaultSongs={songs}
          allSongs={ALL_SONGS}
          theme={context.theme}
          weekKey={weekKey}
          primaryEvent={context.primaryEvent}
        />
      </div>
    </main>
  );
}
