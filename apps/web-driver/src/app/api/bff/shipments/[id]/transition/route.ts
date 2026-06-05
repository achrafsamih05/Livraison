import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiFetch } from '@/server/api-client';
import { requireDriver } from '@/server/guard';
import type { Shipment } from '@/lib/types';
import {
  forbidden,
  parseJson,
  toErrorResponse,
  unauthenticated,
  validationError,
} from '../../../_helpers';

const schema = z.object({
  status: z.enum([
    'CREATED',
    'PICKUP_PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED',
    'CANCELLED',
  ]),
  reason: z.string().max(500).optional(),
});

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
      return validationError('Invalid transition payload.');
    }
    const idempotencyKey = request.headers.get('idempotency-key') ?? undefined;
    const updated = await apiFetch<Shipment>('shipment', `/shipments/${context.params.id}/status`, {
      method: 'PATCH',
      headers: idempotencyKey !== undefined ? { 'idempotency-key': idempotencyKey } : {},
      body: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
