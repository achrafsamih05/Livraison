import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CONFIG_TOKEN, type AppConfig } from '../config/configuration';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { accessRevocationKey } from './auth.constants';
import type { AuthResultDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    @Inject(CONFIG_TOKEN) private readonly config: AppConfig,
  ) {}

  /**
   * Authenticates a user within a tenant and issues a token pair.
   * Uses a constant-ish path to avoid leaking whether the email exists.
   */
  async login(
    tenantSlug: string,
    email: string,
    password: string,
    context: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResultDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (tenant === null || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() } },
    });

    const passwordOk = user !== null && (await this.passwords.verify(user.passwordHash, password));

    if (user === null || !passwordOk) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    const result = await this.issueSession(user, context);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return result;
  }

  /**
   * Rotates a refresh token. Detects reuse of an already-rotated or revoked
   * token and, if found, revokes the entire token family (breach response).
   */
  async refresh(
    refreshToken: string,
    context: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResultDto> {
    try {
      await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokenHash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash } });

    if (session === null) {
      throw new UnauthorizedException('Refresh session not found.');
    }

    if (session.revokedAt !== null) {
      // Reuse of a rotated/revoked token => likely theft. Revoke the family.
      await this.prisma.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Refresh token reuse detected; revoked family ${session.familyId}`);
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh session expired.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (user === null || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    const result = await this.issueSession(user, context, session.familyId);

    // Mark the old session rotated, linking to the replacement for audit.
    const replacement = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: this.tokens.hashToken(result.tokens.refreshToken) },
    });
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedById: replacement?.id ?? null },
    });

    return result;
  }

  /**
   * Logs out a session: revokes the access token (until expiry) and the
   * refresh session.
   */
  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    await this.redis.set(accessRevocationKey(userId, accessToken), '1', this.config.jwt.accessTtl);

    if (refreshToken !== undefined) {
      const tokenHash = this.tokens.hashToken(refreshToken);
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async issueSession(
    user: {
      id: string;
      tenantId: string;
      email: string;
      roles: AuthResultDto['user']['roles'];
      firstName: string;
      lastName: string;
    },
    context: { userAgent?: string; ipAddress?: string },
    familyId?: string,
  ): Promise<AuthResultDto> {
    const pair = await this.tokens.issueTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: user.roles,
      familyId,
    });

    const expiresAt = new Date(Date.now() + pair.refreshExpiresIn * 1000);
    await this.prisma.refreshSession.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: this.tokens.hashToken(pair.refreshToken),
        familyId: pair.familyId,
        userAgent: context.userAgent ?? null,
        ipAddress: context.ipAddress ?? null,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
      tokens: {
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: pair.accessExpiresIn,
      },
    };
  }
}
