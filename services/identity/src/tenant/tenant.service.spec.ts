import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantService } from './tenant.service';

type PrismaMock = {
  tenant: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function buildPrisma(): PrismaMock {
  return {
    tenant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('TenantService', () => {
  let prisma: PrismaMock;
  let service: TenantService;

  beforeEach(() => {
    prisma = buildPrisma();
    service = new TenantService(prisma as never);
  });

  it('creates a tenant', async () => {
    prisma.tenant.create.mockResolvedValue({ id: 't1', slug: 'acme', name: 'Acme' });
    const result = await service.create({ slug: 'acme', name: 'Acme' });
    expect(result.slug).toBe('acme');
    expect(prisma.tenant.create).toHaveBeenCalledWith({
      data: { slug: 'acme', name: 'Acme', config: {} },
    });
  });

  it('maps unique-constraint violations to a Conflict', async () => {
    prisma.tenant.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      }),
    );
    await expect(service.create({ slug: 'acme', name: 'Acme' })).rejects.toThrow(ConflictException);
  });

  it('throws NotFound when a tenant is missing', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates only provided fields', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 't1' });
    prisma.tenant.update.mockResolvedValue({ id: 't1', name: 'New' });
    await service.update('t1', { name: 'New' });
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { name: 'New' },
    });
  });

  it('archives a tenant by setting status', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 't1' });
    prisma.tenant.update.mockResolvedValue({ id: 't1', status: 'ARCHIVED' });
    const result = await service.archive('t1');
    expect(result.status).toBe('ARCHIVED');
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: 'ARCHIVED' },
    });
  });
});
