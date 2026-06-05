import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, ShipmentStatus } from '../../generated/client';
import { ShipmentService } from './shipment.service';
import type { CreateShipmentDto } from './dto/create-shipment.dto';

type PrismaMock = {
  shipment: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  shipmentStatusHistory: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    shipment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    shipmentStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    // Default: execute the array of prepared promises (Prisma batch semantics).
    $transaction: jest.fn((ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return (ops as () => unknown)();
    }),
  };
  return prisma;
}

const TENANT = '00000000-0000-4000-8000-000000000001';
const ACTOR = '00000000-0000-4000-8000-0000000000aa';

const validDto: CreateShipmentDto = {
  sender: { name: 'Acme', phone: '+966500000001', line1: '1 St', city: 'Riyadh', country: 'SA' },
  recipient: { name: 'Jane', phone: '+966500000002', line1: '2 St', city: 'Jeddah', country: 'SA' },
  weightGrams: 1000,
};

function shipment(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 's1',
    tenantId: TENANT,
    trackingNumber: 'LV1234567890XSA',
    status: ShipmentStatus.CREATED,
    ...overrides,
  };
}

describe('ShipmentService', () => {
  let prisma: PrismaMock;
  let service: ShipmentService;

  beforeEach(() => {
    prisma = buildPrisma();
    service = new ShipmentService(prisma as never, { prefix: 'LV', country: 'SA' });
  });

  describe('create', () => {
    it('creates a shipment with a tracking number and initial history', async () => {
      prisma.shipment.create.mockResolvedValue(shipment());
      const result = await service.create(TENANT, validDto, ACTOR);

      expect(result.trackingNumber).toMatch(/^LV\d{10}[0-9X]SA$/);
      const arg = prisma.shipment.create.mock.calls[0][0];
      expect(arg.data.tenantId).toBe(TENANT);
      expect(arg.data.status).toBe(ShipmentStatus.CREATED);
      expect(arg.data.history.create.toStatus).toBe(ShipmentStatus.CREATED);
      expect(arg.data.history.create.fromStatus).toBeNull();
      expect(arg.data.senderCountry).toBe('SA');
    });

    it('retries on a tracking-number unique collision then succeeds', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      });
      prisma.shipment.create.mockRejectedValueOnce(p2002).mockResolvedValueOnce(shipment());

      const result = await service.create(TENANT, validDto);
      expect(result).toBeDefined();
      expect(prisma.shipment.create).toHaveBeenCalledTimes(2);
    });

    it('coerces decimals and currency casing', async () => {
      prisma.shipment.create.mockResolvedValue(shipment());
      await service.create(TENANT, { ...validDto, codAmount: 199.5, currency: 'sar' });
      const arg = prisma.shipment.create.mock.calls[0][0];
      expect(arg.data.currency).toBe('SAR');
      expect(arg.data.codAmount).toBeInstanceOf(Prisma.Decimal);
      expect(arg.data.codAmount.toString()).toBe('199.5');
    });

    it('gives up after exhausting tracking-number retries on persistent collisions', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      });
      prisma.shipment.create.mockRejectedValue(p2002);
      await expect(service.create(TENANT, validDto)).rejects.toThrow(/unique tracking number/i);
      expect(prisma.shipment.create).toHaveBeenCalledTimes(5);
    });

    it('rethrows non-unique database errors immediately', async () => {
      prisma.shipment.create.mockRejectedValue(new Error('connection lost'));
      await expect(service.create(TENANT, validDto)).rejects.toThrow('connection lost');
      expect(prisma.shipment.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns a tenant-scoped, non-deleted shipment', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment());
      const result = await service.findById(TENANT, 's1');
      expect(result.id).toBe('s1');
      expect(prisma.shipment.findFirst).toHaveBeenCalledWith({
        where: { id: 's1', tenantId: TENANT, deletedAt: null },
      });
    });

    it('throws NotFound when missing or in another tenant', async () => {
      prisma.shipment.findFirst.mockResolvedValue(null);
      await expect(service.findById(TENANT, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTrackingNumber', () => {
    it('returns the matching shipment within the tenant', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment());
      const result = await service.findByTrackingNumber(TENANT, 'LV1234567890XSA');
      expect(result.id).toBe('s1');
      expect(prisma.shipment.findFirst).toHaveBeenCalledWith({
        where: { trackingNumber: 'LV1234567890XSA', tenantId: TENANT, deletedAt: null },
      });
    });

    it('throws NotFound for an unknown tracking number', async () => {
      prisma.shipment.findFirst.mockResolvedValue(null);
      await expect(service.findByTrackingNumber(TENANT, 'LVxxx')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('paginates and filters by status within the tenant', async () => {
      prisma.shipment.findMany.mockResolvedValue([shipment()]);
      prisma.shipment.count.mockResolvedValue(1);
      const result = await service.list(TENANT, {
        status: ShipmentStatus.CREATED,
        limit: 10,
        offset: 0,
      });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      const findArg = prisma.shipment.findMany.mock.calls[0][0];
      expect(findArg.where).toMatchObject({
        tenantId: TENANT,
        deletedAt: null,
        status: ShipmentStatus.CREATED,
      });
      expect(findArg.take).toBe(10);
    });
  });

  describe('update', () => {
    it('updates editable fields when pre-pickup', async () => {
      prisma.shipment.findFirst
        .mockResolvedValueOnce(shipment({ status: ShipmentStatus.CREATED }))
        .mockResolvedValueOnce(shipment({ status: ShipmentStatus.CREATED, weightGrams: 2000 }));
      prisma.shipment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update(TENANT, 's1', { weightGrams: 2000 }, ACTOR);
      expect(result).toBeDefined();
      const updArg = prisma.shipment.updateMany.mock.calls[0][0];
      expect(updArg.where).toEqual({ id: 's1', tenantId: TENANT });
      expect(updArg.data.weightGrams).toBe(2000);
    });

    it('rejects edits once the shipment has left pre-pickup states', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment({ status: ShipmentStatus.IN_TRANSIT }));
      await expect(service.update(TENANT, 's1', { weightGrams: 5 })).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.shipment.updateMany).not.toHaveBeenCalled();
    });

    it('maps all editable fields including nested parties and decimals', async () => {
      prisma.shipment.findFirst
        .mockResolvedValueOnce(shipment({ status: ShipmentStatus.CREATED }))
        .mockResolvedValueOnce(shipment({ status: ShipmentStatus.CREATED }));
      prisma.shipment.updateMany.mockResolvedValue({ count: 1 });

      await service.update(
        TENANT,
        's1',
        {
          sender: {
            name: 'New',
            phone: '+966500000003',
            line1: '9 St',
            city: 'Dammam',
            country: 'sa',
          },
          recipient: {
            name: 'Rec',
            phone: '+966500000004',
            line1: '10 St',
            city: 'Mecca',
            country: 'sa',
          },
          service: undefined,
          weightGrams: 750,
          codAmount: 50.25,
          declaredValue: 99.99,
          reference: 'REF-1',
          notes: 'fragile',
        },
        ACTOR,
      );

      const data = prisma.shipment.updateMany.mock.calls[0][0].data;
      expect(data.senderName).toBe('New');
      expect(data.senderCountry).toBe('SA');
      expect(data.recipientCity).toBe('Mecca');
      expect(data.weightGrams).toBe(750);
      expect(data.codAmount.toString()).toBe('50.25');
      expect(data.declaredValue.toString()).toBe('99.99');
      expect(data.reference).toBe('REF-1');
      expect(data.notes).toBe('fragile');
    });
  });

  describe('transition', () => {
    it('applies a legal transition and records history atomically', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment({ status: ShipmentStatus.CREATED }));
      prisma.shipment.update.mockResolvedValue(shipment({ status: ShipmentStatus.PICKUP_PENDING }));
      prisma.shipmentStatusHistory.create.mockResolvedValue({ id: 'h1' });

      const result = await service.transition(
        TENANT,
        's1',
        ShipmentStatus.PICKUP_PENDING,
        'go',
        ACTOR,
      );
      expect(result.status).toBe(ShipmentStatus.PICKUP_PENDING);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const histArg = prisma.shipmentStatusHistory.create.mock.calls[0][0];
      expect(histArg.data.fromStatus).toBe(ShipmentStatus.CREATED);
      expect(histArg.data.toStatus).toBe(ShipmentStatus.PICKUP_PENDING);
    });

    it('rejects an illegal transition', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment({ status: ShipmentStatus.CREATED }));
      await expect(service.transition(TENANT, 's1', ShipmentStatus.DELIVERED)).rejects.toThrow(
        /Illegal status transition/,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a no-op transition to the same status', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment({ status: ShipmentStatus.CREATED }));
      await expect(service.transition(TENANT, 's1', ShipmentStatus.CREATED)).rejects.toThrow(
        /already in status/,
      );
    });
  });

  describe('cancel', () => {
    it('cancels when permitted', async () => {
      prisma.shipment.findFirst.mockResolvedValue(
        shipment({ status: ShipmentStatus.PICKUP_PENDING }),
      );
      prisma.shipment.update.mockResolvedValue(shipment({ status: ShipmentStatus.CANCELLED }));
      prisma.shipmentStatusHistory.create.mockResolvedValue({ id: 'h1' });

      const result = await service.cancel(TENANT, 's1', 'customer changed mind', ACTOR);
      expect(result.status).toBe(ShipmentStatus.CANCELLED);
    });

    it('refuses to cancel once in transit', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment({ status: ShipmentStatus.IN_TRANSIT }));
      await expect(service.cancel(TENANT, 's1')).rejects.toThrow(/cannot be cancelled/);
    });
  });

  describe('history', () => {
    it('returns ordered history for an existing shipment', async () => {
      prisma.shipment.findFirst.mockResolvedValue(shipment());
      prisma.shipmentStatusHistory.findMany.mockResolvedValue([{ id: 'h1' }, { id: 'h2' }]);
      const result = await service.history(TENANT, 's1');
      expect(result).toHaveLength(2);
      expect(prisma.shipmentStatusHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, shipmentId: 's1' },
        orderBy: { occurredAt: 'asc' },
      });
    });
  });
});
