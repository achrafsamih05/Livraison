'use client';

import type { CreateShipmentInput, LoginInput, ProfileInput } from '@/lib/schemas';
import type { Paginated, SessionUser, Shipment, ShipmentStatus, TrackingEvent } from '@/lib/types';

/**
 * Browser-side API client. Talks only to the same-origin BFF (`/api/bff/...`),
 * which holds credentials server-side in an httpOnly cookie. No tokens are ever
 * stored or read in the browser.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function bff<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/bff${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data: unknown = text.length > 0 ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const obj = (data ?? {}) as Record<string, unknown>;
    const fieldErrors = extractFieldErrors(obj.errors);
    throw new ApiError(
      response.status,
      typeof obj.code === 'string' ? obj.code : 'ERROR',
      typeof obj.detail === 'string' ? obj.detail : 'Request failed.',
      fieldErrors,
    );
  }

  return data as T;
}

function extractFieldErrors(errors: unknown): Record<string, string> | undefined {
  if (!Array.isArray(errors)) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const entry of errors) {
    if (typeof entry === 'object' && entry !== null) {
      const e = entry as Record<string, unknown>;
      if (typeof e.field === 'string') {
        result[e.field] = typeof e.rule === 'string' ? e.rule : 'invalid';
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export interface ListShipmentParams {
  status?: ShipmentStatus;
  limit?: number;
  offset?: number;
}

export const api = {
  async login(input: LoginInput): Promise<{ user: SessionUser }> {
    return bff('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },
  async logout(): Promise<void> {
    await bff('/auth/logout', { method: 'POST' });
  },
  async me(): Promise<SessionUser> {
    return bff('/auth/me');
  },
  async updateProfile(input: ProfileInput): Promise<SessionUser> {
    return bff('/profile', { method: 'PATCH', body: JSON.stringify(input) });
  },
  async listShipments(params: ListShipmentParams): Promise<Paginated<Shipment>> {
    const search = new URLSearchParams();
    if (params.status !== undefined) search.set('status', params.status);
    search.set('limit', String(params.limit ?? 20));
    search.set('offset', String(params.offset ?? 0));
    return bff(`/shipments?${search.toString()}`);
  },
  async getShipment(id: string): Promise<Shipment> {
    return bff(`/shipments/${id}`);
  },
  async getTimeline(id: string): Promise<TrackingEvent[]> {
    return bff(`/shipments/${id}/timeline`);
  },
  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    return bff('/shipments', { method: 'POST', body: JSON.stringify(input) });
  },
  async cancelShipment(id: string, reason?: string): Promise<Shipment> {
    return bff(`/shipments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
