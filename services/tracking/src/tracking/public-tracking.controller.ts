import { Controller, Get, Param, Query, Sse } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { RequestContext, TenantId } from '../common/tenant.decorator';
import { TrackingService } from './tracking.service';
import { TrackingEventsBus, type TrackingUpdate } from './tracking-events.bus';

/**
 * Public tracking API.
 *
 * Returns only public events and customer-relevant fields. Tenant context is
 * resolved upstream (e.g., from the white-labeled domain or a tracking token).
 * Anti-enumeration controls — rate limiting, bot protection, and a second
 * factor for any PII beyond status — are enforced at the gateway/edge per the
 * security design (see AUDIT.md SPEC-004); this handler intentionally exposes
 * a minimized projection.
 *
 *  GET /api/v1/public/track/:trackingNumber            Public timeline
 *  SSE /api/v1/public/track/:trackingNumber/stream     Real-time public updates
 */
@Controller({ path: 'public/track', version: '1' })
export class PublicTrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly bus: TrackingEventsBus,
  ) {}

  @Get(':trackingNumber')
  track(
    @TenantId() tenantId: string,
    @RequestContext() ctx: { ipAddress?: string; requestId?: string },
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<unknown> {
    return this.tracking.publicTimeline(tenantId, trackingNumber, ctx);
  }

  @Sse(':trackingNumber/stream')
  stream(
    @TenantId() tenantId: string,
    @Param('trackingNumber') trackingNumber: string,
  ): Observable<{ data: TrackingUpdate }> {
    return this.bus.forTracking(tenantId, trackingNumber.toUpperCase());
  }
}
