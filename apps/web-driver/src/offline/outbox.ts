import { getDb, type OutboxItem, type OutboxKind } from './db';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface EnqueueInput {
  kind: OutboxKind;
  shipmentId: string;
  payload: unknown;
  /** Optional explicit idempotency key; generated if omitted. */
  idempotencyKey?: string;
}

const MAX_ATTEMPTS = 8;

export const outbox = {
  async enqueue(input: EnqueueInput): Promise<OutboxItem> {
    const db = await getDb();
    const now = Date.now();
    const item: OutboxItem = {
      id: uuid(),
      kind: input.kind,
      shipmentId: input.shipmentId,
      idempotencyKey: input.idempotencyKey ?? uuid(),
      payload: input.payload,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('outbox', item);
    return item;
  },

  async all(): Promise<OutboxItem[]> {
    const db = await getDb();
    return (await db.getAll('outbox')).sort((a, b) => a.createdAt - b.createdAt);
  },

  async pending(): Promise<OutboxItem[]> {
    const db = await getDb();
    const items = await db.getAllFromIndex('outbox', 'by-status', 'PENDING');
    const failed = await db.getAllFromIndex('outbox', 'by-status', 'FAILED');
    return [...items, ...failed]
      .filter((i) => i.attempts < MAX_ATTEMPTS)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  async pendingCount(): Promise<number> {
    return (await this.pending()).length;
  },

  async markInFlight(id: string): Promise<void> {
    await this.patch(id, { status: 'IN_FLIGHT' });
  },

  async markDone(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('outbox', id);
  },

  async markFailed(id: string, error: string): Promise<void> {
    const db = await getDb();
    const item = await db.get('outbox', id);
    if (item === undefined) {
      return;
    }
    item.status = 'FAILED';
    item.attempts += 1;
    item.lastError = error;
    item.updatedAt = Date.now();
    await db.put('outbox', item);
  },

  async patch(id: string, patch: Partial<OutboxItem>): Promise<void> {
    const db = await getDb();
    const item = await db.get('outbox', id);
    if (item === undefined) {
      return;
    }
    await db.put('outbox', { ...item, ...patch, updatedAt: Date.now() });
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear('outbox');
  },
};
