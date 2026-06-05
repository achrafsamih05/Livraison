import { ShipmentStatus } from '../../generated/client';
import { ShipmentController } from './shipment.controller';
import type { ShipmentService } from './shipment.service';

describe('ShipmentController', () => {
  let service: jest.Mocked<
    Pick<
      ShipmentService,
      | 'create'
      | 'list'
      | 'findById'
      | 'findByTrackingNumber'
      | 'history'
      | 'update'
      | 'transition'
      | 'cancel'
    >
  >;
  let controller: ShipmentController;

  const TENANT = 'tenant-1';
  const ACTOR = 'actor-1';

  beforeEach(() => {
    service = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByTrackingNumber: jest.fn(),
      history: jest.fn(),
      update: jest.fn(),
      transition: jest.fn(),
      cancel: jest.fn(),
    };
    controller = new ShipmentController(service as unknown as ShipmentService);
  });

  it('delegates create with tenant and actor', async () => {
    service.create.mockResolvedValue({ id: 's1' } as never);
    const dto = {
      sender: { name: 'A', phone: '+966500000001', line1: 'x', city: 'Riyadh', country: 'SA' },
      recipient: { name: 'B', phone: '+966500000002', line1: 'y', city: 'Jeddah', country: 'SA' },
      weightGrams: 100,
    };
    await controller.create(TENANT, ACTOR, dto as never);
    expect(service.create).toHaveBeenCalledWith(TENANT, dto, ACTOR);
  });

  it('delegates list with query params', async () => {
    service.list.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });
    await controller.list(TENANT, { status: ShipmentStatus.CREATED, limit: 50, offset: 0 });
    expect(service.list).toHaveBeenCalledWith(TENANT, {
      status: ShipmentStatus.CREATED,
      limit: 50,
      offset: 0,
    });
  });

  it('delegates findOne and findByTrackingNumber', async () => {
    service.findById.mockResolvedValue({ id: 's1' } as never);
    service.findByTrackingNumber.mockResolvedValue({ id: 's1' } as never);
    await controller.findOne(TENANT, 's1');
    await controller.findByTrackingNumber(TENANT, 'LV123');
    expect(service.findById).toHaveBeenCalledWith(TENANT, 's1');
    expect(service.findByTrackingNumber).toHaveBeenCalledWith(TENANT, 'LV123');
  });

  it('delegates history', async () => {
    service.history.mockResolvedValue([]);
    await controller.history(TENANT, 's1');
    expect(service.history).toHaveBeenCalledWith(TENANT, 's1');
  });

  it('delegates update', async () => {
    service.update.mockResolvedValue({ id: 's1' } as never);
    await controller.update(TENANT, ACTOR, 's1', { weightGrams: 5 });
    expect(service.update).toHaveBeenCalledWith(TENANT, 's1', { weightGrams: 5 }, ACTOR);
  });

  it('delegates status transition', async () => {
    service.transition.mockResolvedValue({ id: 's1' } as never);
    await controller.transition(TENANT, ACTOR, 's1', {
      status: ShipmentStatus.PICKUP_PENDING,
      reason: 'go',
    });
    expect(service.transition).toHaveBeenCalledWith(
      TENANT,
      's1',
      ShipmentStatus.PICKUP_PENDING,
      'go',
      ACTOR,
    );
  });

  it('delegates cancel', async () => {
    service.cancel.mockResolvedValue({ id: 's1' } as never);
    await controller.cancel(TENANT, ACTOR, 's1', { reason: 'nope' });
    expect(service.cancel).toHaveBeenCalledWith(TENANT, 's1', 'nope', ACTOR);
  });
});
