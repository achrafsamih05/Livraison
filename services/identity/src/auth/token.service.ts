import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RoleName } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { CONFIG_TOKEN, type AppConfig } from '../config/configuration';

export interface AccessTokenClaims {
  sub: string;
  tid: string;
  email: string;
  roles: RoleName[];
}

export interface RefreshTokenClaims {
  sub: string;
  tid: string;
  fid: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  familyId: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

/**
 * Issues and verifies access and refresh JWTs. Access tokens are short-lived
 * and carry authorization claims; refresh tokens are long-lived, opaque to
 * clients in practice, and tracked server-side by a hash of the token so they
 * can be revoked and rotated (refresh-token rotation with family detection).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(CONFIG_TOKEN) private readonly config: AppConfig,
  ) {}

  async issueTokenPair(params: {
    userId: string;
    tenantId: string;
    email: string;
    roles: RoleName[];
    familyId?: string;
  }): Promise<TokenPair> {
    const familyId = params.familyId ?? randomUUID();
    const jti = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { tid: params.tenantId, email: params.email, roles: params.roles } satisfies Omit<
        AccessTokenClaims,
        'sub'
      >,
      {
        subject: params.userId,
        secret: this.config.jwt.accessSecret,
        expiresIn: this.config.jwt.accessTtl,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { tid: params.tenantId, fid: familyId, jti } satisfies Omit<RefreshTokenClaims, 'sub'>,
      {
        subject: params.userId,
        secret: this.config.jwt.refreshSecret,
        expiresIn: this.config.jwt.refreshTtl,
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenId: jti,
      familyId,
      accessExpiresIn: this.config.jwt.accessTtl,
      refreshExpiresIn: this.config.jwt.refreshTtl,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token, {
      secret: this.config.jwt.accessSecret,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
    return this.jwt.verifyAsync<RefreshTokenClaims>(token, {
      secret: this.config.jwt.refreshSecret,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience,
    });
  }

  /**
   * Deterministic, non-reversible fingerprint of a refresh token, stored in
   * the database so the raw token never persists at rest.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
