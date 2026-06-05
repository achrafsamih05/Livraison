import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import type { AppConfig } from '../config/configuration';
import { RoleName } from '@prisma/client';

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

describe('TokenService', () => {
  const service = new TokenService(new JwtService(), config);

  const params = {
    userId: '11111111-1111-1111-1111-111111111111',
    tenantId: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    roles: [RoleName.OPERATOR],
  };

  it('issues a verifiable access token with authorization claims', async () => {
    const pair = await service.issueTokenPair(params);
    const claims = await service.verifyAccessToken(pair.accessToken);
    expect(claims.sub).toBe(params.userId);
    expect(claims.tid).toBe(params.tenantId);
    expect(claims.email).toBe(params.email);
    expect(claims.roles).toEqual([RoleName.OPERATOR]);
  });

  it('issues a refresh token carrying a family id and jti', async () => {
    const pair = await service.issueTokenPair(params);
    const claims = await service.verifyRefreshToken(pair.refreshToken);
    expect(claims.sub).toBe(params.userId);
    expect(claims.fid).toBe(pair.familyId);
    expect(claims.jti).toBe(pair.refreshTokenId);
  });

  it('preserves the family id across rotation', async () => {
    const first = await service.issueTokenPair(params);
    const rotated = await service.issueTokenPair({ ...params, familyId: first.familyId });
    expect(rotated.familyId).toBe(first.familyId);
    expect(rotated.refreshTokenId).not.toBe(first.refreshTokenId);
  });

  it('rejects an access token verified with the refresh secret', async () => {
    const pair = await service.issueTokenPair(params);
    await expect(service.verifyRefreshToken(pair.accessToken)).rejects.toBeDefined();
  });

  it('hashes tokens deterministically and irreversibly', () => {
    const h1 = service.hashToken('token-value');
    const h2 = service.hashToken('token-value');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).not.toContain('token-value');
  });
});
