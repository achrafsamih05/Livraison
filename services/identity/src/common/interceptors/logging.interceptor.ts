import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Structured request logger. Emits one line per request with method, path,
 * status, duration, tenant, and a correlation id. Never logs request bodies
 * to avoid leaking credentials or PII.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string; tenantId?: string }>();
    const response = http.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const start = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          this.logger.log(
            JSON.stringify({
              level: 'info',
              method,
              url,
              status: response.statusCode,
              durationMs,
              tenantId: request.tenantId ?? null,
              requestId,
            }),
          );
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - start;
          this.logger.warn(
            JSON.stringify({
              level: 'error',
              method,
              url,
              status: response.statusCode,
              durationMs,
              tenantId: request.tenantId ?? null,
              requestId,
              error: err instanceof Error ? err.name : 'UnknownError',
            }),
          );
        },
      }),
    );
  }
}
