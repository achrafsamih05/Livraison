import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface CapturedResponse {
  statusCode?: number;
  headers: Record<string, string>;
  body?: unknown;
}

function makeHost(): { host: ExecutionContext; response: CapturedResponse } {
  const response: CapturedResponse = { headers: {} };
  const res = {
    status(code: number) {
      response.statusCode = code;
      return this;
    },
    setHeader(key: string, value: string) {
      response.headers[key] = value;
      return this;
    },
    json(payload: unknown) {
      response.body = payload;
      return this;
    },
  };
  const req = { url: '/api/v1/things', method: 'POST', headers: {} };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { host, response };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('renders an HttpException as RFC 7807 problem+json with a code', () => {
    const { host, response } = makeHost();
    filter.catch(new NotFoundException('Tenant not found.'), host);
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.headers['content-type']).toBe('application/problem+json');
    expect(response.headers['x-request-id']).toBeDefined();
    const body = response.body as Record<string, unknown>;
    expect(body.code).toBe('NOT_FOUND');
    expect(body.detail).toBe('Tenant not found.');
    expect(body.requestId).toBeDefined();
  });

  it('maps validation arrays to a VALIDATION_ERROR with errors', () => {
    const { host, response } = makeHost();
    filter.catch(new BadRequestException({ message: ['email must be valid'] }), host);
    const body = response.body as Record<string, unknown>;
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.errors).toEqual(['email must be valid']);
  });

  it('maps a custom HttpException code from the payload', () => {
    const { host, response } = makeHost();
    filter.catch(
      new HttpException({ message: 'nope', code: 'CUSTOM_CODE' }, HttpStatus.FORBIDDEN),
      host,
    );
    const body = response.body as Record<string, unknown>;
    expect(body.code).toBe('CUSTOM_CODE');
    expect(body.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('maps Prisma P2002 to a 409 UNIQUE_CONSTRAINT', () => {
    const { host, response } = makeHost();
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5' }),
      host,
    );
    const body = response.body as Record<string, unknown>;
    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    expect(body.code).toBe('UNIQUE_CONSTRAINT');
  });

  it('maps Prisma P2025 to a 404 NOT_FOUND', () => {
    const { host, response } = makeHost();
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '5' }),
      host,
    );
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps unknown errors to a 500 without leaking internals', () => {
    const { host, response } = makeHost();
    filter.catch(new Error('secret internal detail'), host);
    const body = response.body as Record<string, unknown>;
    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.detail).toBe('An unexpected error occurred.');
    expect(JSON.stringify(body)).not.toContain('secret internal detail');
  });

  it('maps other Prisma known errors to a 400 DB_CONSTRAINT', () => {
    const { host, response } = makeHost();
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('fk', { code: 'P2003', clientVersion: '5' }),
      host,
    );
    const body = response.body as Record<string, unknown>;
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.code).toBe('DB_CONSTRAINT');
  });

  it('reuses an incoming x-request-id header when present', () => {
    const response: CapturedResponse = { headers: {} };
    const res = {
      status() {
        return this;
      },
      setHeader(key: string, value: string) {
        response.headers[key] = value;
        return this;
      },
      json(payload: unknown) {
        response.body = payload;
        return this;
      },
    };
    const req = { url: '/x', method: 'GET', headers: { 'x-request-id': 'fixed-id' } };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ExecutionContext;
    filter.catch(new ConflictException('dup'), host);
    expect(response.headers['x-request-id']).toBe('fixed-id');
  });
});
