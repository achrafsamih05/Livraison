'use client';

import type { LoginInput } from '@/lib/schemas';
import type { DriverProfile, Paginated, Shipment, ShipmentStatus } from '@/lib/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
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
    throw new ApiError(
      response.status,
      typeof obj.code === 'string' ? obj.code : 'ERROR',
      typeof obj.detail === 'string' ? obj.detail : 'Request failed.',
    );
  }
  return data as T;
}

export interface ShipmentQuery {
  status?: ShipmentStatus;
  limit?: number;
  offset?: number;
}

export const api = {
  login: (input: LoginInput) =>
    bff<{ user: DriverProfile }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => bff<void>('/auth/logout', { method: 'POST' }),
  me: () => bff<DriverProfile>('/auth/me'),
  listShipments: (query: ShipmentQuery) => {
    const search = new URLSearchParams();
    if (query.status !== undefined) search.set('status', query.status);
    search.set('limit', String(query.limit ?? 50));
    search.set('offset', String(query.offset ?? 0));
    return bff<Paginated<Shipment>>(`/shipments?${search.toString()}`);
  },
  getShipment: (id: string) => bff<Shipment>(`/shipments/${id}`),
};
