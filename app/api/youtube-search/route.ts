import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube not configured' }, { status: 503 });

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&key=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  const item = data.items?.[0];
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({
    videoId: item.id.videoId,
    title:   item.snippet.title,
    channel: item.snippet.channelTitle,
  });
}
