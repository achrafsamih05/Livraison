import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { clearSession, readSession } from '@/server/session';

export async function POST(): Promise<NextResponse> {
  const session = readSession();
  if (session !== null) {
    try {
      await apiFetch('identity', '/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      });
    } catch {
      // Best-effort upstream revocation; always clear the local session.
    }
  }
  clearSession();
  return new NextResponse(null, { status: 204 });
}
