'use client';

import type {
  CreateTenantInput,
  CreateUserInput,
  LoginInput,
  UpdateTenantInput,
  UpdateUserInput,
} from '@/lib/schemas';
import type {
  AdminUser,
  AuditLogEntry,
  Paginated,
  SessionUser,
  Shipment,
  ShipmentStatus,
  Tenant,
  UserStatus,
} from '@/lib/types';

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
    throw new ApiError(
      response.status,
      typeof obj.code === 'string' ? obj.code : 'ERROR',
      typeof obj.detail === 'string' ? obj.detail : 'Request failed.',
      extractFieldErrors(obj.errors),
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

export interface ShipmentQuery {
  status?: ShipmentStatus;
  limit?: number;
  offset?: number;
}

export const api = {
  // auth
  login: (input: LoginInput) =>
    bff<{ user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => bff<void>('/auth/logout', { method: 'POST' }),
  me: () => bff<SessionUser>('/auth/me'),

  // users
  listUsers: () => bff<AdminUser[]>('/users'),
  createUser: (input: CreateUserInput) =>
    bff<AdminUser>('/users', { method: 'POST', body: JSON.stringify(input) }),
  updateUser: (id: string, input: UpdateUserInput) =>
    bff<AdminUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  setUserStatus: (id: string, status: UserStatus) =>
    bff<AdminUser>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // tenants
  listTenants: () => bff<Tenant[]>('/tenants'),
  createTenant: (input: CreateTenantInput) =>
    bff<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(input) }),
  updateTenant: (id: string, input: UpdateTenantInput) =>
    bff<Tenant>(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  archiveTenant: (id: string) => bff<Tenant>(`/tenants/${id}`, { method: 'DELETE' }),

  // shipments
  listShipments: (query: ShipmentQuery) => {
    const search = new URLSearchParams();
    if (query.status !== undefined) search.set('status', query.status);
    search.set('limit', String(query.limit ?? 20));
    search.set('offset', String(query.offset ?? 0));
    return bff<Paginated<Shipment>>(`/shipments?${search.toString()}`);
  },

  // audit
  listAudit: (shipmentId: string, limit = 50, offset = 0) => {
    const search = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return bff<Paginated<AuditLogEntry>>(`/shipments/${shipmentId}/audit?${search.toString()}`);
  },
};
