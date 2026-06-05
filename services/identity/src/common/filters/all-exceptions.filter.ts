import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  requestId: string;
  errors?: unknown;
}

/**
 * Global exception filter that renders every error as an RFC 7807
 * application/problem+json response with a stable error `code` and a
 * correlation `requestId`. Internal details are never leaked to clients;
 * full context is logged server-side.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();

    const problem = this.toProblem(exception, request.url, requestId);

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${problem.code} ${problem.status} ${request.method} ${request.url} reqId=${requestId}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${problem.code} ${problem.status} ${request.method} ${request.url} reqId=${requestId}`,
      );
    }

    response
      .status(problem.status)
      .setHeader('content-type', 'application/problem+json')
      .setHeader('x-request-id', requestId)
      .json(problem);
  }

  private toProblem(exception: unknown, instance: string, requestId: string): ProblemDetails {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, instance, requestId);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception, instance, requestId);
    }
    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
      instance,
      code: 'INTERNAL_ERROR',
      requestId,
    };
  }

  private fromHttpException(
    exception: HttpException,
    instance: string,
    requestId: string,
  ): ProblemDetails {
    const status = exception.getStatus();
    const payload = exception.getResponse();
    let detail = exception.message;
    let errors: unknown;
    let code = this.statusToCode(status);

    if (typeof payload === 'object' && payload !== null) {
      const obj = payload as Record<string, unknown>;
      if (typeof obj.message === 'string') {
        detail = obj.message;
      } else if (Array.isArray(obj.message)) {
        detail = 'Validation failed';
        errors = obj.message;
        code = 'VALIDATION_ERROR';
      }
      if (typeof obj.code === 'string') {
        code = obj.code;
      }
    }

    return {
      type: 'about:blank',
      title: this.statusToTitle(status),
      status,
      detail,
      instance,
      code,
      requestId,
      ...(errors !== undefined ? { errors } : {}),
    };
  }

  private fromPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    instance: string,
    requestId: string,
  ): ProblemDetails {
    if (exception.code === 'P2002') {
      return {
        type: 'about:blank',
        title: 'Conflict',
        status: HttpStatus.CONFLICT,
        detail: 'A record with the same unique value already exists.',
        instance,
        code: 'UNIQUE_CONSTRAINT',
        requestId,
      };
    }
    if (exception.code === 'P2025') {
      return {
        type: 'about:blank',
        title: 'Not Found',
        status: HttpStatus.NOT_FOUND,
        detail: 'The requested record was not found.',
        instance,
        code: 'NOT_FOUND',
        requestId,
      };
    }
    return {
      type: 'about:blank',
      title: 'Bad Request',
      status: HttpStatus.BAD_REQUEST,
      detail: 'A database constraint was violated.',
      instance,
      code: 'DB_CONSTRAINT',
      requestId,
    };
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
    };
    return map[status] ?? 'ERROR';
  }

  private statusToTitle(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
    };
    return map[status] ?? 'Error';
  }
}
