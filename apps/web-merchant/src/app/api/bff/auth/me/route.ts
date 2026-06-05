import { NextResponse } from 'next/server';
import { readSession } from '@/server/session';

export async function GET(): Promise<NextResponse> {
  const session = readSession();
  if (session === null) {
    return NextResponse.json(
      { status: 401, code: 'UNAUTHENTICATED', title: 'Unauthorized', detail: 'No active session.' },
      { status: 401 },
    );
  }
  return NextResponse.json(session.user);
}
