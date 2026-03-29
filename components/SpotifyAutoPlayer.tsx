'use client';

import { useEffect, useRef } from 'react';

// ── Spotify IFrame API types ─────────────────────────────────────────────────
interface EmbedController {
  play(): void;
  loadUri(uri: string): void;
  destroy(): void;
  addListener(
    event: string,
    cb: (e: { data: { isPaused: boolean; position: number; duration: number } }) => void
  ): void;
}
interface IFrameAPI {
  createController(el: HTMLElement, opts: { uri: string }, cb: (c: EmbedController) => void): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    SpotifyIframeApi?: IFrameAPI;
  }
}

interface Props {
  trackId: string;
  onEnded: () => void;
}

export default function SpotifyAutoPlayer({ trackId, onEnded }: Props) {
  // containerRef is the React-owned div — Spotify must NEVER replace this element.
  // We create a non-React child `target` div for Spotify to replace/inject into.
  const containerRef = useRef<HTMLDivElement>(null);
  const ctrlRef     = useRef<EmbedController | null>(null);
  const trackIdRef  = useRef(trackId);
  const onEndedRef  = useRef(onEnded);
  trackIdRef.current = trackId;
  onEndedRef.current = onEnded;

  // ── Create controller once on mount ─────────────────────────────────────
  useEffect(() => {
    let gone = false;

    // A plain div (not in React's virtual DOM) that Spotify may freely replace.
    const target = document.createElement('div');
    containerRef.current?.appendChild(target);

    function boot(api: IFrameAPI) {
      if (gone) return;
      api.createController(target, { uri: `spotify:track:${trackIdRef.current}` }, (ctrl) => {
        if (gone) { ctrl.destroy(); return; }
        ctrlRef.current = ctrl;
        ctrl.play(); // auto-start as soon as the player is ready

        let wasPlaying = false;
        let lastPos = 0;
        ctrl.addListener('playback_update', ({ data }) => {
          const { isPaused, position, duration } = data;
          if (!isPaused) {
            wasPlaying = true;
            lastPos = position;
            return;
          }
          // Only fire if we were actually playing (ignore the initial isPaused:true on load)
          if (!wasPlaying || duration <= 0) return;
          const lastFrac = lastPos / duration;
          const curFrac  = position / duration;
          // Natural end: last playing position was ≥85% through,
          // OR position reset to near-start after being well into the song
          if (lastFrac >= 0.85 || (lastFrac > 0.3 && curFrac < 0.05)) {
            wasPlaying = false; // prevent double-fire
            onEndedRef.current();
          }
        });
      });
    }

    if (window.SpotifyIframeApi) {
      boot(window.SpotifyIframeApi);
    } else {
      const prev = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (api) => {
        window.SpotifyIframeApi = api;
        prev?.(api);
        boot(api);
      };
      if (!document.getElementById('spotify-iframe-api')) {
        const s = document.createElement('script');
        s.id    = 'spotify-iframe-api';
        s.src   = 'https://open.spotify.com/embed/iframe-api/v1';
        s.async = true;
        document.head.appendChild(s);
      }
    }

    return () => {
      gone = true;
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
      // target may have been replaced by Spotify — remove only if still attached
      target.parentNode?.removeChild(target);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load next track when trackId changes ────────────────────────────────
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.loadUri(`spotify:track:${trackId}`);
    const t = setTimeout(() => ctrlRef.current?.play(), 300);
    return () => clearTimeout(t);
  }, [trackId]);

  // containerRef stays in React's tree — Spotify never touches this element itself.
  return <div ref={containerRef} className="w-full" style={{ minHeight: 152 }} />;
}
