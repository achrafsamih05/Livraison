import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolves the tenant id for the request.
 *
 * In production this is derived from the verified access token by an upstream
 * auth guard (which sets `request.tenantId`). For service-to-service and local
 * use, an `X-Tenant-Id` header is accepted as a fallback. The value must be a
 * UUID; otherwise the request is rejected so a missing tenant can never silently
 * widen data access.
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request & { tenantId?: string }>();
  const fromToken = request.tenantId;
  const fromHeader = request.headers['x-tenant-id'];
  const tenantId = fromToken ?? (typeof fromHeader === 'string' ? fromHeader : undefined);

  if (tenantId === undefined || !UUID_RE.test(tenantId)) {
    throw new BadRequestException('A valid tenant context (X-Tenant-Id) is required.');
  }
  return tenantId;
});

/** Optional actor id from the auth layer, used for history attribution. */
export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { userId?: string }>();
    const header = request.headers['x-actor-id'];
    return request.userId ?? (typeof header === 'string' ? header : undefined);
  },
);
