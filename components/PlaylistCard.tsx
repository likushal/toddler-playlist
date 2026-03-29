'use client';

import { useState } from 'react';
import { Song, ThemeConfig } from '@/types';

interface Props {
  song: Song;
  theme: ThemeConfig;
  isPlaying?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  onEditUrl?: (newTrackId: string) => void;
}

function extractTrackId(input: string): string {
  const urlMatch = input.match(/track\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  const uriMatch = input.match(/spotify:track:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  const raw = input.trim();
  if (/^[A-Za-z0-9]{10,30}$/.test(raw)) return raw;
  return '';
}

export default function PlaylistCard({ song, theme, isPlaying, onPlay, onRemove, onEditUrl }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');

  function startEdit() {
    setEditUrl(`https://open.spotify.com/track/${song.spotifyTrackId}`);
    setIsEditing(true);
  }

  function commitEdit() {
    const trackId = extractTrackId(editUrl);
    if (trackId && onEditUrl) onEditUrl(trackId);
    setIsEditing(false);
    setEditUrl('');
  }

  if (isEditing) {
    return (
      <article className="rounded-2xl p-5 shadow-lg bg-white flex flex-col gap-3">
        <div className="text-5xl text-center select-none">{song.emoji}</div>
        <div className="text-center">
          <h3 className="text-lg font-bold" lang="he" dir="rtl">{song.titleHe}</h3>
        </div>
        <input
          autoFocus
          type="text"
          value={editUrl}
          onChange={e => setEditUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setIsEditing(false); setEditUrl(''); }
          }}
          placeholder="Spotify URL or Track ID"
          className="w-full text-xs font-mono rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:border-blue-400"
          dir="ltr"
        />
        <div className="flex gap-2">
          <button
            onClick={commitEdit}
            disabled={!editUrl.trim()}
            className="flex-1 rounded-xl py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >✓ שמור</button>
          <button
            onClick={() => { setIsEditing(false); setEditUrl(''); }}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >ביטול</button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative rounded-2xl p-5 shadow-lg bg-white flex flex-col gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] group ${
        isPlaying ? 'ring-2 ring-green-400 shadow-green-100' : ''
      }`}
    >
      {/* Both action buttons — top-left, revealed on hover */}
      {(onRemove || onEditUrl) && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEditUrl && (
            <button
              onClick={e => { e.stopPropagation(); startEdit(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="ערוך Spotify URL"
            >✎</button>
          )}
          {onRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="הסר שיר"
            >✕</button>
          )}
        </div>
      )}

      {/* Emoji */}
      <div className="text-5xl text-center select-none pt-1" aria-hidden="true">
        {song.emoji}
      </div>

      {/* Titles */}
      <div className="text-center">
        <h3 className="text-xl font-bold leading-snug" lang="he" dir="rtl">
          {song.titleHe}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{song.titleTranslit}</p>
      </div>

      {/* Play button */}
      <button
        onClick={onPlay}
        className={`w-full min-h-[56px] rounded-xl font-bold text-white text-base transition-all ${theme.primaryColor} hover:opacity-90 active:scale-95 flex items-center justify-center gap-2`}
        aria-label={`נגן ${song.titleHe}`}
      >
        <span aria-hidden="true">{isPlaying ? '♫' : '▶'}</span>
        <span>{isPlaying ? 'מנגן' : 'נגן'}</span>
      </button>
    </article>
  );
}
