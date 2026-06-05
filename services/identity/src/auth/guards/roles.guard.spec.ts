import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

function makeContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const user = (roles: RoleName[]): AuthenticatedUser => ({
    userId: 'u1',
    tenantId: 't1',
    email: 'u@example.com',
    roles,
  });

  it('allows when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeContext(user([])))).toBe(true);
  });

  it('allows when the user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.MANAGER]);
    expect(guard.canActivate(makeContext(user([RoleName.MANAGER])))).toBe(true);
  });

  it('allows SUPER_ADMIN regardless of required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.FINANCE]);
    expect(guard.canActivate(makeContext(user([RoleName.SUPER_ADMIN])))).toBe(true);
  });

  it('denies when the user lacks all required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.FINANCE]);
    expect(() => guard.canActivate(makeContext(user([RoleName.OPERATOR])))).toThrow(
      ForbiddenException,
    );
  });

  it('denies when there is no authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.OPERATOR]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
