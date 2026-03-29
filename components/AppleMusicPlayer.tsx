'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    MusicKit: any;
  }
}

interface Props {
  songId?: string;
  onEnded: () => void;
}

type Status = 'loading' | 'needs-auth' | 'authing' | 'playing' | 'error' | 'unavailable';

export default function AppleMusicPlayer({ songId, onEnded }: Props) {
  const [status,   setStatus]   = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const musicRef   = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // ── Initialize MusicKit ─────────────────────────────────────────────────
  useEffect(() => {
    if (!songId) { setStatus('unavailable'); return; }
    let gone = false;

    async function init() {
      // 1. Fetch developer token from our server
      const res = await fetch('/api/apple-token');
      if (!res.ok) throw new Error('הגדרת Apple Music נכשלה');
      const { token } = await res.json();

      // 2. Load MusicKit JS if not already loaded
      if (!window.MusicKit) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src     = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
          s.onload  = () => resolve();
          s.onerror = () => reject(new Error('טעינת MusicKit נכשלה'));
          document.head.appendChild(s);
        });
      }

      // 3. Configure
      const music = await window.MusicKit.configure({
        developerToken: token,
        app: { name: 'שירי ילדים', build: '1.0' },
      });
      if (gone) return;
      musicRef.current = music;

      // Listen for playback end
      music.addEventListener('playbackStateDidChange', () => {
        if (music.playbackState === window.MusicKit.PlaybackStates.ended) {
          onEndedRef.current();
        }
      });

      // Restore saved user token
      const saved = localStorage.getItem('apple-music-user-token');
      if (saved) {
        try { music.musicUserToken = saved; } catch { /* ignore */ }
      }

      setStatus(music.isAuthorized ? 'needs-auth' : 'needs-auth');
      // Check authorization properly
      if (music.isAuthorized) {
        setStatus('playing');
      } else {
        setStatus('needs-auth');
      }
    }

    init().catch(e => {
      if (!gone) { setStatus('error'); setErrorMsg(e.message); }
    });

    return () => { gone = true; };
  }, [songId]);

  // ── Play when authorized ────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'playing' || !songId || !musicRef.current) return;
    musicRef.current.setQueue({ song: songId })
      .then(() => musicRef.current.play())
      .catch(() => { setStatus('error'); setErrorMsg('ניגון נכשל'); });
  }, [status, songId]);

  async function handleAuth() {
    if (!musicRef.current) return;
    setStatus('authing');
    try {
      await musicRef.current.authorize();
      localStorage.setItem('apple-music-user-token', musicRef.current.musicUserToken);
      setStatus('playing');
    } catch {
      setStatus('needs-auth');
    }
  }

  if (status === 'unavailable') return (
    <div className="w-full flex items-center justify-center bg-gray-50" style={{ minHeight: 152 }}>
      <span className="text-gray-400 text-sm" dir="rtl">⚠️ השיר לא זמין ב-Apple Music</span>
    </div>
  );

  if (status === 'loading') return (
    <div className="w-full flex items-center justify-center bg-gray-50" style={{ minHeight: 152 }}>
      <span className="text-gray-400 text-sm">טוען Apple Music...</span>
    </div>
  );

  if (status === 'error') return (
    <div className="w-full flex items-center justify-center bg-red-50" style={{ minHeight: 152 }}>
      <span className="text-red-400 text-sm" dir="rtl">⚠️ {errorMsg || 'שגיאה ב-Apple Music'}</span>
    </div>
  );

  if (status === 'needs-auth' || status === 'authing') return (
    <div className="w-full flex flex-col items-center justify-center gap-3 bg-gray-50" style={{ minHeight: 152 }}>
      <p className="text-gray-600 text-sm" dir="rtl">נדרש חיבור ל-Apple Music</p>
      <button
        onClick={handleAuth}
        disabled={status === 'authing'}
        className="flex items-center gap-2 rounded-full px-5 py-2.5 bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {status === 'authing' ? 'מתחבר...' : '🍎 התחבר ל-Apple Music'}
      </button>
    </div>
  );

  // status === 'playing'
  return (
    <div className="w-full flex items-center justify-center bg-gray-50" style={{ minHeight: 80 }}>
      <div className="flex items-center gap-2 text-gray-500 text-sm" dir="rtl">
        <span className="text-lg">🍎</span>
        <span>מנגן דרך Apple Music</span>
      </div>
    </div>
  );
}
