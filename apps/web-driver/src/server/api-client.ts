import 'server-only';
import type { ApiProblem } from '@/lib/types';
import { readSession } from './session';

export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ApiProblem,
  ) {
    super(problem.detail || problem.title || 'Upstream error');
    this.name = 'UpstreamError';
  }
}

type Service = 'identity' | 'shipment' | 'tracking';

function baseUrl(service: Service): string {
  const map: Record<Service, string | undefined> = {
    identity: process.env.IDENTITY_API_URL,
    shipment: process.env.SHIPMENT_API_URL,
    tracking: process.env.TRACKING_API_URL,
  };
  const url = map[service];
  if (url === undefined || url === '') {
    throw new Error(`Missing API base URL for service: ${service}`);
  }
  return url.replace(/\/$/, '');
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  anonymous?: boolean;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  service: Service,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, anonymous = false, headers = {} } = options;

  const finalHeaders: Record<string, string> = { accept: 'application/json', ...headers };
  if (body !== undefined) {
    finalHeaders['content-type'] = 'application/json';
  }

  if (!anonymous) {
    const session = readSession();
    if (session === null) {
      throw new UpstreamError(401, {
        status: 401,
        code: 'UNAUTHENTICATED',
        title: 'Unauthorized',
        detail: 'No active session.',
      });
    }
    finalHeaders.authorization = `Bearer ${session.accessToken}`;
    finalHeaders['x-tenant-id'] = session.tenantId;
    finalHeaders['x-actor-id'] = session.user.id;
  }

  const response = await fetch(`${baseUrl(service)}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data: unknown = text.length > 0 ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new UpstreamError(response.status, normalizeProblem(response.status, data));
  }
  return data as T;
}

function normalizeProblem(status: number, data: unknown): ApiProblem {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      status: typeof obj.status === 'number' ? obj.status : status,
      code: typeof obj.code === 'string' ? obj.code : 'ERROR',
      title: typeof obj.title === 'string' ? obj.title : 'Error',
      detail: typeof obj.detail === 'string' ? obj.detail : 'Request failed.',
      errors: Array.isArray(obj.errors) ? (obj.errors as ApiProblem['errors']) : undefined,
    };
  }
  return { status, code: 'ERROR', title: 'Error', detail: 'Request failed.' };
}
