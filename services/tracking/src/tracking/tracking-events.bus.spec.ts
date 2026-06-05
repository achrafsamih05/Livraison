import { firstValueFrom } from 'rxjs';
import { TrackingEventsBus, type TrackingUpdate } from './tracking-events.bus';

function update(overrides: Partial<TrackingUpdate> = {}): TrackingUpdate {
  return {
    tenantId: 't1',
    shipmentId: 's1',
    trackingNumber: 'LV1',
    eventId: 'e1',
    type: 'PICKED_UP',
    statusAfter: 'PICKED_UP',
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('TrackingEventsBus', () => {
  it('delivers updates for the matching shipment only', async () => {
    const bus = new TrackingEventsBus();
    const received = firstValueFrom(bus.forShipment('s1'));
    bus.publish(update({ shipmentId: 'other' }));
    bus.publish(update({ shipmentId: 's1', eventId: 'e2' }));
    const msg = await received;
    expect(msg.data.eventId).toBe('e2');
  });

  it('delivers updates for the matching tracking number within a tenant', async () => {
    const bus = new TrackingEventsBus();
    const received = firstValueFrom(bus.forTracking('t1', 'LV1'));
    bus.publish(update({ tenantId: 'other', trackingNumber: 'LV1' }));
    bus.publish(update({ tenantId: 't1', trackingNumber: 'LV1', eventId: 'e3' }));
    const msg = await received;
    expect(msg.data.eventId).toBe('e3');
  });
});
