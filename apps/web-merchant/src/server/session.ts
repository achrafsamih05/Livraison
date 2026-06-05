import 'server-only';
import { cookies } from 'next/headers';
import type { SessionUser } from '@/lib/types';

/**
 * Server-only session handling.
 *
 * Tokens are stored in an httpOnly, SameSite=strict, Secure cookie so they are
 * never accessible to client JavaScript (mitigates XSS token theft). The BFF
 * route handlers read this cookie server-side to call upstream services; the
 * browser never sees the access/refresh tokens.
 */
const SESSION_COOKIE = 'lv_session';

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  user: SessionUser;
}

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function readSession(): SessionData | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (raw === undefined) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as SessionData;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.tenantId !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(data: SessionData): void {
  const value = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession(): void {
  cookies().delete(SESSION_COOKIE);
}
