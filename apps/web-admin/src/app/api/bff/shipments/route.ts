import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireAdmin } from '@/server/guard';
import type { Paginated, Shipment } from '@/lib/types';
import { forbidden, toErrorResponse, unauthenticated } from '../_helpers';

export async function GET(request: Request): Promise<NextResponse> {
  const guard = requireAdmin();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    const status = searchParams.get('status');
    if (status !== null) qs.set('status', status);
    qs.set('limit', searchParams.get('limit') ?? '20');
    qs.set('offset', searchParams.get('offset') ?? '0');

    const data = await apiFetch<Paginated<Shipment>>('shipment', `/shipments?${qs.toString()}`);
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
