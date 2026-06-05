import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  type ShipmentStatus,
  type ShipmentTrackingState,
  type TrackingAuditLog,
  type TrackingEvent,
} from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingEventsBus } from './tracking-events.bus';
import { statusForEvent } from './event-status.map';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export interface RequestMeta {
  actorId?: string;
  ipAddress?: string;
  requestId?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: TrackingEventsBus,
  ) {}

  /**
   * Appends a tracking event, synchronizes the projected shipment status,
   * writes an audit record, and publishes a real-time update — all within a
   * single transaction so the timeline, current status, and audit never drift.
   */
  async createEvent(
    tenantId: string,
    dto: CreateEventDto,
    meta: RequestMeta,
  ): Promise<TrackingEvent> {
    const occurredAt = dto.occurredAt !== undefined ? new Date(dto.occurredAt) : new Date();
    const statusAfter = statusForEvent(dto.type);
    const trackingNumber = dto.trackingNumber.toUpperCase();

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trackingEvent.create({
        data: {
          tenantId,
          shipmentId: dto.shipmentId,
          trackingNumber,
          type: dto.type,
          source: dto.source ?? undefined,
          statusAfter: statusAfter ?? undefined,
          description: dto.description ?? null,
          location: dto.location ?? null,
          latitude: dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : null,
          longitude: dto.longitude !== undefined ? new Prisma.Decimal(dto.longitude) : null,
          actorId: dto.actorId ?? meta.actorId ?? null,
          isPublic: dto.isPublic ?? true,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
          occurredAt,
        },
      });

      await this.projectState(tx, {
        tenantId,
        shipmentId: dto.shipmentId,
        trackingNumber,
        eventId: created.id,
        eventType: created.type,
        statusAfter,
        occurredAt,
      });

      await tx.trackingAuditLog.create({
        data: {
          tenantId,
          action: AuditAction.CREATE,
          shipmentId: dto.shipmentId,
          trackingNumber,
          actorId: meta.actorId ?? null,
          actorType: meta.actorId !== undefined ? 'user' : 'system',
          detail: { type: dto.type, statusAfter },
          ipAddress: meta.ipAddress ?? null,
          requestId: meta.requestId ?? null,
        },
      });

      return created;
    });

    this.bus.publish({
      tenantId,
      shipmentId: event.shipmentId,
      trackingNumber: event.trackingNumber,
      eventId: event.id,
      type: event.type,
      statusAfter: event.statusAfter ?? null,
      occurredAt: event.occurredAt.toISOString(),
    });

    return event;
  }

  /** Full internal timeline (all events) for a shipment, chronological. */
  async timeline(tenantId: string, shipmentId: string): Promise<TrackingEvent[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: { tenantId, shipmentId },
      orderBy: { occurredAt: 'asc' },
    });
    if (events.length === 0) {
      await this.assertShipmentKnown(tenantId, { shipmentId });
    }
    return events;
  }

  /**
   * Public timeline for a tracking number: only public events, and only the
   * customer-relevant fields. Records an audit READ. Requires the recipient's
   * tenant context (resolved upstream) — anti-enumeration controls (rate limit,
   * second factor) are applied at the gateway per the security design.
   */
  async publicTimeline(
    tenantId: string,
    trackingNumber: string,
    meta: RequestMeta,
  ): Promise<{
    trackingNumber: string;
    currentStatus: ShipmentStatus;
    lastOccurredAt: Date;
    events: Array<
      Pick<TrackingEvent, 'type' | 'statusAfter' | 'description' | 'location' | 'occurredAt'>
    >;
  }> {
    const tn = trackingNumber.toUpperCase();
    const state = await this.prisma.shipmentTrackingState.findUnique({
      where: { tenantId_trackingNumber: { tenantId, trackingNumber: tn } },
    });
    if (state === null) {
      throw new NotFoundException('Tracking number not found.');
    }

    const events = await this.prisma.trackingEvent.findMany({
      where: { tenantId, trackingNumber: tn, isPublic: true },
      orderBy: { occurredAt: 'asc' },
      select: {
        type: true,
        statusAfter: true,
        description: true,
        location: true,
        occurredAt: true,
      },
    });

    await this.prisma.trackingAuditLog.create({
      data: {
        tenantId,
        action: AuditAction.READ,
        trackingNumber: tn,
        actorType: 'public',
        detail: { surface: 'public-tracking' },
        ipAddress: meta.ipAddress ?? null,
        requestId: meta.requestId ?? null,
      },
    });

    return {
      trackingNumber: tn,
      currentStatus: state.currentStatus,
      lastOccurredAt: state.lastOccurredAt,
      events,
    };
  }

  /** Paginated, filterable event history for a shipment (internal). */
  async history(
    tenantId: string,
    shipmentId: string,
    query: QueryEventsDto,
  ): Promise<Page<TrackingEvent>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where: Prisma.TrackingEventWhereInput = {
      tenantId,
      shipmentId,
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.source !== undefined ? { source: query.source } : {}),
      ...this.dateRange(query.from, query.to),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trackingEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.trackingEvent.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /** Current projected status for a shipment (O(1) read of the state row). */
  async currentState(tenantId: string, shipmentId: string): Promise<ShipmentTrackingState> {
    const state = await this.prisma.shipmentTrackingState.findFirst({
      where: { tenantId, shipmentId },
    });
    if (state === null) {
      throw new NotFoundException('No tracking state for this shipment.');
    }
    return state;
  }

  /** Internal dashboard: filter shipments by projected status / recency. */
  async dashboard(
    tenantId: string,
    query: DashboardQueryDto,
  ): Promise<Page<ShipmentTrackingState>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where: Prisma.ShipmentTrackingStateWhereInput = {
      tenantId,
      ...(query.status !== undefined ? { currentStatus: query.status } : {}),
      ...(query.updatedSince !== undefined
        ? { lastOccurredAt: { gte: new Date(query.updatedSince) } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shipmentTrackingState.findMany({
        where,
        orderBy: { lastOccurredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.shipmentTrackingState.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Status synchronization: re-derives a shipment's current status from its
   * latest status-bearing event and repairs the projection if it has drifted
   * (e.g., after an out-of-band correction or a missed projection). Idempotent.
   */
  async synchronize(
    tenantId: string,
    shipmentId: string,
    meta: RequestMeta,
  ): Promise<ShipmentTrackingState> {
    const latestStatusEvent = await this.prisma.trackingEvent.findFirst({
      where: { tenantId, shipmentId, statusAfter: { not: null } },
      orderBy: { occurredAt: 'desc' },
    });
    if (latestStatusEvent === null || latestStatusEvent.statusAfter === null) {
      throw new NotFoundException('No status-bearing events to synchronize from.');
    }

    const eventCount = await this.prisma.trackingEvent.count({
      where: { tenantId, shipmentId },
    });

    const state = await this.prisma.shipmentTrackingState.upsert({
      where: { shipmentId },
      create: {
        shipmentId,
        tenantId,
        trackingNumber: latestStatusEvent.trackingNumber,
        currentStatus: latestStatusEvent.statusAfter,
        lastEventId: latestStatusEvent.id,
        lastEventType: latestStatusEvent.type,
        lastOccurredAt: latestStatusEvent.occurredAt,
        eventCount,
      },
      update: {
        currentStatus: latestStatusEvent.statusAfter,
        lastEventId: latestStatusEvent.id,
        lastEventType: latestStatusEvent.type,
        lastOccurredAt: latestStatusEvent.occurredAt,
        eventCount,
      },
    });

    await this.prisma.trackingAuditLog.create({
      data: {
        tenantId,
        action: AuditAction.SYNC,
        shipmentId,
        trackingNumber: latestStatusEvent.trackingNumber,
        actorId: meta.actorId ?? null,
        actorType: meta.actorId !== undefined ? 'user' : 'system',
        detail: { currentStatus: latestStatusEvent.statusAfter, eventCount },
        requestId: meta.requestId ?? null,
      },
    });

    return state;
  }

  /** Paginated audit log for a shipment (internal/compliance). */
  async auditLog(
    tenantId: string,
    shipmentId: string,
    query: QueryEventsDto,
  ): Promise<Page<TrackingAuditLog>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where: Prisma.TrackingAuditLogWhereInput = {
      tenantId,
      shipmentId,
      ...this.dateRange(query.from, query.to),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trackingAuditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.trackingAuditLog.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  // --- internals -----------------------------------------------------------

  private async projectState(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: string;
      shipmentId: string;
      trackingNumber: string;
      eventId: string;
      eventType: TrackingEvent['type'];
      statusAfter: ShipmentStatus | null;
      occurredAt: Date;
    },
  ): Promise<void> {
    const existing = await tx.shipmentTrackingState.findUnique({
      where: { shipmentId: params.shipmentId },
    });

    // Only advance currentStatus when the event carries a status; otherwise
    // keep the prior status (or default to CREATED for the very first event).
    const nextStatus =
      params.statusAfter ?? existing?.currentStatus ?? ('CREATED' as ShipmentStatus);

    // Do not regress lastOccurredAt/last event for an out-of-order older event.
    const isNewer = existing === null || params.occurredAt >= existing.lastOccurredAt;

    await tx.shipmentTrackingState.upsert({
      where: { shipmentId: params.shipmentId },
      create: {
        shipmentId: params.shipmentId,
        tenantId: params.tenantId,
        trackingNumber: params.trackingNumber,
        currentStatus: nextStatus,
        lastEventId: params.eventId,
        lastEventType: params.eventType,
        lastOccurredAt: params.occurredAt,
        eventCount: 1,
      },
      update: {
        eventCount: { increment: 1 },
        ...(isNewer
          ? {
              currentStatus: nextStatus,
              lastEventId: params.eventId,
              lastEventType: params.eventType,
              lastOccurredAt: params.occurredAt,
            }
          : {}),
      },
    });
  }

  private dateRange(from?: string, to?: string): { occurredAt?: { gte?: Date; lte?: Date } } {
    if (from === undefined && to === undefined) {
      return {};
    }
    return {
      occurredAt: {
        ...(from !== undefined ? { gte: new Date(from) } : {}),
        ...(to !== undefined ? { lte: new Date(to) } : {}),
      },
    };
  }

  private async assertShipmentKnown(
    tenantId: string,
    where: { shipmentId: string },
  ): Promise<void> {
    const state = await this.prisma.shipmentTrackingState.findFirst({
      where: { tenantId, shipmentId: where.shipmentId },
    });
    if (state === null) {
      throw new NotFoundException('No tracking information for this shipment.');
    }
  }
}
