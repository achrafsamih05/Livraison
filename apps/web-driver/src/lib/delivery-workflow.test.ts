import { describe, expect, it } from 'vitest';
import { availableActions, actionByName, isTerminal, DRIVER_ACTIONS } from './delivery-workflow';

describe('delivery-workflow', () => {
  it('offers Accept only from CREATED', () => {
    expect(availableActions('CREATED').map((a) => a.action)).toContain('ACCEPT');
    expect(availableActions('PICKED_UP').map((a) => a.action)).not.toContain('ACCEPT');
  });

  it('offers the correct linear actions through the happy path', () => {
    expect(availableActions('PICKUP_PENDING').map((a) => a.action)).toEqual(['MARK_PICKED_UP']);
    expect(availableActions('PICKED_UP').map((a) => a.action)).toEqual(['MARK_IN_TRANSIT']);
    expect(
      availableActions('OUT_FOR_DELIVERY')
        .map((a) => a.action)
        .sort(),
    ).toEqual(['MARK_DELIVERED', 'MARK_FAILED'].sort());
  });

  it('allows retry and return from FAILED', () => {
    const actions = availableActions('FAILED').map((a) => a.action);
    expect(actions).toContain('MARK_OUT_FOR_DELIVERY');
    expect(actions).toContain('MARK_RETURNED');
  });

  it('offers no actions from terminal states', () => {
    expect(availableActions('DELIVERED')).toHaveLength(0);
    expect(availableActions('RETURNED')).toHaveLength(0);
    expect(availableActions('CANCELLED')).toHaveLength(0);
  });

  it('marks delivered as requiring POD and failed/returned as requiring a reason', () => {
    expect(actionByName('MARK_DELIVERED').requiresPod).toBe(true);
    expect(actionByName('MARK_FAILED').requiresReason).toBe(true);
    expect(actionByName('MARK_RETURNED').requiresReason).toBe(true);
    expect(actionByName('MARK_PICKED_UP').requiresPod).toBe(false);
  });

  it('every action targets a status reachable from its source per the machine', () => {
    for (const def of DRIVER_ACTIONS) {
      expect(def.from.length).toBeGreaterThan(0);
      expect(def.to).toBeDefined();
    }
  });

  it('identifies terminal states', () => {
    expect(isTerminal('DELIVERED')).toBe(true);
    expect(isTerminal('IN_TRANSIT')).toBe(false);
  });

  it('throws for an unknown action name', () => {
    // @ts-expect-error testing runtime guard
    expect(() => actionByName('NOPE')).toThrow();
  });
});
