import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to principals holding at least one of the given roles.
 * Enforced by RolesGuard.
 */
export const Roles = (...roles: RoleName[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
