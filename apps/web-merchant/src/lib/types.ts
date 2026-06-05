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

export type ServiceLevel = 'SAME_DAY' | 'NEXT_DAY' | 'EXPRESS' | 'STANDARD' | 'ECONOMY';

export interface Shipment {
  id: string;
  tenantId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  service: ServiceLevel;
  senderName: string;
  senderPhone: string;
  senderLine1: string;
  senderCity: string;
  senderCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientLine1: string;
  recipientCity: string;
  recipientCountry: string;
  weightGrams: number;
  codAmount: string;
  declaredValue: string;
  currency: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface TrackingEvent {
  id: string;
  type: string;
  source: string;
  statusAfter: ShipmentStatus | null;
  description: string | null;
  location: string | null;
  occurredAt: string;
}

export interface SessionUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface ApiProblem {
  status: number;
  code: string;
  title: string;
  detail: string;
  errors?: Array<{ field?: string; rule?: string }> | string[];
}
