import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { readSession, writeSession } from '@/server/session';
import type { SessionUser } from '@/lib/types';
import { profileSchema } from '@/lib/schemas';
import { parseJson, toErrorResponse } from '../_helpers';

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = readSession();
    if (session === null) {
      return NextResponse.json(
        {
          status: 401,
          code: 'UNAUTHENTICATED',
          title: 'Unauthorized',
          detail: 'No active session.',
        },
        { status: 401 },
      );
    }
    const parsed = profileSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return NextResponse.json(
        { status: 400, code: 'VALIDATION_ERROR', title: 'Bad Request', detail: 'Invalid profile.' },
        { status: 400 },
      );
    }

    const updated = await apiFetch<SessionUser>('identity', `/users/${session.user.id}`, {
      method: 'PATCH',
      body: parsed.data,
    });

    writeSession({ ...session, user: { ...session.user, ...updated } });
    return NextResponse.json({ ...session.user, ...updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
