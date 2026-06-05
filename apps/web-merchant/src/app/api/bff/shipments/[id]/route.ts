import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import type { Shipment } from '@/lib/types';
import { toErrorResponse } from '../../_helpers';

export async function GET(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const data = await apiFetch<Shipment>('shipment', `/shipments/${context.params.id}`);
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
