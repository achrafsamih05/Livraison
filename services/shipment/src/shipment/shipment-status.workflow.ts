import { ShipmentStatus } from '../../generated/client';

/**
 * Authoritative shipment status state machine.
 *
 * Happy path:
 *   CREATED -> PICKUP_PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
 *
 * Exception branches:
 *   - OUT_FOR_DELIVERY may FAIL; a FAILED shipment can be retried
 *     (OUT_FOR_DELIVERY) or RETURNED.
 *   - IN_TRANSIT may also FAIL (e.g., lost/damaged in network).
 *   - CANCELLED is reachable only before the parcel is in the network
 *     (CREATED or PICKUP_PENDING).
 *
 * Terminal states: DELIVERED, RETURNED, CANCELLED.
 */
const TRANSITIONS: Readonly<Record<ShipmentStatus, ReadonlyArray<ShipmentStatus>>> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.PICKUP_PENDING, ShipmentStatus.CANCELLED],
  [ShipmentStatus.PICKUP_PENDING]: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
  [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.FAILED],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.FAILED],
  [ShipmentStatus.FAILED]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURNED],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.RETURNED]: [],
  [ShipmentStatus.CANCELLED]: [],
};

const TERMINAL_STATUSES: ReadonlySet<ShipmentStatus> = new Set([
  ShipmentStatus.DELIVERED,
  ShipmentStatus.RETURNED,
  ShipmentStatus.CANCELLED,
]);

/**
 * States from which a shipment may still be edited (mutable fields like
 * addresses, weight, COD). Once it is in the network, edits are locked.
 */
const EDITABLE_STATUSES: ReadonlySet<ShipmentStatus> = new Set([
  ShipmentStatus.CREATED,
  ShipmentStatus.PICKUP_PENDING,
]);

const CANCELLABLE_STATUSES: ReadonlySet<ShipmentStatus> = new Set([
  ShipmentStatus.CREATED,
  ShipmentStatus.PICKUP_PENDING,
]);

export const ShipmentStatusWorkflow = {
  /** Returns the list of statuses reachable from the given status. */
  allowedTransitions(from: ShipmentStatus): ReadonlyArray<ShipmentStatus> {
    return TRANSITIONS[from];
  },

  /** True if `to` is a legal next status from `from`. */
  canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return TRANSITIONS[from].includes(to);
  },

  /** True if no further transitions are possible. */
  isTerminal(status: ShipmentStatus): boolean {
    return TERMINAL_STATUSES.has(status);
  },

  /** True if mutable shipment fields may still be edited. */
  isEditable(status: ShipmentStatus): boolean {
    return EDITABLE_STATUSES.has(status);
  },

  /** True if the shipment may be cancelled from its current status. */
  isCancellable(status: ShipmentStatus): boolean {
    return CANCELLABLE_STATUSES.has(status);
  },
} as const;
