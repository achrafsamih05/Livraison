import { outbox } from './outbox';
import type { OutboxItem } from './db';

export interface SyncResult {
  flushed: number;
  failed: number;
  remaining: number;
}

type Sender = (item: OutboxItem) => Promise<void>;

/**
 * Maps an outbox item to the BFF endpoint that applies it. Each call carries
 * the item's idempotency key so server-side dedupe makes retries safe.
 */
async function defaultSender(item: OutboxItem): Promise<void> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'idempotency-key': item.idempotencyKey,
  };

  let url: string;
  if (item.kind === 'STATUS_TRANSITION') {
    url = `/api/bff/shipments/${item.shipmentId}/transition`;
  } else if (item.kind === 'POD') {
    url = `/api/bff/shipments/${item.shipmentId}/pod`;
  } else {
    url = `/api/bff/shipments/${item.shipmentId}/location`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(item.payload),
  });

  if (!response.ok) {
    // 4xx (except 429) are permanent for this payload; surface for inspection
    // but do not infinitely retry client errors other than rate limiting.
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
}

let running = false;

/**
 * Flushes all pending outbox items in order. Concurrency-guarded so overlapping
 * triggers (online event + interval + manual) do not double-send.
 */
export async function flushOutbox(sender: Sender = defaultSender): Promise<SyncResult> {
  if (running) {
    return { flushed: 0, failed: 0, remaining: await outbox.pendingCount() };
  }
  running = true;
  let flushed = 0;
  let failed = 0;
  try {
    const items = await outbox.pending();
    for (const item of items) {
      await outbox.markInFlight(item.id);
      try {
        await sender(item);
        await outbox.markDone(item.id);
        flushed += 1;
      } catch (error) {
        await outbox.markFailed(item.id, error instanceof Error ? error.message : 'unknown');
        failed += 1;
      }
    }
  } finally {
    running = false;
  }
  return { flushed, failed, remaining: await outbox.pendingCount() };
}

/**
 * Registers automatic flush triggers: on regaining connectivity, on tab
 * focus/visibility, and on a periodic interval. Returns a disposer.
 */
export function startAutoSync(intervalMs = 30_000): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const trigger = (): void => {
    if (navigator.onLine) {
      void flushOutbox();
    }
  };
  const onVisible = (): void => {
    if (document.visibilityState === 'visible') {
      trigger();
    }
  };
  window.addEventListener('online', trigger);
  document.addEventListener('visibilitychange', onVisible);
  const interval = window.setInterval(trigger, intervalMs);
  trigger();

  return () => {
    window.removeEventListener('online', trigger);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(interval);
  };
}
