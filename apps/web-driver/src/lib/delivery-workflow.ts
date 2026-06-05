import type { ShipmentStatus } from '@/lib/types';

export type DriverAction =
  | 'ACCEPT'
  | 'MARK_PICKED_UP'
  | 'MARK_IN_TRANSIT'
  | 'MARK_OUT_FOR_DELIVERY'
  | 'MARK_DELIVERED'
  | 'MARK_FAILED'
  | 'MARK_RETURNED';

export interface DriverActionDef {
  action: DriverAction;
  label: string;
  /** Target shipment status this action transitions to. */
  to: ShipmentStatus;
  /** Source statuses from which this action is legal. */
  from: ShipmentStatus[];
  /** Whether the action requires proof of delivery capture. */
  requiresPod: boolean;
  /** Whether the action requires a failure reason. */
  requiresReason: boolean;
  variant: 'default' | 'destructive' | 'secondary';
}

/**
 * Driver-facing actions mapped to the canonical shipment status machine
 * (mirrors services/shipment ShipmentStatusWorkflow). The UI derives the
 * available actions for a shipment from its current status, so it can never
 * offer an illegal transition. The backend remains the source of truth and
 * re-validates every transition.
 *
 * "Accept" advances CREATED -> PICKUP_PENDING (driver takes ownership of the
 * pickup). Cancellation is intentionally not a driver action.
 */
export const DRIVER_ACTIONS: DriverActionDef[] = [
  {
    action: 'ACCEPT',
    label: 'Accept shipment',
    to: 'PICKUP_PENDING',
    from: ['CREATED'],
    requiresPod: false,
    requiresReason: false,
    variant: 'default',
  },
  {
    action: 'MARK_PICKED_UP',
    label: 'Mark picked up',
    to: 'PICKED_UP',
    from: ['PICKUP_PENDING'],
    requiresPod: false,
    requiresReason: false,
    variant: 'default',
  },
  {
    action: 'MARK_IN_TRANSIT',
    label: 'Mark in transit',
    to: 'IN_TRANSIT',
    from: ['PICKED_UP'],
    requiresPod: false,
    requiresReason: false,
    variant: 'default',
  },
  {
    action: 'MARK_OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    to: 'OUT_FOR_DELIVERY',
    from: ['IN_TRANSIT', 'FAILED'],
    requiresPod: false,
    requiresReason: false,
    variant: 'default',
  },
  {
    action: 'MARK_DELIVERED',
    label: 'Mark delivered',
    to: 'DELIVERED',
    from: ['OUT_FOR_DELIVERY'],
    requiresPod: true,
    requiresReason: false,
    variant: 'default',
  },
  {
    action: 'MARK_FAILED',
    label: 'Mark failed',
    to: 'FAILED',
    from: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
    requiresPod: false,
    requiresReason: true,
    variant: 'destructive',
  },
  {
    action: 'MARK_RETURNED',
    label: 'Mark returned',
    to: 'RETURNED',
    from: ['FAILED'],
    requiresPod: false,
    requiresReason: true,
    variant: 'secondary',
  },
];

export function availableActions(status: ShipmentStatus): DriverActionDef[] {
  return DRIVER_ACTIONS.filter((a) => a.from.includes(status));
}

export function actionByName(action: DriverAction): DriverActionDef {
  const found = DRIVER_ACTIONS.find((a) => a.action === action);
  if (found === undefined) {
    throw new Error(`Unknown driver action: ${action}`);
  }
  return found;
}

export function isTerminal(status: ShipmentStatus): boolean {
  return status === 'DELIVERED' || status === 'RETURNED' || status === 'CANCELLED';
}
