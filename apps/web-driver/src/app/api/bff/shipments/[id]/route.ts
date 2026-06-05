import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { requireDriver } from '@/server/guard';
import type { Shipment } from '@/lib/types';
import { forbidden, toErrorResponse, unauthenticated } from '../../_helpers';

export async function GET(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireDriver();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const data = await apiFetch<Shipment>('shipment', `/shipments/${context.params.id}`);
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
