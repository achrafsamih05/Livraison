import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { UserService } from './user.service';
import { PasswordService } from '../auth/password.service';

type PrismaMock = {
  user: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
    count: jest.Mock;
  };
};

function buildPrisma(): PrismaMock {
  return {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };
}

const TENANT = 't1';

describe('UserService', () => {
  let prisma: PrismaMock;
  let passwords: PasswordService;
  let service: UserService;

  const safeUser = {
    id: 'u1',
    tenantId: TENANT,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    status: UserStatus.ACTIVE,
    roles: [],
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = buildPrisma();
    passwords = new PasswordService();
    service = new UserService(prisma as never, passwords);
  });

  it('hashes the password and never returns it', async () => {
    jest.spyOn(passwords, 'hash').mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue(safeUser);

    const result = await service.create(TENANT, {
      email: 'User@Example.com',
      password: 'StrongPass123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(passwords.hash).toHaveBeenCalledWith('StrongPass123');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'user@example.com', passwordHash: 'hashed' }),
      }),
    );
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('maps duplicate email to Conflict', async () => {
    jest.spyOn(passwords, 'hash').mockResolvedValue('hashed');
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }),
    );
    await expect(
      service.create(TENANT, {
        email: 'dup@example.com',
        password: 'StrongPass123',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('scopes findById by tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(safeUser);
    await service.findById(TENANT, 'u1');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1', tenantId: TENANT } }),
    );
  });

  it('throws NotFound for a user in another tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findById(TENANT, 'foreign')).rejects.toThrow(NotFoundException);
  });

  it('updates only provided fields within the tenant scope', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findFirst.mockResolvedValue(safeUser);
    await service.update(TENANT, 'u1', { firstName: 'New' });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'u1', tenantId: TENANT },
      data: { firstName: 'New' },
    });
  });

  it('sets status within the tenant scope', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findFirst.mockResolvedValue({ ...safeUser, status: UserStatus.SUSPENDED });
    const result = await service.setStatus(TENANT, 'u1', UserStatus.SUSPENDED);
    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'u1', tenantId: TENANT },
      data: { status: UserStatus.SUSPENDED },
    });
  });

  it('removes a user only within its tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(safeUser);
    prisma.user.deleteMany.mockResolvedValue({ count: 1 });
    await service.remove(TENANT, 'u1');
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({ where: { id: 'u1', tenantId: TENANT } });
  });
});
