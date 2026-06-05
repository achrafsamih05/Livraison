import { NotFoundException } from '@nestjs/common';
import { ShipmentStatus, TrackingEventType } from '../../generated/client';
import { TrackingService } from './tracking.service';
import { TrackingEventsBus } from './tracking-events.bus';

type TxMock = {
  trackingEvent: { create: jest.Mock; findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  shipmentTrackingState: { findUnique: jest.Mock; upsert: jest.Mock };
  trackingAuditLog: { create: jest.Mock };
};

type PrismaMock = TxMock & {
  shipmentTrackingState: TxMock['shipmentTrackingState'] & {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  trackingAuditLog: TxMock['trackingAuditLog'] & { findMany: jest.Mock; count: jest.Mock };
  $transaction: jest.Mock;
};

function buildPrisma(): PrismaMock {
  const tx: TxMock = {
    trackingEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    shipmentTrackingState: { findUnique: jest.fn(), upsert: jest.fn() },
    trackingAuditLog: { create: jest.fn() },
  };
  const prisma = {
    trackingEvent: tx.trackingEvent,
    shipmentTrackingState: {
      ...tx.shipmentTrackingState,
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trackingAuditLog: { ...tx.trackingAuditLog, findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaMock;

  // $transaction supports both the callback form (createEvent/sync) and the
  // array form (paginated reads).
  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (client: unknown) => unknown)(prisma);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return undefined;
  });

  return prisma;
}

const TENANT = '00000000-0000-4000-8000-000000000001';
const SHIPMENT = '00000000-0000-4000-8000-0000000000s1'.replace('s1', 'a1');

describe('TrackingService', () => {
  let prisma: PrismaMock;
  let bus: TrackingEventsBus;
  let service: TrackingService;

  beforeEach(() => {
    prisma = buildPrisma();
    bus = new TrackingEventsBus();
    service = new TrackingService(prisma as never, bus);
  });

  describe('createEvent', () => {
    const dto = {
      shipmentId: SHIPMENT,
      trackingNumber: 'lv123',
      type: TrackingEventType.PICKED_UP,
    };

    it('appends an event, projects status, audits, and publishes realtime', async () => {
      const created = {
        id: 'e1',
        shipmentId: SHIPMENT,
        trackingNumber: 'LV123',
        type: TrackingEventType.PICKED_UP,
        statusAfter: ShipmentStatus.PICKED_UP,
        occurredAt: new Date('2026-06-05T10:00:00Z'),
      };
      prisma.trackingEvent.create.mockResolvedValue(created);
      prisma.shipmentTrackingState.findUnique.mockResolvedValue(null);
      prisma.shipmentTrackingState.upsert.mockResolvedValue({});
      prisma.trackingAuditLog.create.mockResolvedValue({});

      const publishSpy = jest.spyOn(bus, 'publish');
      const result = await service.createEvent(TENANT, dto, { actorId: 'actor1', requestId: 'r1' });

      expect(result.id).toBe('e1');
      // tracking number normalized to uppercase
      expect(prisma.trackingEvent.create.mock.calls[0][0].data.trackingNumber).toBe('LV123');
      // status derived from event type
      expect(prisma.trackingEvent.create.mock.calls[0][0].data.statusAfter).toBe(
        ShipmentStatus.PICKED_UP,
      );
      // projection + audit written
      expect(prisma.shipmentTrackingState.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.trackingAuditLog.create).toHaveBeenCalledTimes(1);
      // realtime published
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'e1', statusAfter: ShipmentStatus.PICKED_UP }),
      );
    });

    it('records a NOTE event without changing the projected status', async () => {
      const created = {
        id: 'e2',
        shipmentId: SHIPMENT,
        trackingNumber: 'LV123',
        type: TrackingEventType.NOTE,
        statusAfter: null,
        occurredAt: new Date('2026-06-05T11:00:00Z'),
      };
      prisma.trackingEvent.create.mockResolvedValue(created);
      prisma.shipmentTrackingState.findUnique.mockResolvedValue({
        currentStatus: ShipmentStatus.IN_TRANSIT,
        lastOccurredAt: new Date('2026-06-05T10:00:00Z'),
      });
      prisma.shipmentTrackingState.upsert.mockResolvedValue({});
      prisma.trackingAuditLog.create.mockResolvedValue({});

      await service.createEvent(
        TENANT,
        { shipmentId: SHIPMENT, trackingNumber: 'LV123', type: TrackingEventType.NOTE },
        {},
      );

      const upsertArg = prisma.shipmentTrackingState.upsert.mock.calls[0][0];
      // newer event => status kept as prior IN_TRANSIT (not regressed/cleared)
      expect(upsertArg.update.currentStatus).toBe(ShipmentStatus.IN_TRANSIT);
      expect(prisma.trackingEvent.create.mock.calls[0][0].data.statusAfter).toBeUndefined();
    });

    it('does not regress state for an out-of-order older event', async () => {
      const created = {
        id: 'e3',
        shipmentId: SHIPMENT,
        trackingNumber: 'LV123',
        type: TrackingEventType.ARRIVED_AT_HUB,
        statusAfter: ShipmentStatus.IN_TRANSIT,
        occurredAt: new Date('2026-06-01T00:00:00Z'),
      };
      prisma.trackingEvent.create.mockResolvedValue(created);
      prisma.shipmentTrackingState.findUnique.mockResolvedValue({
        currentStatus: ShipmentStatus.DELIVERED,
        lastOccurredAt: new Date('2026-06-05T00:00:00Z'),
      });
      prisma.shipmentTrackingState.upsert.mockResolvedValue({});
      prisma.trackingAuditLog.create.mockResolvedValue({});

      await service.createEvent(
        TENANT,
        {
          shipmentId: SHIPMENT,
          trackingNumber: 'LV123',
          type: TrackingEventType.ARRIVED_AT_HUB,
          occurredAt: '2026-06-01T00:00:00Z',
        },
        {},
      );

      const upsertArg = prisma.shipmentTrackingState.upsert.mock.calls[0][0];
      // older event: only increments count, does not overwrite status/last fields
      expect(upsertArg.update.currentStatus).toBeUndefined();
      expect(upsertArg.update.eventCount).toEqual({ increment: 1 });
    });
  });

  describe('timeline', () => {
    it('returns events chronologically', async () => {
      prisma.trackingEvent.findMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      const result = await service.timeline(TENANT, SHIPMENT);
      expect(result).toHaveLength(2);
      expect(prisma.trackingEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, shipmentId: SHIPMENT },
        orderBy: { occurredAt: 'asc' },
      });
    });

    it('throws NotFound when no events and no tracking state exist', async () => {
      prisma.trackingEvent.findMany.mockResolvedValue([]);
      prisma.shipmentTrackingState.findFirst.mockResolvedValue(null);
      await expect(service.timeline(TENANT, SHIPMENT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('publicTimeline', () => {
    it('returns minimized public events and writes a READ audit', async () => {
      prisma.shipmentTrackingState.findUnique.mockResolvedValue({
        currentStatus: ShipmentStatus.OUT_FOR_DELIVERY,
        lastOccurredAt: new Date('2026-06-05T12:00:00Z'),
      });
      prisma.trackingEvent.findMany.mockResolvedValue([
        {
          type: TrackingEventType.PICKED_UP,
          statusAfter: ShipmentStatus.PICKED_UP,
          description: null,
          location: 'Riyadh',
          occurredAt: new Date(),
        },
      ]);
      prisma.trackingAuditLog.create.mockResolvedValue({});

      const result = await service.publicTimeline(TENANT, 'lv123', { ipAddress: '1.2.3.4' });

      expect(result.currentStatus).toBe(ShipmentStatus.OUT_FOR_DELIVERY);
      expect(result.events).toHaveLength(1);
      // only public events requested
      expect(prisma.trackingEvent.findMany.mock.calls[0][0].where.isPublic).toBe(true);
      expect(prisma.trackingAuditLog.create).toHaveBeenCalledTimes(1);
    });

    it('throws NotFound for an unknown tracking number', async () => {
      prisma.shipmentTrackingState.findUnique.mockResolvedValue(null);
      await expect(service.publicTimeline(TENANT, 'nope', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('history', () => {
    it('filters by type and date range with pagination', async () => {
      prisma.trackingEvent.findMany.mockResolvedValue([{ id: 'e1' }]);
      prisma.trackingEvent.count.mockResolvedValue(1);
      const result = await service.history(TENANT, SHIPMENT, {
        type: TrackingEventType.FAILED,
        from: '2026-06-01T00:00:00Z',
        to: '2026-06-30T00:00:00Z',
        limit: 25,
        offset: 0,
      });
      expect(result.total).toBe(1);
      const where = prisma.trackingEvent.findMany.mock.calls[0][0].where;
      expect(where.type).toBe(TrackingEventType.FAILED);
      expect(where.occurredAt.gte).toBeInstanceOf(Date);
      expect(where.occurredAt.lte).toBeInstanceOf(Date);
    });
  });

  describe('dashboard', () => {
    it('filters projected states by status and recency', async () => {
      prisma.shipmentTrackingState.findMany.mockResolvedValue([{ shipmentId: SHIPMENT }]);
      prisma.shipmentTrackingState.count.mockResolvedValue(1);
      const result = await service.dashboard(TENANT, {
        status: ShipmentStatus.IN_TRANSIT,
        updatedSince: '2026-06-01T00:00:00Z',
      });
      expect(result.items).toHaveLength(1);
      const where = prisma.shipmentTrackingState.findMany.mock.calls[0][0].where;
      expect(where.currentStatus).toBe(ShipmentStatus.IN_TRANSIT);
      expect(where.lastOccurredAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('synchronize', () => {
    it('re-derives status from the latest status-bearing event', async () => {
      prisma.trackingEvent.findFirst.mockResolvedValue({
        id: 'e9',
        trackingNumber: 'LV123',
        type: TrackingEventType.DELIVERED,
        statusAfter: ShipmentStatus.DELIVERED,
        occurredAt: new Date('2026-06-05T15:00:00Z'),
      });
      prisma.trackingEvent.count.mockResolvedValue(7);
      prisma.shipmentTrackingState.upsert.mockResolvedValue({
        shipmentId: SHIPMENT,
        currentStatus: ShipmentStatus.DELIVERED,
      });
      prisma.trackingAuditLog.create.mockResolvedValue({});

      const result = await service.synchronize(TENANT, SHIPMENT, { actorId: 'admin' });
      expect(result.currentStatus).toBe(ShipmentStatus.DELIVERED);
      expect(prisma.trackingAuditLog.create).toHaveBeenCalledTimes(1);
    });

    it('throws NotFound when there are no status-bearing events', async () => {
      prisma.trackingEvent.findFirst.mockResolvedValue(null);
      await expect(service.synchronize(TENANT, SHIPMENT, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('currentState', () => {
    it('returns the projected state', async () => {
      prisma.shipmentTrackingState.findFirst.mockResolvedValue({ shipmentId: SHIPMENT });
      const result = await service.currentState(TENANT, SHIPMENT);
      expect(result.shipmentId).toBe(SHIPMENT);
    });

    it('throws NotFound when absent', async () => {
      prisma.shipmentTrackingState.findFirst.mockResolvedValue(null);
      await expect(service.currentState(TENANT, SHIPMENT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('auditLog', () => {
    it('returns a paginated audit log', async () => {
      prisma.trackingAuditLog.findMany.mockResolvedValue([{ id: 'a1' }]);
      prisma.trackingAuditLog.count.mockResolvedValue(1);
      const result = await service.auditLog(TENANT, SHIPMENT, { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(prisma.trackingAuditLog.findMany.mock.calls[0][0].where).toMatchObject({
        tenantId: TENANT,
        shipmentId: SHIPMENT,
      });
    });
  });
});
