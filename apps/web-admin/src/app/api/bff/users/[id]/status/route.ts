import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireAdmin } from '@/server/guard';
import type { AdminUser } from '@/lib/types';
import { userStatusSchema } from '@/lib/schemas';
import {
  forbidden,
  parseJson,
  toErrorResponse,
  unauthenticated,
  validationError,
} from '../../../_helpers';

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const parsed = userStatusSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return validationError('Invalid status.');
    }
    const updated = await apiFetch<AdminUser>('identity', `/users/${context.params.id}/status`, {
      method: 'PATCH',
      body: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
