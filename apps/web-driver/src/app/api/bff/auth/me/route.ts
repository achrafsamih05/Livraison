import { NextResponse } from 'next/server';
import { readSession } from '@/server/session';
import { unauthenticated } from '../../_helpers';

export async function GET(): Promise<NextResponse> {
  const session = readSession();
  if (session === null) {
    return unauthenticated();
  }
  return NextResponse.json(session.user);
}
