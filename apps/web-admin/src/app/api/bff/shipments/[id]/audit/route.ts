import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireAdmin } from '@/server/guard';
import type { AuditLogEntry, Paginated } from '@/lib/types';
import { forbidden, toErrorResponse, unauthenticated } from '../../../_helpers';

export async function GET(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    qs.set('limit', searchParams.get('limit') ?? '50');
    qs.set('offset', searchParams.get('offset') ?? '0');

    const data = await apiFetch<Paginated<AuditLogEntry>>(
      'tracking',
      `/tracking/shipments/${context.params.id}/audit?${qs.toString()}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
