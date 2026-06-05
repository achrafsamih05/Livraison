import { firstValueFrom } from 'rxjs';
import { ShipmentStatus, TrackingEventType } from '../../generated/client';
import { TrackingController } from './tracking.controller';
import { TrackingEventsBus } from './tracking-events.bus';
import type { TrackingService } from './tracking.service';

describe('TrackingController', () => {
  let service: jest.Mocked<
    Pick<
      TrackingService,
      | 'createEvent'
      | 'timeline'
      | 'history'
      | 'currentState'
      | 'auditLog'
      | 'synchronize'
      | 'dashboard'
    >
  >;
  let bus: TrackingEventsBus;
  let controller: TrackingController;

  const TENANT = 'tenant-1';
  const SHIPMENT = 'ship-1';

  beforeEach(() => {
    service = {
      createEvent: jest.fn(),
      timeline: jest.fn(),
      history: jest.fn(),
      currentState: jest.fn(),
      auditLog: jest.fn(),
      synchronize: jest.fn(),
      dashboard: jest.fn(),
    };
    bus = new TrackingEventsBus();
    controller = new TrackingController(service as unknown as TrackingService, bus);
  });

  it('creates an event passing tenant, actor, and request context', async () => {
    service.createEvent.mockResolvedValue({ id: 'e1' } as never);
    const dto = { shipmentId: SHIPMENT, trackingNumber: 'LV1', type: TrackingEventType.PICKED_UP };
    await controller.createEvent(
      TENANT,
      'actor1',
      { ipAddress: '1.1.1.1', requestId: 'r1' },
      dto as never,
    );
    expect(service.createEvent).toHaveBeenCalledWith(TENANT, dto, {
      actorId: 'actor1',
      ipAddress: '1.1.1.1',
      requestId: 'r1',
    });
  });

  it('delegates timeline, history, state, and audit', async () => {
    service.timeline.mockResolvedValue([]);
    service.history.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });
    service.currentState.mockResolvedValue({ shipmentId: SHIPMENT } as never);
    service.auditLog.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });

    await controller.timeline(TENANT, SHIPMENT);
    await controller.history(TENANT, SHIPMENT, { limit: 10 });
    await controller.state(TENANT, SHIPMENT);
    await controller.audit(TENANT, SHIPMENT, {});

    expect(service.timeline).toHaveBeenCalledWith(TENANT, SHIPMENT);
    expect(service.history).toHaveBeenCalledWith(TENANT, SHIPMENT, { limit: 10 });
    expect(service.currentState).toHaveBeenCalledWith(TENANT, SHIPMENT);
    expect(service.auditLog).toHaveBeenCalledWith(TENANT, SHIPMENT, {});
  });

  it('delegates sync with actor and request id', async () => {
    service.synchronize.mockResolvedValue({ shipmentId: SHIPMENT } as never);
    await controller.sync(TENANT, 'actor1', { requestId: 'r2' }, SHIPMENT);
    expect(service.synchronize).toHaveBeenCalledWith(TENANT, SHIPMENT, {
      actorId: 'actor1',
      requestId: 'r2',
    });
  });

  it('delegates dashboard', async () => {
    service.dashboard.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });
    await controller.dashboard(TENANT, { status: ShipmentStatus.IN_TRANSIT });
    expect(service.dashboard).toHaveBeenCalledWith(TENANT, { status: ShipmentStatus.IN_TRANSIT });
  });

  it('streams realtime updates for a shipment', async () => {
    const received = firstValueFrom(controller.stream(SHIPMENT));
    bus.publish({
      tenantId: TENANT,
      shipmentId: SHIPMENT,
      trackingNumber: 'LV1',
      eventId: 'e9',
      type: 'DELIVERED',
      statusAfter: 'DELIVERED',
      occurredAt: new Date().toISOString(),
    });
    const msg = await received;
    expect(msg.data.eventId).toBe('e9');
  });
});
