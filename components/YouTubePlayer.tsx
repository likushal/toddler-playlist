'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
    _ytApiReady?: boolean;
    _ytApiCallbacks?: (() => void)[];
  }
}

interface Props {
  videoId?: string;
  songTitle: string;
  onEnded: () => void;
}

function loadYTApi(): Promise<void> {
  if (window._ytApiReady) return Promise.resolve();
  return new Promise(resolve => {
    window._ytApiCallbacks = window._ytApiCallbacks ?? [];
    window._ytApiCallbacks.push(resolve);
    if (!document.getElementById('youtube-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        window._ytApiReady = true;
        prev?.();
        window._ytApiCallbacks!.forEach(cb => cb());
        window._ytApiCallbacks = [];
      };
      const s = document.createElement('script');
      s.id = 'youtube-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

async function searchVideoIds(songTitle: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(songTitle + ' שיר ילדים')}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.videoIds ?? (data.videoId ? [data.videoId] : []);
  } catch {
    return [];
  }
}

export default function YouTubePlayer({ videoId, songTitle, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [error, setError] = useState(false);

  useEffect(() => {
    let gone = false;

    async function init() {
      // 1. Resolve video candidates
      const candidates = videoId
        ? [videoId]
        : await searchVideoIds(songTitle);

      if (gone || !candidates.length || !containerRef.current) return;

      // 2. Wait for YT IFrame API
      await loadYTApi();

      if (gone || !containerRef.current) return;

      // 3. Create player with first candidate
      let candidateIdx = 0;
      const target = document.createElement('div');
      containerRef.current.appendChild(target);

      playerRef.current = new window.YT.Player(target, {
        height: '152',
        width: '100%',
        videoId: candidates[candidateIdx],
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEndedRef.current();
          },
          onError: () => {
            if (candidateIdx < candidates.length - 1) {
              candidateIdx++;
              playerRef.current?.loadVideoById(candidates[candidateIdx]);
            } else {
              setError(true);
            }
          },
        },
      });
    }

    init();

    return () => {
      gone = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="w-full flex items-center justify-center text-sm text-gray-400 py-4" style={{ minHeight: 152 }}>
        לא נמצא סרטון זמין
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" style={{ minHeight: 152 }} />;
}
