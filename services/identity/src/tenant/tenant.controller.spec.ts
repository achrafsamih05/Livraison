import { TenantController } from './tenant.controller';
import type { TenantService } from './tenant.service';
import { TenantStatus } from '@prisma/client';

describe('TenantController', () => {
  let service: jest.Mocked<
    Pick<TenantService, 'create' | 'findAll' | 'findById' | 'update' | 'archive'>
  >;
  let controller: TenantController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
    };
    controller = new TenantController(service as unknown as TenantService);
  });

  it('delegates create to the service', async () => {
    service.create.mockResolvedValue({ id: 't1' } as never);
    await controller.create({ slug: 'acme', name: 'Acme' });
    expect(service.create).toHaveBeenCalledWith({ slug: 'acme', name: 'Acme' });
  });

  it('lists tenants', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('fetches one tenant by id', async () => {
    service.findById.mockResolvedValue({ id: 't1' } as never);
    await controller.findOne('t1');
    expect(service.findById).toHaveBeenCalledWith('t1');
  });

  it('updates a tenant', async () => {
    service.update.mockResolvedValue({ id: 't1', status: TenantStatus.SUSPENDED } as never);
    await controller.update('t1', { status: TenantStatus.SUSPENDED });
    expect(service.update).toHaveBeenCalledWith('t1', { status: TenantStatus.SUSPENDED });
  });

  it('archives a tenant', async () => {
    service.archive.mockResolvedValue({ id: 't1', status: TenantStatus.ARCHIVED } as never);
    await controller.archive('t1');
    expect(service.archive).toHaveBeenCalledWith('t1');
  });
});
