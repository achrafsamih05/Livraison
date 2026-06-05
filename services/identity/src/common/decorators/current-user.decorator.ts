import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RoleName } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: RoleName[];
}

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  tenantId?: string;
  requestId?: string;
};

/**
 * Injects the authenticated principal resolved by JwtAuthGuard into a handler
 * parameter. Returns undefined for unauthenticated requests.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
