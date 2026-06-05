import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireAdmin } from '@/server/guard';
import type { AdminUser } from '@/lib/types';
import { createUserSchema } from '@/lib/schemas';
import {
  forbidden,
  parseJson,
  toErrorResponse,
  unauthenticated,
  validationError,
} from '../_helpers';

export async function GET(): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const users = await apiFetch<AdminUser[]>('identity', '/users');
    return NextResponse.json(users);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const parsed = createUserSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return validationError(
        'Invalid user payload.',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), rule: i.message })),
      );
    }
    const created = await apiFetch<AdminUser>('identity', '/users', {
      method: 'POST',
      body: parsed.data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
