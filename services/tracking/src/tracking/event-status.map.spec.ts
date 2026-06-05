import { ShipmentStatus, TrackingEventType } from '../../generated/client';
import { statusForEvent } from './event-status.map';

describe('statusForEvent', () => {
  it('maps lifecycle events to their status', () => {
    expect(statusForEvent(TrackingEventType.CREATED)).toBe(ShipmentStatus.CREATED);
    expect(statusForEvent(TrackingEventType.PICKED_UP)).toBe(ShipmentStatus.PICKED_UP);
    expect(statusForEvent(TrackingEventType.OUT_FOR_DELIVERY)).toBe(
      ShipmentStatus.OUT_FOR_DELIVERY,
    );
    expect(statusForEvent(TrackingEventType.DELIVERED)).toBe(ShipmentStatus.DELIVERED);
    expect(statusForEvent(TrackingEventType.CANCELLED)).toBe(ShipmentStatus.CANCELLED);
  });

  it('maps hub scans to IN_TRANSIT', () => {
    expect(statusForEvent(TrackingEventType.ARRIVED_AT_HUB)).toBe(ShipmentStatus.IN_TRANSIT);
    expect(statusForEvent(TrackingEventType.DEPARTED_HUB)).toBe(ShipmentStatus.IN_TRANSIT);
    expect(statusForEvent(TrackingEventType.ARRIVED_AT_BRANCH)).toBe(ShipmentStatus.IN_TRANSIT);
  });

  it('returns null for non-status events', () => {
    expect(statusForEvent(TrackingEventType.NOTE)).toBeNull();
    expect(statusForEvent(TrackingEventType.HELD)).toBeNull();
    expect(statusForEvent(TrackingEventType.EXCEPTION)).toBeNull();
    expect(statusForEvent(TrackingEventType.DELIVERY_ATTEMPTED)).toBeNull();
  });
});
