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

    function createPlayer() {
      if (gone || !containerRef.current) return;
      const target = document.createElement('div');
      containerRef.current.appendChild(target);

      const opts: any = {
        height: '152',
        width:  '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => {
            // Use specific videoId if available, otherwise search by title
            if (videoId) {
              e.target.loadVideoById(videoId);
            } else {
              e.target.loadVideoByQuery(`${songTitle} שיר ילדים`);
            }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEndedRef.current();
          },
        },
      };

      // Seed with videoId or a blank placeholder so the player initialises
      if (videoId) opts.videoId = videoId;

      playerRef.current = new window.YT.Player(target, opts);
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
    if (videoId) {
      p.loadVideoById(videoId);
    } else {
      p.loadVideoByQuery(`${songTitle} שיר ילדים`);
    }
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
