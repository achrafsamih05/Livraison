import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleName, UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type { AppConfig } from '../config/configuration';

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

type PrismaMock = {
  tenant: { findUnique: jest.Mock };
  user: { findUnique: jest.Mock; update: jest.Mock };
  refreshSession: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

function buildPrisma(): PrismaMock {
  return {
    tenant: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe('AuthService', () => {
  let prisma: PrismaMock;
  let redis: { set: jest.Mock; exists: jest.Mock };
  let passwords: PasswordService;
  let tokens: TokenService;
  let service: AuthService;

  const activeTenant = { id: 't1', slug: 'acme', status: 'ACTIVE' };
  const activeUser = {
    id: 'u1',
    tenantId: 't1',
    email: 'user@example.com',
    passwordHash: 'hash',
    firstName: 'Test',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    roles: [RoleName.OPERATOR],
  };

  beforeEach(() => {
    prisma = buildPrisma();
    redis = { set: jest.fn(), exists: jest.fn() };
    passwords = new PasswordService();
    tokens = new TokenService(new JwtService(), config);
    service = new AuthService(prisma as never, redis as never, passwords, tokens, config);
  });

  describe('login', () => {
    it('issues tokens and persists a refresh session for valid credentials', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshSession.create.mockResolvedValue({ id: 's1' });
      prisma.user.update.mockResolvedValue(activeUser);
      jest.spyOn(passwords, 'verify').mockResolvedValue(true);

      const result = await service.login('acme', 'user@example.com', 'secret', {});

      expect(result.user.id).toBe('u1');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.refreshSession.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('rejects an unknown tenant without revealing details', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.login('nope', 'a@b.com', 'x', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an invalid password', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      prisma.user.findUnique.mockResolvedValue(activeUser);
      jest.spyOn(passwords, 'verify').mockResolvedValue(false);
      await expect(service.login('acme', 'user@example.com', 'bad', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a non-active account', async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
      prisma.user.findUnique.mockResolvedValue({ ...activeUser, status: UserStatus.SUSPENDED });
      jest.spyOn(passwords, 'verify').mockResolvedValue(true);
      await expect(service.login('acme', 'user@example.com', 'secret', {})).rejects.toThrow(
        /not active/,
      );
    });
  });

  describe('refresh', () => {
    it('detects reuse of a revoked token and revokes the family', async () => {
      const pair = await tokens.issueTokenPair({
        userId: 'u1',
        tenantId: 't1',
        email: 'user@example.com',
        roles: [RoleName.OPERATOR],
      });
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 's1',
        familyId: pair.familyId,
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.refresh(pair.refreshToken, {})).rejects.toThrow(/revoked/);
      expect(prisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { familyId: pair.familyId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('rotates a valid token and revokes the previous session', async () => {
      const pair = await tokens.issueTokenPair({
        userId: 'u1',
        tenantId: 't1',
        email: 'user@example.com',
        roles: [RoleName.OPERATOR],
      });
      prisma.refreshSession.findUnique
        .mockResolvedValueOnce({
          id: 's1',
          familyId: pair.familyId,
          userId: 'u1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 100000),
        })
        .mockResolvedValueOnce({ id: 's2' });
      prisma.user.findUnique.mockResolvedValue(activeUser);
      prisma.refreshSession.create.mockResolvedValue({ id: 's2' });
      prisma.refreshSession.update.mockResolvedValue({ id: 's1' });

      const result = await service.refresh(pair.refreshToken, {});

      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.refreshSession.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { revokedAt: expect.any(Date), replacedById: 's2' },
      });
    });

    it('rejects an unknown session', async () => {
      const pair = await tokens.issueTokenPair({
        userId: 'u1',
        tenantId: 't1',
        email: 'user@example.com',
        roles: [RoleName.OPERATOR],
      });
      prisma.refreshSession.findUnique.mockResolvedValue(null);
      await expect(service.refresh(pair.refreshToken, {})).rejects.toThrow(/not found/);
    });
  });

  describe('logout', () => {
    it('revokes the access token and refresh session', async () => {
      prisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('u1', 'access-token-value', 'refresh-token-value');
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('revoked:access:u1:'),
        '1',
        900,
      );
      expect(prisma.refreshSession.updateMany).toHaveBeenCalled();
    });
  });
});
