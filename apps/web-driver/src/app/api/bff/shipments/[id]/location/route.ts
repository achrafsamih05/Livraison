import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiFetch } from '@/server/api-client';
import { requireDriver } from '@/server/guard';
import {
  forbidden,
  parseJson,
  toErrorResponse,
  unauthenticated,
  validationError,
} from '../../../_helpers';

const schema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  capturedAt: z.string(),
});

/**
 * Records the driver's GPS position as a NOTE tracking event (location ping).
 * The server timestamps and attributes the event; client geo is treated as
 * advisory and corroborated server-side per the platform anti-fraud design.
 */
export async function POST(
  request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const guard = requireDriver();
  if (!guard.ok) {
    return guard.reason === 'forbidden' ? forbidden() : unauthenticated();
  }
  try {
    const parsed = schema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return validationError('Invalid location payload.');
    }
    const idempotencyKey = request.headers.get('idempotency-key') ?? undefined;

    await apiFetch('tracking', '/tracking/events', {
      method: 'POST',
      headers: idempotencyKey !== undefined ? { 'idempotency-key': idempotencyKey } : {},
      body: {
        shipmentId: context.params.id,
        trackingNumber: 'GPS',
        type: 'NOTE',
        source: 'DRIVER_APP',
        description: 'Driver location ping',
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        isPublic: false,
        metadata: { accuracy: parsed.data.accuracy, capturedAt: parsed.data.capturedAt },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
