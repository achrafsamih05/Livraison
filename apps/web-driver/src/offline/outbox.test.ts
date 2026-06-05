import { beforeEach, describe, expect, it } from 'vitest';
import { outbox } from './outbox';
import { __resetDbForTests } from './db';

async function freshDb(): Promise<void> {
  __resetDbForTests();
  indexedDB.deleteDatabase('livraison-driver');
  await outbox.clear().catch(() => undefined);
}

describe('offline outbox', () => {
  beforeEach(async () => {
    __resetDbForTests();
    await outbox.clear();
  });

  it('enqueues an item as PENDING with an idempotency key', async () => {
    const item = await outbox.enqueue({
      kind: 'STATUS_TRANSITION',
      shipmentId: 's1',
      payload: { status: 'PICKED_UP' },
    });
    expect(item.status).toBe('PENDING');
    expect(item.idempotencyKey).toBeTruthy();
    expect(item.attempts).toBe(0);
    expect(await outbox.pendingCount()).toBe(1);
  });

  it('preserves a provided idempotency key', async () => {
    const item = await outbox.enqueue({
      kind: 'POD',
      shipmentId: 's1',
      payload: {},
      idempotencyKey: 'fixed-key',
    });
    expect(item.idempotencyKey).toBe('fixed-key');
  });

  it('removes an item when marked done', async () => {
    const item = await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: {} });
    await outbox.markDone(item.id);
    expect(await outbox.pendingCount()).toBe(0);
  });

  it('increments attempts and records the error when failed', async () => {
    const item = await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: {} });
    await outbox.markFailed(item.id, 'network');
    const all = await outbox.all();
    const updated = all.find((i) => i.id === item.id);
    expect(updated?.status).toBe('FAILED');
    expect(updated?.attempts).toBe(1);
    expect(updated?.lastError).toBe('network');
  });

  it('still treats failed items (under max attempts) as pending for retry', async () => {
    const item = await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: {} });
    await outbox.markFailed(item.id, 'boom');
    expect(await outbox.pendingCount()).toBe(1);
  });

  it('orders pending items by creation time', async () => {
    const a = await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: { n: 1 } });
    const b = await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: { n: 2 } });
    const pending = await outbox.pending();
    expect(pending[0]?.id).toBe(a.id);
    expect(pending[1]?.id).toBe(b.id);
  });
});
