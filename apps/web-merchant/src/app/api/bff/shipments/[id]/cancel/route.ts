import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import type { Shipment } from '@/lib/types';
import { parseJson, toErrorResponse } from '../../../_helpers';

export async function POST(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const body = await parseJson<{ reason?: string }>(request).catch(() => ({ reason: undefined }));
    const data = await apiFetch<Shipment>('shipment', `/shipments/${context.params.id}/cancel`, {
      method: 'POST',
      body: { reason: body.reason },
    });
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
