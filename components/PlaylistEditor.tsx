'use client';

import { useState } from 'react';
import { Song } from '@/types';

interface Props {
  activeSongs: Song[];
  onSave: (songs: Song[]) => void;
  onClose: () => void;
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

export default function PlaylistEditor({ activeSongs, onSave, onClose }: Props) {
  const [songs, setSongs] = useState<Song[]>(activeSongs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addEmoji, setAddEmoji] = useState('🎵');
  const [addTitleHe, setAddTitleHe] = useState('');
  const [addTranslit, setAddTranslit] = useState('');
  const [addUrl, setAddUrl] = useState('');

  function removeSong(id: string) {
    setSongs(prev => prev.filter(s => s.id !== id));
  }

  function startEdit(song: Song) {
    setShowAdd(false);
    setEditingId(song.id);
    setEditUrl(song.spotifyTrackId);
  }

  function commitEdit(id: string) {
    const trackId = extractTrackId(editUrl);
    if (trackId) {
      setSongs(prev => prev.map(s => s.id === id ? { ...s, spotifyTrackId: trackId } : s));
    }
    setEditingId(null);
    setEditUrl('');
  }

  function commitAdd() {
    const trackId = extractTrackId(addUrl);
    if (!trackId) return;
    const newSong: Song = {
      id: `custom-${crypto.randomUUID()}`,
      titleHe: addTitleHe.trim() || 'שיר חדש',
      titleTranslit: addTranslit.trim(),
      spotifyTrackId: trackId,
      tags: ['general'],
      emoji: addEmoji || '🎵',
    };
    setSongs(prev => [...prev, newSong]);
    setShowAdd(false);
    setAddEmoji('🎵');
    setAddTitleHe('');
    setAddTranslit('');
    setAddUrl('');
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" dir="rtl">
          <h2 className="text-lg font-bold">ערוך פלייליסט</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{songs.length} שירים</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >✕</button>
          </div>
        </div>

        {/* Song list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1" dir="rtl">
          {songs.map(song =>
            editingId === song.id ? (
              /* URL edit row */
              <div key={song.id} className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xl flex-shrink-0">{song.emoji}</span>
                <input
                  autoFocus
                  type="text"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(song.id);
                    if (e.key === 'Escape') { setEditingId(null); setEditUrl(''); }
                  }}
                  placeholder="Spotify URL or Track ID"
                  className="flex-1 text-xs font-mono rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
                  dir="ltr"
                />
                <button
                  onClick={() => commitEdit(song.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex-shrink-0 font-bold"
                >✓</button>
                <button
                  onClick={() => { setEditingId(null); setEditUrl(''); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
                >✕</button>
              </div>
            ) : (
              /* Normal song row */
              <div key={song.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-2xl flex-shrink-0">{song.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" lang="he">{song.titleHe}</p>
                  {song.titleTranslit && (
                    <p className="text-xs text-gray-400 truncate">{song.titleTranslit}</p>
                  )}
                </div>
                <button
                  onClick={() => startEdit(song)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0"
                  title="ערוך Spotify URL"
                >✎</button>
                <button
                  onClick={() => removeSong(song.id)}
                  disabled={songs.length <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-30"
                  title="הסר שיר"
                >✕</button>
              </div>
            )
          )}

          {/* Add song card */}
          {showAdd ? (
            <div className="rounded-xl border-2 border-dashed border-blue-300 p-4 space-y-2.5" dir="rtl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addEmoji}
                  onChange={e => setAddEmoji(e.target.value)}
                  placeholder="🎵"
                  className="w-14 text-center text-xl rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={addTitleHe}
                  onChange={e => setAddTitleHe(e.target.value)}
                  placeholder="שם השיר בעברית"
                  className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-blue-400"
                  lang="he"
                />
              </div>
              <input
                type="text"
                value={addTranslit}
                onChange={e => setAddTranslit(e.target.value)}
                placeholder="שם בתעתיק (לא חובה)"
                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-blue-400"
              />
              <input
                autoFocus
                type="text"
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                placeholder="Spotify URL or Track ID"
                className="w-full text-sm font-mono rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-blue-400"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button
                  onClick={commitAdd}
                  disabled={!addUrl.trim()}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >הוסף</button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-full px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >ביטול</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowAdd(true); setEditingId(null); }}
              className="w-full flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 py-6 text-gray-300 hover:text-gray-400 hover:border-gray-300 transition-colors"
            >
              <span className="text-3xl leading-none">＋</span>
              <span className="text-xs">הוסף שיר</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t" dir="rtl">
          <button
            onClick={() => onSave(songs)}
            disabled={songs.length === 0}
            className="flex-1 rounded-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >שמור</button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >ביטול</button>
        </div>
      </div>
    </div>
  );
}
