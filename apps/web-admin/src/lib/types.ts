export type RoleName =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'DRIVER'
  | 'FINANCE'
  | 'SUPPORT'
  | 'MERCHANT'
  | 'CUSTOMER';

export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export type ShipmentStatus =
  | 'CREATED'
  | 'PICKUP_PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | 'CANCELLED';

export interface SessionUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
}

export interface AdminUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  roles: RoleName[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  tenantId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  service: string;
  recipientName: string;
  recipientCity: string;
  codAmount: string;
  currency: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  shipmentId: string | null;
  trackingNumber: string | null;
  actorId: string | null;
  actorType: string;
  detail: Record<string, unknown>;
  ipAddress: string | null;
  requestId: string | null;
  occurredAt: string;
}

export interface PermissionDef {
  key: string;
  resource: string;
  action: string;
  roles: RoleName[];
}

export interface ApiProblem {
  status: number;
  code: string;
  title: string;
  detail: string;
  errors?: Array<{ field?: string; rule?: string }> | string[];
}
