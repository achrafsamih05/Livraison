import { ShipmentStatus } from '../../generated/client';
import { ShipmentStatusWorkflow } from './shipment-status.workflow';

describe('ShipmentStatusWorkflow', () => {
  it('permits the full happy path', () => {
    const path: ShipmentStatus[] = [
      ShipmentStatus.CREATED,
      ShipmentStatus.PICKUP_PENDING,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(ShipmentStatusWorkflow.canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('allows failure and retry on the last mile', () => {
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.FAILED),
    ).toBe(true);
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.FAILED, ShipmentStatus.OUT_FOR_DELIVERY),
    ).toBe(true);
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.FAILED, ShipmentStatus.RETURNED),
    ).toBe(true);
  });

  it('rejects skipping states', () => {
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.CREATED, ShipmentStatus.DELIVERED),
    ).toBe(false);
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERED),
    ).toBe(false);
  });

  it('treats DELIVERED, RETURNED, and CANCELLED as terminal', () => {
    expect(ShipmentStatusWorkflow.isTerminal(ShipmentStatus.DELIVERED)).toBe(true);
    expect(ShipmentStatusWorkflow.isTerminal(ShipmentStatus.RETURNED)).toBe(true);
    expect(ShipmentStatusWorkflow.isTerminal(ShipmentStatus.CANCELLED)).toBe(true);
    expect(ShipmentStatusWorkflow.allowedTransitions(ShipmentStatus.DELIVERED)).toHaveLength(0);
  });

  it('only allows cancellation before the parcel enters the network', () => {
    expect(ShipmentStatusWorkflow.isCancellable(ShipmentStatus.CREATED)).toBe(true);
    expect(ShipmentStatusWorkflow.isCancellable(ShipmentStatus.PICKUP_PENDING)).toBe(true);
    expect(ShipmentStatusWorkflow.isCancellable(ShipmentStatus.PICKED_UP)).toBe(false);
    expect(ShipmentStatusWorkflow.isCancellable(ShipmentStatus.IN_TRANSIT)).toBe(false);
  });

  it('only allows editing before pickup', () => {
    expect(ShipmentStatusWorkflow.isEditable(ShipmentStatus.CREATED)).toBe(true);
    expect(ShipmentStatusWorkflow.isEditable(ShipmentStatus.PICKUP_PENDING)).toBe(true);
    expect(ShipmentStatusWorkflow.isEditable(ShipmentStatus.PICKED_UP)).toBe(false);
  });

  it('does not allow cancellation once picked up or beyond', () => {
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED),
    ).toBe(false);
    expect(
      ShipmentStatusWorkflow.canTransition(ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED),
    ).toBe(false);
  });
});
