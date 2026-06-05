import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushOutbox } from './sync';
import { outbox } from './outbox';
import { __resetDbForTests, type OutboxItem } from './db';

describe('flushOutbox', () => {
  beforeEach(async () => {
    __resetDbForTests();
    await outbox.clear();
  });

  it('sends each pending item and removes it on success', async () => {
    await outbox.enqueue({
      kind: 'STATUS_TRANSITION',
      shipmentId: 's1',
      payload: { status: 'PICKED_UP' },
    });
    await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: {} });

    const sent: OutboxItem[] = [];
    const result = await flushOutbox(async (item) => {
      sent.push(item);
    });

    expect(sent).toHaveLength(2);
    expect(result.flushed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('keeps failed items queued for retry and reports failure', async () => {
    await outbox.enqueue({ kind: 'POD', shipmentId: 's1', payload: {} });

    const result = await flushOutbox(async () => {
      throw new Error('HTTP 503');
    });

    expect(result.flushed).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);
    const all = await outbox.all();
    expect(all[0]?.attempts).toBe(1);
    expect(all[0]?.lastError).toContain('503');
  });

  it('passes the idempotency key through to the sender', async () => {
    await outbox.enqueue({
      kind: 'STATUS_TRANSITION',
      shipmentId: 's1',
      payload: {},
      idempotencyKey: 'idem-123',
    });
    const sender = vi.fn((_item: OutboxItem) => Promise.resolve());
    await flushOutbox(sender);
    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender.mock.calls[0]?.[0].idempotencyKey).toBe('idem-123');
  });

  it('retries a previously failed item on a subsequent flush', async () => {
    await outbox.enqueue({ kind: 'LOCATION', shipmentId: 's1', payload: {} });
    await flushOutbox(async () => {
      throw new Error('offline');
    });
    const second = await flushOutbox(async () => undefined);
    expect(second.flushed).toBe(1);
    expect(second.remaining).toBe(0);
  });
});
