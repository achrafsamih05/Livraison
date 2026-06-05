import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import type { RequestWithUser } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../redis/redis.service';
import { TokenService } from '../token.service';
import { accessRevocationKey } from '../auth.constants';

/**
 * Authenticates requests by validating the Bearer access token, checks the
 * token has not been revoked (logout / forced revocation), and attaches the
 * resolved principal and tenant to the request. Routes decorated with
 * @Public() bypass authentication.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (token === undefined) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    let claims;
    try {
      claims = await this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const revoked = await this.redis.exists(accessRevocationKey(claims.sub, token));
    if (revoked) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    request.user = {
      userId: claims.sub,
      tenantId: claims.tid,
      email: claims.email,
      roles: claims.roles ?? [],
    };
    request.tenantId = claims.tid;
    return true;
  }

  private extractBearerToken(header: string | undefined): string | undefined {
    if (header === undefined) {
      return undefined;
    }
    const [scheme, value] = header.split(' ');
    if (scheme !== 'Bearer' || value === undefined || value.trim() === '') {
      return undefined;
    }
    return value.trim();
  }
}
