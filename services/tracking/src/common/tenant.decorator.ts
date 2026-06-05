import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolves the tenant id from the verified token (set upstream as
 * `request.tenantId`) or, for service/local use, the `X-Tenant-Id` header.
 * Rejects requests without a valid tenant UUID so access can never silently
 * widen across tenants.
 */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request & { tenantId?: string }>();
  const header = request.headers['x-tenant-id'];
  const tenantId = request.tenantId ?? (typeof header === 'string' ? header : undefined);
  if (tenantId === undefined || !UUID_RE.test(tenantId)) {
    throw new BadRequestException('A valid tenant context (X-Tenant-Id) is required.');
  }
  return tenantId;
});

export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { userId?: string }>();
    const header = request.headers['x-actor-id'];
    return request.userId ?? (typeof header === 'string' ? header : undefined);
  },
);

export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { ipAddress?: string; requestId?: string } => {
    const request = ctx.switchToHttp().getRequest<Request & { requestId?: string }>();
    const reqIdHeader = request.headers['x-request-id'];
    return {
      ipAddress: request.ip,
      requestId: request.requestId ?? (typeof reqIdHeader === 'string' ? reqIdHeader : undefined),
    };
  },
);
