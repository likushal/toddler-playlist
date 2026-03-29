import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ALL_SONGS } from '@/lib/playlist-data';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { currentSongIds, prompt, event } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'נדרש טקסט בקשה' }, { status: 400 });
    }

    const catalogLines = ALL_SONGS.map(s =>
      `${s.id} | ${s.titleHe} | ${s.titleTranslit} | ${s.tags.join(', ')}`
    ).join('\n');

    const currentIds = Array.isArray(currentSongIds) ? currentSongIds : [];

    const userPrompt = `You are managing a Hebrew children's music playlist (3–8 songs).

CATALOG (id | Hebrew title | transliteration | tags):
${catalogLines}

CURRENT PLAYLIST IDs: ${currentIds.join(', ') || '(empty)'}
CONTEXT: ${event || 'general'}

The parent says: "${prompt}"

Respond ONLY with valid JSON: {"songIds":["id1","id2",...]}
Rules:
- Use only IDs from the CATALOG above
- Keep 3–8 songs total
- Honour the parent's intent
- Prefer songs whose tags match the context
- Do not include duplicate IDs`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'תגובת AI לא תקינה' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { songIds: string[] };
    const validIds = new Set(ALL_SONGS.map(s => s.id));
    const songIds = parsed.songIds.filter((id: string) => validIds.has(id));

    if (songIds.length === 0) {
      return NextResponse.json({ error: 'לא נמצאו שירים מתאימים' }, { status: 400 });
    }

    return NextResponse.json({ songIds });
  } catch (err) {
    console.error('playlist-prompt error:', err);
    return NextResponse.json({ error: 'שגיאה בשרת, נסה שוב' }, { status: 500 });
  }
}
