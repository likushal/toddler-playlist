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

export default function YouTubePlayer({ videoId, songTitle, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<any>(null);
  const onEndedRef   = useRef(onEnded);
  const [resolvedId, setResolvedId] = useState<string | undefined>(videoId);
  const [searching,  setSearching]  = useState(false);

  onEndedRef.current = onEnded;

  // ── Resolve video ID: use prop or search YouTube ────────────────────────
  useEffect(() => {
    if (videoId) { setResolvedId(videoId); return; }
    let gone = false;
    setSearching(true);
    fetch(`/api/youtube-search?q=${encodeURIComponent(songTitle + ' שיר ילדים')}`)
      .then(r => r.json())
      .then(d => { if (!gone && d.videoId) setResolvedId(d.videoId); })
      .catch(() => {})
      .finally(() => { if (!gone) setSearching(false); });
    return () => { gone = true; };
  }, [videoId, songTitle]);

  // ── Load YouTube IFrame API once ────────────────────────────────────────
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

  // ── Create or update player when resolvedId changes ─────────────────────
  useEffect(() => {
    if (!resolvedId) return;

    // Player already exists — just load new video
    if (playerRef.current) {
      playerRef.current.loadVideoById(resolvedId);
      return;
    }

    let gone = false;
    const vid = resolvedId;

    function createPlayer() {
      if (gone || !containerRef.current) return;
      const target = document.createElement('div');
      containerRef.current.appendChild(target);
      playerRef.current = new window.YT.Player(target, {
        videoId: vid,
        height: '152',
        width:  '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady:       (e: any) => e.target.playVideo(),
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEndedRef.current();
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
  }, [resolvedId]);

  // ── Destroy player on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, []);

  if (searching) return (
    <div className="w-full flex items-center justify-center bg-gray-50" style={{ minHeight: 152 }}>
      <span className="text-gray-400 text-sm">מחפש ב-YouTube...</span>
    </div>
  );

  if (!resolvedId) return (
    <div className="w-full flex items-center justify-center bg-gray-50" style={{ minHeight: 152 }}>
      <span className="text-gray-400 text-sm" dir="rtl">⚠️ השיר לא נמצא ב-YouTube</span>
    </div>
  );

  return <div ref={containerRef} className="w-full" style={{ minHeight: 152 }} />;
}
