import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type {
  ShipmentTrackingState,
  TrackingAuditLog,
  TrackingEvent,
} from '../../generated/client';
import { ActorId, RequestContext, TenantId } from '../common/tenant.decorator';
import { TrackingService, type Page } from './tracking.service';
import { TrackingEventsBus, type TrackingUpdate } from './tracking-events.bus';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

/**
 * Internal tracking API (tenant-scoped, behind auth).
 *
 *  POST /api/v1/tracking/events                      Create event (+sync +audit +realtime)
 *  GET  /api/v1/tracking/shipments/:id/timeline      Full timeline
 *  GET  /api/v1/tracking/shipments/:id/events        Paginated/filterable history
 *  GET  /api/v1/tracking/shipments/:id/state         Current projected status
 *  GET  /api/v1/tracking/shipments/:id/audit         Audit log (paginated)
 *  POST /api/v1/tracking/shipments/:id/sync          Re-derive + repair status
 *  GET  /api/v1/tracking/dashboard                   Internal dashboard
 *  SSE  /api/v1/tracking/shipments/:id/stream        Real-time updates
 */
@Controller({ path: 'tracking', version: '1' })
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly bus: TrackingEventsBus,
  ) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  createEvent(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @RequestContext() ctx: { ipAddress?: string; requestId?: string },
    @Body() dto: CreateEventDto,
  ): Promise<TrackingEvent> {
    return this.tracking.createEvent(tenantId, dto, { actorId, ...ctx });
  }

  @Get('shipments/:id/timeline')
  timeline(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrackingEvent[]> {
    return this.tracking.timeline(tenantId, id);
  }

  @Get('shipments/:id/events')
  history(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryEventsDto,
  ): Promise<Page<TrackingEvent>> {
    return this.tracking.history(tenantId, id, query);
  }

  @Get('shipments/:id/state')
  state(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShipmentTrackingState> {
    return this.tracking.currentState(tenantId, id);
  }

  @Get('shipments/:id/audit')
  audit(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryEventsDto,
  ): Promise<Page<TrackingAuditLog>> {
    return this.tracking.auditLog(tenantId, id, query);
  }

  @Post('shipments/:id/sync')
  @HttpCode(HttpStatus.OK)
  sync(
    @TenantId() tenantId: string,
    @ActorId() actorId: string | undefined,
    @RequestContext() ctx: { requestId?: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShipmentTrackingState> {
    return this.tracking.synchronize(tenantId, id, { actorId, ...ctx });
  }

  @Get('dashboard')
  dashboard(
    @TenantId() tenantId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<Page<ShipmentTrackingState>> {
    return this.tracking.dashboard(tenantId, query);
  }

  @Sse('shipments/:id/stream')
  stream(@Param('id', ParseUUIDPipe) id: string): Observable<{ data: TrackingUpdate }> {
    return this.bus.forShipment(id);
  }
}
