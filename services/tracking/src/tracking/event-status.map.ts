import { ShipmentStatus, TrackingEventType } from '../../generated/client';

/**
 * Maps a tracking event type to the shipment lifecycle status it implies, if
 * any. Events that do not change lifecycle status (NOTE, HELD, EXCEPTION,
 * intermediate hub scans) return null, so they are recorded on the timeline
 * without advancing the projected current status.
 *
 * This is the single source of truth for status synchronization: when an event
 * is created, the projected `currentStatus` advances to the mapped value.
 */
const EVENT_TO_STATUS: Readonly<Partial<Record<TrackingEventType, ShipmentStatus>>> = {
  [TrackingEventType.CREATED]: ShipmentStatus.CREATED,
  [TrackingEventType.PICKUP_SCHEDULED]: ShipmentStatus.PICKUP_PENDING,
  [TrackingEventType.PICKED_UP]: ShipmentStatus.PICKED_UP,
  [TrackingEventType.ARRIVED_AT_HUB]: ShipmentStatus.IN_TRANSIT,
  [TrackingEventType.DEPARTED_HUB]: ShipmentStatus.IN_TRANSIT,
  [TrackingEventType.ARRIVED_AT_BRANCH]: ShipmentStatus.IN_TRANSIT,
  [TrackingEventType.OUT_FOR_DELIVERY]: ShipmentStatus.OUT_FOR_DELIVERY,
  [TrackingEventType.DELIVERED]: ShipmentStatus.DELIVERED,
  [TrackingEventType.FAILED]: ShipmentStatus.FAILED,
  [TrackingEventType.RETURNED]: ShipmentStatus.RETURNED,
  [TrackingEventType.CANCELLED]: ShipmentStatus.CANCELLED,
  // DELIVERY_ATTEMPTED, HELD, EXCEPTION, NOTE intentionally omitted (no status change).
};

export function statusForEvent(type: TrackingEventType): ShipmentStatus | null {
  return EVENT_TO_STATUS[type] ?? null;
}
