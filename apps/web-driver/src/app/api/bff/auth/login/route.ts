import { NextResponse } from 'next/server';
import { apiFetch } from '@/server/api-client';
import { isDriver, writeSession } from '@/server/session';
import type { DriverProfile } from '@/lib/types';
import { loginSchema } from '@/lib/schemas';
import { forbidden, parseJson, toErrorResponse, validationError } from '../../_helpers';

interface LoginResponse {
  user: DriverProfile;
  tokens: { accessToken: string; refreshToken: string };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = loginSchema.safeParse(await parseJson<unknown>(request));
    if (!parsed.success) {
      return validationError('Invalid credentials payload.');
    }

    const tenantSlug = process.env.DEFAULT_TENANT_SLUG ?? 'demo';
    const result = await apiFetch<LoginResponse>('identity', '/auth/login', {
      method: 'POST',
      anonymous: true,
      headers: { 'x-tenant': tenantSlug },
      body: parsed.data,
    });

    if (!isDriver(result.user)) {
      return forbidden();
    }

    writeSession({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tenantId: result.user.tenantId,
      user: result.user,
    });

    return NextResponse.json({ user: result.user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
