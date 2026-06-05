import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import type { RequestWithUser } from '../../common/decorators/current-user.decorator';

/**
 * Authorizes requests by checking the authenticated principal holds at least
 * one of the roles required by the route. SUPER_ADMIN passes all role checks.
 * Must run after JwtAuthGuard so the principal is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (user === undefined) {
      throw new ForbiddenException('Authentication required.');
    }

    if (user.roles.includes('SUPER_ADMIN' as RoleName)) {
      return true;
    }

    const allowed = user.roles.some((role) => requiredRoles.includes(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient role for this operation.');
    }
    return true;
  }
}
