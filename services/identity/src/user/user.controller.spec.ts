import { UnauthorizedException } from '@nestjs/common';
import { RoleName, UserStatus } from '@prisma/client';
import { UserController } from './user.controller';
import type { UserService } from './user.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

describe('UserController', () => {
  let service: jest.Mocked<
    Pick<UserService, 'create' | 'findAll' | 'findById' | 'update' | 'setStatus' | 'remove'>
  >;
  let controller: UserController;

  const actor: AuthenticatedUser = {
    userId: 'admin1',
    tenantId: 'tenant-a',
    email: 'admin@example.com',
    roles: [RoleName.TENANT_ADMIN],
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
      remove: jest.fn(),
    };
    controller = new UserController(service as unknown as UserService);
  });

  it('creates a user scoped to the actor tenant, never client input', async () => {
    service.create.mockResolvedValue({ id: 'u2' } as never);
    await controller.create(actor, {
      email: 'new@example.com',
      password: 'StrongPass123',
      firstName: 'New',
      lastName: 'User',
    });
    expect(service.create).toHaveBeenCalledWith('tenant-a', expect.any(Object));
  });

  it('lists users for the actor tenant', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(actor);
    expect(service.findAll).toHaveBeenCalledWith('tenant-a');
  });

  it('resolves the current user via /me using the token principal', async () => {
    service.findById.mockResolvedValue({ id: 'admin1' } as never);
    await controller.me(actor);
    expect(service.findById).toHaveBeenCalledWith('tenant-a', 'admin1');
  });

  it('updates status within the actor tenant scope', async () => {
    service.setStatus.mockResolvedValue({ id: 'u2', status: UserStatus.SUSPENDED } as never);
    await controller.setStatus(actor, 'u2', { status: UserStatus.SUSPENDED });
    expect(service.setStatus).toHaveBeenCalledWith('tenant-a', 'u2', UserStatus.SUSPENDED);
  });

  it('removes a user within the actor tenant scope', async () => {
    service.remove.mockResolvedValue({ id: 'u2' } as never);
    await controller.remove(actor, 'u2');
    expect(service.remove).toHaveBeenCalledWith('tenant-a', 'u2');
  });

  it('rejects sync operations when there is no authenticated principal', () => {
    expect(() => controller.findAll(undefined)).toThrow(UnauthorizedException);
    expect(() => controller.me(undefined)).toThrow(UnauthorizedException);
  });
});
