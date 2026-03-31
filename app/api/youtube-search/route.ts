import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'YouTube not configured' }, { status: 503 });

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoEmbeddable=true&maxResults=5&key=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  const items = data.items ?? [];
  if (items.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({
    videoIds: items.map((item: any) => item.id.videoId),
    // Keep backwards-compat single field
    videoId: items[0].id.videoId,
    title:   items[0].snippet.title,
    channel: items[0].snippet.channelTitle,
  });
}
