import { NextRequest, NextResponse } from 'next/server';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get Spotify token');
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json() as { query: string };
    if (!query?.trim()) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const token = await getAccessToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=IL`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Spotify search failed');

    const data = await res.json();
    const track = data?.tracks?.items?.[0];
    if (!track) return NextResponse.json({ error: 'לא נמצא שיר מתאים' }, { status: 404 });

    return NextResponse.json({ trackId: track.id, name: track.name, artist: track.artists?.[0]?.name });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'שגיאה בחיפוש';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
