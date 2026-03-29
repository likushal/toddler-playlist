'use client';

import { useEffect, useRef } from 'react';
import { getEmbedUrl } from '@/lib/spotify';

interface Props {
  trackId: string;
  isOpen: boolean;
}

export default function SpotifyPlayer({ trackId, isOpen }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen && iframeRef.current) {
      // Reset src to stop playback when collapsed
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      iframeRef.current.src = src;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden shadow-inner">
      <iframe
        ref={iframeRef}
        src={getEmbedUrl(trackId)}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block"
        title="Spotify music player"
      />
    </div>
  );
}
