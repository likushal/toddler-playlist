'use client';

import { useState, useEffect, useRef } from 'react';
import { Song, ThemeConfig, CalendarEventKey } from '@/types';
import PlaylistGrid from './PlaylistGrid';
import SpotifyAutoPlayer from './SpotifyAutoPlayer';

interface SavedPlaylist {
  id: string;
  name: string;
  songs: Song[];
}

interface Props {
  defaultSongs: Song[];
  allSongs: Song[];
  theme: ThemeConfig;
  weekKey: string;
  primaryEvent: string;
}

// Pre-built playlists derived from song tags
const PRESETS: { tag: CalendarEventKey; label: string }[] = [
  { tag: 'rosh-hashana',   label: '🍎 ראש השנה' },
  { tag: 'sukkot',         label: '🌿 סוכות' },
  { tag: 'hanukkah',       label: '🕎 חנוכה' },
  { tag: 'tu-bishvat',     label: '🌳 טו בשבט' },
  { tag: 'purim',          label: '🎭 פורים' },
  { tag: 'pesach',         label: '🫓 פסח' },
  { tag: 'yom-haatzmaut',  label: '🇮🇱 יום העצמאות' },
  { tag: 'shavuot',        label: '🌸 שבועות' },
  { tag: 'shabbat',        label: '✨ שבת' },
  { tag: 'season-autumn',  label: '🍂 סתיו' },
  { tag: 'season-winter',  label: '🌧️ חורף' },
  { tag: 'season-spring',  label: '🌷 אביב' },
  { tag: 'season-summer',  label: '☀️ קיץ' },
  { tag: 'general',        label: '🎵 כלליים' },
];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function PlaylistClientWrapper({
  defaultSongs,
  allSongs,
  theme,
  weekKey,
  primaryEvent,
}: Props) {
  const storageKey = `playlist-${weekKey}`;

  // ── Core state ────────────────────────────────────────────────────────────
  const [activeSongs, setActiveSongs] = useState<Song[]>(defaultSongs);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [activeTab, setActiveTab] = useState<string>('week');

  // ── AI state ──────────────────────────────────────────────────────────────
  const [pendingSongs, setPendingSongs] = useState<Song[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');

  // ── New-list / save-as modal ──────────────────────────────────────────────
  // mode: 'new' = empty list, 'copy' = copy current songs (AI save)
  const [saveAsMode, setSaveAsMode] = useState<'new' | 'copy' | null>(null);
  const [saveAsName, setSaveAsName] = useState('');
  const [saveAsDesc, setSaveAsDesc] = useState('');
  const [saveAsGenerating, setSaveAsGenerating] = useState(false);
  const [saveAsError, setSaveAsError] = useState<string | null>(null);
  const saveAsInputRef = useRef<HTMLInputElement>(null);


  // ── Selector panel state ──────────────────────────────────────────────────
  const [selectorOpen, setSelectorOpen] = useState(false);

  // ── Playback state ────────────────────────────────────────────────────────
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledSongs, setShuffledSongs] = useState<Song[]>([]);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          let songs: Song[];
          if (typeof data[0] === 'string') {
            // Old format: array of IDs — look up in allSongs
            songs = (data as string[]).map(id => allSongs.find(s => s.id === id)).filter(Boolean) as Song[];
          } else {
            // New format: full Song objects
            songs = data as Song[];
          }
          if (songs.length >= 1) setActiveSongs(songs);
        }
      }
    } catch { /* ignore */ }
  }, [storageKey, allSongs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved-playlists');
      let migrated: SavedPlaylist[] = [];
      if (raw) {
        const data = JSON.parse(raw) as (SavedPlaylist & { songIds?: string[] })[];
        migrated = data.map(pl => {
          if (pl.songIds && !pl.songs) {
            const songs = pl.songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean) as Song[];
            return { id: pl.id, name: pl.name, songs };
          }
          return pl as SavedPlaylist;
        });
        setSavedPlaylists(migrated);
      }
      // Restore the last active tab
      const savedTab = localStorage.getItem('active-tab');
      if (savedTab && savedTab !== 'week') {
        const isPreset = savedTab.startsWith('preset-');
        const isSaved  = migrated.some(p => p.id === savedTab);
        if (isPreset || isSaved) setActiveTab(savedTab);
      }
    } catch { /* ignore */ }
  }, [allSongs]);

  // Persist active tab whenever it changes
  useEffect(() => {
    localStorage.setItem('active-tab', activeTab);
  }, [activeTab]);

  // Reset playback when tab changes
  useEffect(() => {
    setPlayingIdx(null);
    setIsShuffled(false);
    setShuffledSongs([]);
  }, [activeTab]);

  // ── Pad a playlist to at least 8 songs ───────────────────────────────────
  function padToEight(songs: Song[]): Song[] {
    if (songs.length === 0 || songs.length >= 8) return songs; // don't pad empty lists
    const ids  = new Set(songs.map(s => s.id));
    const tags = new Set(songs.flatMap(s => s.tags));
    // Fill with same-tag songs first, then anything else
    const rest     = allSongs.filter(s => !ids.has(s.id));
    const sameTag  = rest.filter(s => s.tags.some(t => tags.has(t)));
    const others   = rest.filter(s => !s.tags.some(t => tags.has(t)));
    const fill = [...sameTag, ...others];
    return [...songs, ...fill.slice(0, 8 - songs.length)];
  }

  // ── Derived: songs for a given tab id ────────────────────────────────────
  function songsForTab(tabId: string): Song[] {
    if (tabId === 'week') return padToEight(pendingSongs ?? activeSongs);
    if (tabId.startsWith('preset-')) {
      // Use saved override if the user has edited this preset
      const override = savedPlaylists.find(p => p.id === tabId);
      if (override) return padToEight(override.songs);
      const tag = tabId.slice('preset-'.length) as CalendarEventKey;
      return padToEight(allSongs.filter(s => s.tags.includes(tag)));
    }
    // User-created saved lists: show only what was manually added, no padding
    const pl = savedPlaylists.find(p => p.id === tabId);
    return pl?.songs ?? [];
  }

  // Presets filtered to those that actually have songs
  const availablePresets = PRESETS.filter(p =>
    allSongs.some(s => s.tags.includes(p.tag))
  );

  const tabSongs = songsForTab(activeTab);
  const displaySongs = isShuffled && shuffledSongs.length > 0 ? shuffledSongs : tabSongs;
  const currentSong = playingIdx !== null ? displaySongs[playingIdx] ?? null : null;

  // Keep a ref so handleSongEnded always sees the latest displaySongs length
  const displaySongsLenRef = useRef(displaySongs.length);
  displaySongsLenRef.current = displaySongs.length;

  // Label for the active tab
  function tabLabel(tabId: string): string {
    if (tabId === 'week') return 'היום';
    if (tabId.startsWith('preset-')) {
      const tag = tabId.slice('preset-'.length) as CalendarEventKey;
      return PRESETS.find(p => p.tag === tag)?.label ?? tag;
    }
    return savedPlaylists.find(p => p.id === tabId)?.name ?? '';
  }

  // ── Helpers: week playlist ────────────────────────────────────────────────
  function saveWeekPlaylist(songs: Song[]) {
    localStorage.setItem(storageKey, JSON.stringify(songs));
    setActiveSongs(songs);
  }

  function resetPlaylist() {
    if (activeTab === 'week') {
      localStorage.removeItem(storageKey);
      setActiveSongs(defaultSongs);
      setPendingSongs(null);
      setAiError(null);
    } else if (activeTab.startsWith('preset-')) {
      // Remove the saved override — reverts to catalog-filtered songs
      persistSaved(savedPlaylists.filter(p => p.id !== activeTab));
    }
    // Stay on the current tab regardless
  }

  // ── Helpers: saved playlists ──────────────────────────────────────────────
  function persistSaved(next: SavedPlaylist[]) {
    setSavedPlaylists(next);
    localStorage.setItem('saved-playlists', JSON.stringify(next));
  }

  function openNewList() {
    setSaveAsMode('new');
    setSaveAsName('');
    setSaveAsDesc('');
    setSaveAsError(null);
    setSelectorOpen(false);
    setTimeout(() => saveAsInputRef.current?.focus(), 50);
  }

  function openSaveCopy() {
    setSaveAsMode('copy');
    setSaveAsName('');
    setTimeout(() => saveAsInputRef.current?.focus(), 50);
  }

  async function commitSaveAs() {
    const name = saveAsName.trim();
    if (!name) return;

    // 'copy' mode or 'new' without description → create immediately
    if (saveAsMode === 'copy' || !saveAsDesc.trim()) {
      const songs = saveAsMode === 'copy' ? (pendingSongs ?? tabSongs) : [];
      const entry: SavedPlaylist = { id: crypto.randomUUID(), name, songs };
      persistSaved([...savedPlaylists, entry]);
      setActiveTab(entry.id);
      setSaveAsName('');
      setSaveAsDesc('');
      setSaveAsMode(null);
      setPendingSongs(null);
      return;
    }

    // 'new' with description → ask LLM to fill the playlist
    setSaveAsGenerating(true);
    setSaveAsError(null);
    try {
      const res = await fetch('/api/playlist-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSongIds: [], prompt: saveAsDesc.trim(), event: primaryEvent }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveAsError(data.error ?? 'שגיאה לא ידועה');
        return;
      }
      const songs = (data.songIds as string[])
        .map(id => allSongs.find(s => s.id === id))
        .filter(Boolean) as Song[];
      const entry: SavedPlaylist = { id: crypto.randomUUID(), name, songs };
      persistSaved([...savedPlaylists, entry]);
      setActiveTab(entry.id);
      setSaveAsName('');
      setSaveAsDesc('');
      setSaveAsMode(null);
    } catch {
      setSaveAsError('שגיאת רשת, נסה שוב');
    } finally {
      setSaveAsGenerating(false);
    }
  }

  function deleteSaved(id: string) {
    persistSaved(savedPlaylists.filter(p => p.id !== id));
    if (activeTab === id) setActiveTab('week');
  }

  // ── Helpers: inline playlist editing ─────────────────────────────────────
  function applyTabChange(updated: Song[]) {
    if (updated.length === 0) return;
    // Always reset shuffle + playback so display matches the updated list
    setIsShuffled(false);
    setShuffledSongs([]);
    setPlayingIdx(null);
    if (activeTab === 'week') {
      saveWeekPlaylist(updated);
      setPendingSongs(null);
    } else if (activeTab.startsWith('preset-')) {
      // Save as an override keyed to the preset id — stays on the same tab
      const existing = savedPlaylists.find(p => p.id === activeTab);
      if (existing) {
        persistSaved(savedPlaylists.map(p => p.id === activeTab ? { ...p, songs: updated } : p));
      } else {
        const label = tabLabel(activeTab);
        persistSaved([...savedPlaylists, { id: activeTab, name: label, songs: updated }]);
      }
    } else {
      persistSaved(savedPlaylists.map(p =>
        p.id === activeTab ? { ...p, songs: updated } : p
      ));
    }
  }

  function handleRemoveSong(songId: string) {
    applyTabChange(tabSongs.filter(s => s.id !== songId));
  }

  function handleEditSongUrl(songId: string, newTrackId: string) {
    applyTabChange(tabSongs.map(s => s.id === songId ? { ...s, spotifyTrackId: newTrackId } : s));
  }

  function handleAddSong(song: Song) {
    applyTabChange([...tabSongs, song]);
  }

  function handleSongEnded() {
    setPlayingIdx(prev => {
      if (prev === null) return null;
      return prev < displaySongsLenRef.current - 1 ? prev + 1 : null;
    });
  }

  // ── Helpers: AI ──────────────────────────────────────────────────────────
  async function handlePromptSubmit() {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/playlist-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSongIds: activeSongs.map(s => s.id), prompt: trimmed, event: primaryEvent }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error ?? 'שגיאה לא ידועה');
      } else {
        const songs = (data.songIds as string[]).map(id => allSongs.find(s => s.id === id)).filter(Boolean) as Song[];
        setPendingSongs(songs);
        setActiveTab('week');
        setPromptText('');
      }
    } catch {
      setAiError('שגיאת רשת, נסה שוב');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Helpers: playback ─────────────────────────────────────────────────────
  function toggleShuffle() {
    if (isShuffled) {
      setIsShuffled(false);
      setShuffledSongs([]);
      setPlayingIdx(null);
    } else {
      const shuffled = shuffleArray(tabSongs);
      setShuffledSongs(shuffled);
      setIsShuffled(true);
      setPlayingIdx(0); // auto-start first shuffled song
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── AI prompt bar ── */}
      <div className="mx-4 mb-4 flex gap-2 items-center" dir="rtl">
        <input
          type="text"
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handlePromptSubmit(); }}
          disabled={isLoading}
          placeholder="למשל: תני לי רק שירי שבת, או הוסיפי שיר על בעלי חיים"
          className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 disabled:opacity-50"
        />
        <button
          onClick={handlePromptSubmit}
          disabled={isLoading || !promptText.trim()}
          className="rounded-full w-10 h-10 flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          {isLoading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : <span className="text-base leading-none">✦</span>}
        </button>
      </div>

      {aiError && <p className="mx-4 mb-3 text-sm text-red-600 text-right" dir="rtl">⚠️ {aiError}</p>}

      {/* ── Playlist selector ── */}
      <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white overflow-hidden" dir="rtl">

        {/* ── Header / toggle ── */}
        <button
          onClick={() => setSelectorOpen(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg">📂</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700">פלייליסטים</p>
            <p className="text-xs text-gray-400 truncate">{tabLabel(activeTab)}</p>
          </div>
          <span className={`text-gray-400 transition-transform duration-200 ${selectorOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {/* ── Expanded list ── */}
        {selectorOpen && (
          <>
            {/* This week */}
            <button
              onClick={() => { setActiveTab('week'); setSelectorOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors border-t border-gray-100 ${
                activeTab === 'week' ? 'bg-gray-800 text-white' : 'hover:bg-gray-50 text-gray-800'
              }`}
            >
              <span className="text-base w-6 text-center flex-shrink-0">🗓</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">היום</p>
              </div>
              <span className={`text-xs flex-shrink-0 ${activeTab === 'week' ? 'text-gray-300' : 'text-gray-400'}`}>
                {activeTab === 'week' ? '▶ מוצג' : songsForTab('week').length}
              </span>
            </button>

            {/* Holiday presets */}
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
              רשימות חג
            </p>
            {availablePresets.map(preset => {
              const tabId = `preset-${preset.tag}`;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => { setActiveTab(tabId); setSelectorOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-right transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="text-base w-6 text-center flex-shrink-0">
                    {preset.label.split(' ')[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {preset.label.split(' ').slice(1).join(' ')}
                    </p>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {isActive ? '▶ מוצג' : songsForTab(tabId).length}
                  </span>
                </button>
              );
            })}

            {/* User saved lists */}
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
              הרשימות שלי
            </p>

            {/* Add new list — top of section */}
            <button
              onClick={openNewList}
              className="w-full flex items-center gap-3 px-4 py-2 text-right text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <span className="text-base w-6 text-center">＋</span>
              <span className="text-sm font-medium">רשימה חדשה...</span>
            </button>

            {savedPlaylists.filter(p => !p.id.startsWith('preset-')).length === 0 && (
              <p className="px-4 pb-3 text-xs text-gray-400">אין רשימות שמורות עדיין</p>
            )}
            {savedPlaylists.filter(p => !p.id.startsWith('preset-')).map(pl => {
              const isActive = activeTab === pl.id;
              return (
                <div
                  key={pl.id}
                  className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <button className="flex-1 flex items-center gap-3 text-right min-w-0" onClick={() => { setActiveTab(pl.id); setSelectorOpen(false); }}>
                    <span className="text-base w-6 text-center flex-shrink-0">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pl.name}</p>
                    </div>
                    <span className={`text-xs flex-shrink-0 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                      {isActive ? '▶ מוצג' : songsForTab(pl.id).length}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteSaved(pl.id)}
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors flex-shrink-0 ${
                      isActive ? 'text-white/50 hover:text-white hover:bg-white/20' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── New list / save-as modal ── */}
      {saveAsMode && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget && !saveAsGenerating) setSaveAsMode(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" dir="rtl">
            <h2 className="text-lg font-bold">
              {saveAsMode === 'new' ? 'רשימה חדשה' : 'שמור בשם'}
            </h2>
            <input
              ref={saveAsInputRef}
              autoFocus
              type="text"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitSaveAs(); if (e.key === 'Escape') setSaveAsMode(null); }}
              placeholder="שם הרשימה..."
              disabled={saveAsGenerating}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 disabled:opacity-50"
            />
            {saveAsMode === 'new' && (
              <div className="flex flex-col gap-1">
                <textarea
                  value={saveAsDesc}
                  onChange={e => setSaveAsDesc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setSaveAsMode(null); }}
                  placeholder="תאר את הרשימה ו-AI יבחר שירים... (לא חובה)&#10;למשל: שירי שבת, שירים על חיות, שירי חנוכה"
                  rows={3}
                  disabled={saveAsGenerating}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none disabled:opacity-50"
                />
                {saveAsDesc.trim() && (
                  <p className="text-xs text-purple-600 text-right">✦ AI יבחר שירים מתאימים</p>
                )}
              </div>
            )}
            {saveAsError && (
              <p className="text-xs text-red-500 text-right">⚠️ {saveAsError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={commitSaveAs}
                disabled={!saveAsName.trim() || saveAsGenerating}
                className="flex-1 rounded-full py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {saveAsGenerating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    יוצר...
                  </>
                ) : saveAsMode === 'new' ? 'צור רשימה' : 'שמור'}
              </button>
              <button
                onClick={() => setSaveAsMode(null)}
                disabled={saveAsGenerating}
                className="flex-1 rounded-full py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Playback controls ── */}
      <div className="mx-4 mb-4 flex items-center gap-2" dir="rtl">
        {playingIdx === null ? (
          <button onClick={() => setPlayingIdx(0)} className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
            <span>▶</span> נגן הכל
          </button>
        ) : (
          <button onClick={() => setPlayingIdx(null)} className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-colors">
            <span>⏹</span> עצור
          </button>
        )}
        <button
          onClick={toggleShuffle}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isShuffled ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          🔀 ערבב
        </button>
      </div>

      {/* ── Now Playing bar ── */}
      {currentSong && (
        <div className="mx-4 mb-4 rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setPlayingIdx(i => (i !== null && i > 0 ? i - 1 : i))}
              disabled={playingIdx === 0}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors flex-shrink-0"
            >←</button>
            <div className="flex-1 text-center min-w-0">
              <p className="text-2xl">{currentSong.emoji}</p>
              <p className="text-sm font-semibold text-gray-800 truncate" lang="he">{currentSong.titleHe}</p>
              <p className="text-xs text-gray-500">{(playingIdx ?? 0) + 1} / {displaySongs.length}</p>
            </div>
            <button
              onClick={() => setPlayingIdx(i => i !== null && i < displaySongs.length - 1 ? i + 1 : null)}
              disabled={playingIdx === displaySongs.length - 1}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors flex-shrink-0"
            >→</button>
          </div>
          {/^[A-Za-z0-9]{10,30}$/.test(currentSong.spotifyTrackId) ? (
            <SpotifyAutoPlayer
              key={playingIdx}
              trackId={currentSong.spotifyTrackId}
              onEnded={handleSongEnded}
            />
          ) : (
            <div className="px-4 pb-3 text-center text-sm text-red-400" dir="rtl">⚠️ לשיר זה אין קישור Spotify תקין</div>
          )}
        </div>
      )}

      {/* ── Song grid ── */}
      <PlaylistGrid
        songs={displaySongs}
        theme={theme}
        title={tabLabel(activeTab)}
        playingIdx={playingIdx}
        onPlaySong={idx => setPlayingIdx(idx)}
        onRemoveSong={handleRemoveSong}
        onEditSongUrl={handleEditSongUrl}
        onAddSong={handleAddSong}
      />

      {/* ── AI status bar (week only) ── */}
      {pendingSongs && activeTab === 'week' && (
        <div className="mx-4 mb-4 rounded-2xl bg-purple-50 border border-purple-200 px-4 py-3 flex flex-wrap items-center gap-2 justify-between" dir="rtl">
          <span className="text-purple-700 text-sm font-medium">✨ שונה על ידי AI</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { saveWeekPlaylist(pendingSongs); setPendingSongs(null); }} className="rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors">שמור השבוע</button>
            <button onClick={openSaveCopy} className="rounded-full px-4 py-1.5 text-sm font-semibold text-purple-700 bg-white border border-purple-300 hover:bg-purple-50 transition-colors">שמור בשם...</button>
            <button onClick={() => setPendingSongs(null)} className="rounded-full px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">בטל</button>
          </div>
        </div>
      )}

      {/* ── Reset (week + preset tabs) ── */}
      {(activeTab === 'week' || activeTab.startsWith('preset-')) && (
        <div className="flex justify-center pb-16 px-4">
          <button onClick={resetPlaylist} className="text-xs text-gray-400 hover:text-gray-600 underline" dir="rtl">
            אפס לברירת מחדל
          </button>
        </div>
      )}
    </>
  );
}
