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

const geoSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  capturedAt: z.string(),
});

const schema = z.object({
  recipientName: z.string().min(1).max(160),
  notes: z.string().max(1000).optional(),
  signatureDataUrl: z.string().startsWith('data:image/').optional(),
  photoDataUrl: z.string().startsWith('data:image/').optional(),
  geo: geoSchema.optional(),
});

/**
 * Records Proof of Delivery as a DELIVERED tracking event on the tracking
 * service. POD media (signature/photo) is attached as event metadata; in a
 * later increment large media should upload to object storage and store only a
 * signed URL here.
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
      return validationError('Invalid proof-of-delivery payload.');
    }
    const idempotencyKey = request.headers.get('idempotency-key') ?? undefined;
    const { geo, ...pod } = parsed.data;

    await apiFetch('tracking', '/tracking/events', {
      method: 'POST',
      headers: idempotencyKey !== undefined ? { 'idempotency-key': idempotencyKey } : {},
      body: {
        shipmentId: context.params.id,
        trackingNumber: 'POD',
        type: 'DELIVERED',
        source: 'DRIVER_APP',
        description: `POD by ${pod.recipientName}`,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
        isPublic: true,
        metadata: {
          recipientName: pod.recipientName,
          notes: pod.notes ?? null,
          hasSignature: pod.signatureDataUrl !== undefined,
          hasPhoto: pod.photoDataUrl !== undefined,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
