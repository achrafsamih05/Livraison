import 'server-only';
import { NextResponse } from 'next/server';
import { UpstreamError } from '@/server/api-client';

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof UpstreamError) {
    return NextResponse.json(error.problem, { status: error.status });
  }
  return NextResponse.json(
    {
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Internal Server Error',
      detail: 'Unexpected error.',
    },
    { status: 500 },
  );
}

export function unauthenticated(): NextResponse {
  return NextResponse.json(
    { status: 401, code: 'UNAUTHENTICATED', title: 'Unauthorized', detail: 'No active session.' },
    { status: 401 },
  );
}

export function forbidden(): NextResponse {
  return NextResponse.json(
    { status: 403, code: 'FORBIDDEN', title: 'Forbidden', detail: 'Admin role required.' },
    { status: 403 },
  );
}

export function validationError(detail: string, errors?: unknown): NextResponse {
  return NextResponse.json(
    { status: 400, code: 'VALIDATION_ERROR', title: 'Bad Request', detail, errors },
    { status: 400 },
  );
}

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
