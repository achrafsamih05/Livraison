import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from '../token.service';
import type { AppConfig } from '../../config/configuration';

const config: AppConfig = {
  env: 'test',
  httpPort: 3001,
  logLevel: 'info',
  databaseUrl: 'postgresql://u:p@localhost:5432/identity',
  redisUrl: 'redis://localhost:6379',
  jwt: {
    accessSecret: 'a'.repeat(32),
    refreshSecret: 'b'.repeat(32),
    accessTtl: 900,
    refreshTtl: 2592000,
    issuer: 'livraison-identity',
    audience: 'livraison-platform',
  },
};

function makeContext(headers: Record<string, string>): {
  ctx: ExecutionContext;
  request: { user?: unknown; tenantId?: string };
} {
  const request: { headers: Record<string, string>; user?: unknown; tenantId?: string } = {
    headers,
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('JwtAuthGuard', () => {
  const reflector = new Reflector();
  const tokens = new TokenService(new JwtService(), config);
  const redis = { exists: jest.fn() };
  const guard = new JwtAuthGuard(reflector, tokens, redis as never);

  beforeEach(() => {
    jest.restoreAllMocks();
    redis.exists.mockReset();
  });

  it('allows public routes without a token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { ctx } = makeContext({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects when the bearer token is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { ctx } = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the principal for a valid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    redis.exists.mockResolvedValue(false);
    const pair = await tokens.issueTokenPair({
      userId: 'u1',
      tenantId: 't1',
      email: 'user@example.com',
      roles: [RoleName.OPERATOR],
    });
    const { ctx, request } = makeContext({ authorization: `Bearer ${pair.accessToken}` });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toMatchObject({ userId: 'u1', tenantId: 't1' });
    expect(request.tenantId).toBe('t1');
  });

  it('rejects a revoked token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    redis.exists.mockResolvedValue(true);
    const pair = await tokens.issueTokenPair({
      userId: 'u1',
      tenantId: 't1',
      email: 'user@example.com',
      roles: [],
    });
    const { ctx } = makeContext({ authorization: `Bearer ${pair.accessToken}` });
    await expect(guard.canActivate(ctx)).rejects.toThrow(/revoked/);
  });

  it('rejects a malformed token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { ctx } = makeContext({ authorization: 'Bearer not-a-jwt' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
