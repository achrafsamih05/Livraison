import { firstValueFrom } from 'rxjs';
import { PublicTrackingController } from './public-tracking.controller';
import { TrackingEventsBus } from './tracking-events.bus';
import type { TrackingService } from './tracking.service';

describe('PublicTrackingController', () => {
  let service: jest.Mocked<Pick<TrackingService, 'publicTimeline'>>;
  let bus: TrackingEventsBus;
  let controller: PublicTrackingController;

  const TENANT = 'tenant-1';

  beforeEach(() => {
    service = { publicTimeline: jest.fn() };
    bus = new TrackingEventsBus();
    controller = new PublicTrackingController(service as unknown as TrackingService, bus);
  });

  it('delegates public lookup with request context', async () => {
    service.publicTimeline.mockResolvedValue({ trackingNumber: 'LV1' } as never);
    await controller.track(TENANT, { ipAddress: '9.9.9.9', requestId: 'r1' }, 'lv1');
    expect(service.publicTimeline).toHaveBeenCalledWith(TENANT, 'lv1', {
      ipAddress: '9.9.9.9',
      requestId: 'r1',
    });
  });

  it('streams public updates filtered by tenant and uppercased tracking number', async () => {
    const received = firstValueFrom(controller.stream(TENANT, 'lv1'));
    bus.publish({
      tenantId: TENANT,
      shipmentId: 's1',
      trackingNumber: 'LV1',
      eventId: 'e1',
      type: 'OUT_FOR_DELIVERY',
      statusAfter: 'OUT_FOR_DELIVERY',
      occurredAt: new Date().toISOString(),
    });
    const msg = await received;
    expect(msg.data.eventId).toBe('e1');
  });
});
