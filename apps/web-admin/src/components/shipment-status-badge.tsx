import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ShipmentStatus } from '@/lib/types';

const VARIANT: Record<
  ShipmentStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  CREATED: 'secondary',
  PICKUP_PENDING: 'secondary',
  PICKED_UP: 'default',
  IN_TRANSIT: 'default',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  FAILED: 'destructive',
  RETURNED: 'destructive',
  CANCELLED: 'outline',
};

const LABEL: Record<ShipmentStatus, string> = {
  CREATED: 'Created',
  PICKUP_PENDING: 'Pickup pending',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }): React.JSX.Element {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
