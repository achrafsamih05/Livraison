import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import type { Paginated, Shipment } from '@/lib/types';
import { createShipmentSchema } from '@/lib/schemas';
import { parseJson, toErrorResponse } from '../_helpers';

export async function GET(request: Request): Promise<NextResponse> {
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = createShipmentSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return NextResponse.json(
        {
          status: 400,
          code: 'VALIDATION_ERROR',
          title: 'Bad Request',
          detail: 'Invalid shipment payload.',
          errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), rule: i.message })),
        },
        { status: 400 },
      );
    }

    const created = await apiFetch<Shipment>('shipment', '/shipments', {
      method: 'POST',
      body: parsed.data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
