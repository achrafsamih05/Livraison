import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import type { TrackingEvent } from '@/lib/types';
import { toErrorResponse } from '../../../_helpers';

export async function GET(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const data = await apiFetch<TrackingEvent[]>(
      'tracking',
      `/tracking/shipments/${context.params.id}/timeline`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
