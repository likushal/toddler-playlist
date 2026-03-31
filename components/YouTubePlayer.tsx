'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
    _ytApiReady?: boolean;
    _ytApiCallbacks?: (() => void)[];
  }
}

interface Props {
  videoId?: string;   // pre-populated ID (preferred)
  songTitle: string;  // used as search query if no videoId
  onEnded: () => void;
}

// Returns a list of candidate video IDs to try in order
async function resolveVideoIds(videoId: string | undefined, songTitle: string): Promise<string[]> {
  if (videoId) return [videoId];
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
  const playerRef    = useRef<any>(null);
  const onEndedRef   = useRef(onEnded);
  onEndedRef.current = onEnded;

  // ── Load YouTube IFrame API once, globally ──────────────────────────────
  useEffect(() => {
    if (window._ytApiReady) return;
    window._ytApiCallbacks = window._ytApiCallbacks ?? [];
    if (!document.getElementById('youtube-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        window._ytApiReady = true;
        prev?.();
        window._ytApiCallbacks!.forEach(cb => cb());
        window._ytApiCallbacks = [];
      };
      const s = document.createElement('script');
      s.id    = 'youtube-iframe-api';
      s.src   = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // ── Create player on mount ───────────────────────────────────────────────
  useEffect(() => {
    let gone = false;

    async function createPlayer() {
      if (gone || !containerRef.current) return;
      const candidates = await resolveVideoIds(videoId, songTitle);
      if (gone || !containerRef.current || candidates.length === 0) return;

      const target = document.createElement('div');
      containerRef.current.appendChild(target);

      let candidateIdx = 0;

      playerRef.current = new window.YT.Player(target, {
        height: '152',
        width:  '100%',
        videoId: candidates[0],
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEndedRef.current();
          },
          onError: (e: any) => {
            // 101 / 150 = embedding disabled; try next candidate
            if ((e.data === 101 || e.data === 150) && candidateIdx < candidates.length - 1) {
              candidateIdx++;
              playerRef.current?.loadVideoById(candidates[candidateIdx]);
            }
          },
        },
      });
    }

    if (window._ytApiReady) {
      createPlayer();
    } else {
      window._ytApiCallbacks = window._ytApiCallbacks ?? [];
      window._ytApiCallbacks.push(createPlayer);
    }

    return () => { gone = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When song changes, load new video without remounting ────────────────
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const p = playerRef.current;
    if (!p) return;
    resolveVideoIds(videoId, songTitle).then(ids => {
      if (ids.length > 0) p.loadVideoById(ids[0]);
    });
  }, [videoId, songTitle]);

  // ── Destroy on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full" style={{ minHeight: 152 }} />;
}
