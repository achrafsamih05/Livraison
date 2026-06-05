import { createHash } from 'node:crypto';

/**
 * Redis key for an access-token revocation entry. The token itself is hashed
 * so raw tokens are never stored in Redis.
 */
export function accessRevocationKey(userId: string, token: string): string {
  const fingerprint = createHash('sha256').update(token).digest('hex');
  return `revoked:access:${userId}:${fingerprint}`;
}
