import 'server-only';
import { isAdmin, readSession, type SessionData } from './session';

export type GuardResult =
  | { ok: true; session: SessionData }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

/**
 * Server-side authorization guard for BFF routes: requires an active session
 * and a platform admin role. Centralized so every privileged handler enforces
 * the same check (defense in depth alongside upstream RBAC).
 */
export function requireAdmin(): GuardResult {
  const session = readSession();
  if (session === null) {
    return { ok: false, reason: 'unauthenticated' };
  }
  if (!isAdmin(session.user)) {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, session };
}
