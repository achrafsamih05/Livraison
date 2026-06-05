import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireAdmin } from '@/server/guard';
import type { Tenant } from '@/lib/types';
import { updateTenantSchema } from '@/lib/schemas';
import {
  forbidden,
  parseJson,
  toErrorResponse,
  unauthenticated,
  validationError,
} from '../../_helpers';

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const parsed = updateTenantSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return validationError('Invalid tenant payload.');
    }
    const updated = await apiFetch<Tenant>('identity', `/tenants/${context.params.id}`, {
      method: 'PATCH',
      body: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const archived = await apiFetch<Tenant>('identity', `/tenants/${context.params.id}`, {
      method: 'DELETE',
    });
    return NextResponse.json(archived);
  } catch (error) {
    return toErrorResponse(error);
  }
}
