import 'server-only';
import { NextResponse } from 'next/server';
import { UpstreamError } from '@/server/api-client';

/** Converts thrown errors into a problem+json response with the right status. */
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

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
