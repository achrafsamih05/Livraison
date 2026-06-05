import { Injectable } from '@nestjs/common';
import { Subject, filter, map, type Observable } from 'rxjs';

export interface TrackingUpdate {
  tenantId: string;
  shipmentId: string;
  trackingNumber: string;
  eventId: string;
  type: string;
  statusAfter: string | null;
  occurredAt: string;
}

/**
 * In-process pub/sub for real-time tracking updates, exposed to clients via
 * Server-Sent Events. Subscribers receive only updates for the shipment or
 * tracking number they requested.
 *
 * Note: this is a single-instance fan-out. In a multi-replica deployment, back
 * this with Redis pub/sub or the Kafka tracking topic so updates reach clients
 * connected to any replica (see ARCHITECTURE.md event backbone).
 */
@Injectable()
export class TrackingEventsBus {
  private readonly subject = new Subject<TrackingUpdate>();

  publish(update: TrackingUpdate): void {
    this.subject.next(update);
  }

  /** Stream of SSE-shaped messages for a single shipment id. */
  forShipment(shipmentId: string): Observable<{ data: TrackingUpdate }> {
    return this.subject.asObservable().pipe(
      filter((u) => u.shipmentId === shipmentId),
      map((u) => ({ data: u })),
    );
  }

  /** Stream of SSE-shaped messages for a tracking number within a tenant. */
  forTracking(tenantId: string, trackingNumber: string): Observable<{ data: TrackingUpdate }> {
    return this.subject.asObservable().pipe(
      filter((u) => u.tenantId === tenantId && u.trackingNumber === trackingNumber),
      map((u) => ({ data: u })),
    );
  }
}
