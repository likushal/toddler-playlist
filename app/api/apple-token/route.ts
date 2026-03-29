import { NextResponse } from 'next/server';
import { createSign } from 'crypto';

export async function GET() {
  const teamId     = process.env.APPLE_TEAM_ID;
  const keyId      = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!teamId || !keyId || !privateKey) {
    return NextResponse.json({ error: 'Apple Music not configured' }, { status: 503 });
  }

  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now, exp: now + 43200 })).toString('base64url');
  const unsigned = `${header}.${payload}`;

  const sign = createSign('SHA256');
  sign.update(unsigned);
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url');

  return NextResponse.json({ token: `${unsigned}.${signature}` });
}
