'use client';

import { useState, useEffect, useRef } from 'react';
import { Song, ThemeConfig } from '@/types';
import PlaylistCard from './PlaylistCard';

interface Props {
  songs: Song[];
  theme: ThemeConfig;
  title?: string;
  playingIdx?: number | null;
  onPlaySong?: (index: number) => void;
  onRemoveSong?: (songId: string) => void;
  onEditSongUrl?: (songId: string, newTrackId: string) => void;
  onAddSong?: (song: Song) => void;
}

function extractTrackId(input: string): string {
  const urlMatch = input.match(/track\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  const uriMatch = input.match(/spotify:track:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  // Accept a raw track ID (10–30 alphanumeric chars, no slashes/dots)
  const raw = input.trim();
  if (/^[A-Za-z0-9]{10,30}$/.test(raw)) return raw;
  return '';
}

function AddSongCard({ onAdd }: { onAdd: (s: Song) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [fetching, setFetching] = useState(false);
  const lastFetchedId = useRef('');

  const trackId = extractTrackId(url.trim());

  // Auto-fetch track name via Spotify oEmbed (no credentials needed)
  useEffect(() => {
    if (!trackId || trackId === lastFetchedId.current) return;
    lastFetchedId.current = trackId;
    setFetching(true);
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`)
      .then(r => r.json())
      .then(data => { if (data.title) setName(data.title); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [trackId]);

  function submit() {
    if (!trackId) return;
    onAdd({
      id: `custom-${crypto.randomUUID()}`,
      titleHe: name.trim() || trackId,
      titleTranslit: '',
      spotifyTrackId: trackId,
      tags: ['general'],
      emoji: '🎵',
    });
    setOpen(false);
    setUrl('');
    setName('');
    lastFetchedId.current = '';
  }

  function reset() {
    setOpen(false);
    setUrl('');
    setName('');
    lastFetchedId.current = '';
  }

  if (!open) {
    return (
      <article
        onClick={() => setOpen(true)}
        className="rounded-2xl shadow-lg bg-white/70 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-gray-300 hover:shadow-xl transition-all min-h-[220px]"
      >
        <span className="text-5xl text-gray-300 leading-none">＋</span>
        <span className="text-sm text-gray-400">הוסף שיר</span>
      </article>
    );
  }

  return (
    <article className="rounded-2xl p-5 shadow-lg bg-white flex flex-col gap-3">
      <input
        autoFocus
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') reset(); }}
        placeholder="https://open.spotify.com/track/..."
        className="w-full text-xs font-mono rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:border-blue-400"
        dir="ltr"
      />
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') reset(); }}
          placeholder={fetching ? 'מחפש שם שיר...' : 'שם השיר (לא חובה)'}
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:border-blue-400 text-right"
          lang="he"
          dir="rtl"
        />
        {fetching && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">⟳</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!trackId || fetching}
          className="flex-1 rounded-xl py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >הוסף</button>
        <button
          onClick={reset}
          className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >ביטול</button>
      </div>
    </article>
  );
}

export default function PlaylistGrid({
  songs,
  theme,
  title,
  playingIdx,
  onPlaySong,
  onRemoveSong,
  onEditSongUrl,
  onAddSong,
}: Props) {
  return (
    <section className="px-4 pb-16">
      <h2 className="text-2xl font-bold text-center mb-6" lang="he" dir="rtl">
        🎵 {title ?? 'השירים שלנו השבוע'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto" dir="rtl">
        {songs.map((song, index) => (
          <PlaylistCard
            key={song.id}
            song={song}
            theme={theme}
            isPlaying={playingIdx === index}
            onPlay={() => onPlaySong?.(index)}
            onRemove={onRemoveSong ? () => onRemoveSong(song.id) : undefined}
            onEditUrl={onEditSongUrl ? (trackId) => onEditSongUrl(song.id, trackId) : undefined}
          />
        ))}
        {onAddSong && <AddSongCard onAdd={onAddSong} />}
      </div>
    </section>
  );
}
