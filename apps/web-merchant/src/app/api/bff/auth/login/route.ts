import { NextResponse } from 'next/server';
import { apiFetch, UpstreamError } from '@/server/api-client';
import { writeSession } from '@/server/session';
import type { SessionUser } from '@/lib/types';
import { loginSchema } from '@/lib/schemas';
import { parseJson, toErrorResponse } from '../../_helpers';

interface LoginResponse {
  user: SessionUser;
  tokens: { accessToken: string; refreshToken: string };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await parseJson<unknown>(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          status: 400,
          code: 'VALIDATION_ERROR',
          title: 'Bad Request',
          detail: 'Invalid credentials payload.',
        },
        { status: 400 },
      );
    }

    const tenantSlug = process.env.DEFAULT_TENANT_SLUG ?? 'demo';
    const result = await apiFetch<LoginResponse>('identity', '/auth/login', {
      method: 'POST',
      anonymous: true,
      headers: { 'x-tenant': tenantSlug },
      body: parsed.data,
    });

    writeSession({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tenantId: result.user.tenantId,
      user: result.user,
    });

    return NextResponse.json({ user: result.user });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return toErrorResponse(error);
    }
    return toErrorResponse(error);
  }
}
