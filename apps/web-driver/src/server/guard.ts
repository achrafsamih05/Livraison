import 'server-only';
import { isDriver, readSession, type SessionData } from './session';

export type GuardResult =
  | { ok: true; session: SessionData }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

/** Requires an active session held by a DRIVER-role principal. */
export function requireDriver(): GuardResult {
  const session = readSession();
  if (session === null) {
    return { ok: false, reason: 'unauthenticated' };
  }
  if (!isDriver(session.user)) {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, session };
}
