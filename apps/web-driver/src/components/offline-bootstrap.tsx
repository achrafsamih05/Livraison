'use client';

import * as React from 'react';
import { startAutoSync, flushOutbox } from '@/offline/sync';
import { outbox } from '@/offline/outbox';
import { useConnectivityStore } from '@/stores/connectivity-store';

/**
 * Wires the offline subsystem on mount: registers the service worker for PWA
 * installability/offline shell, starts the outbox auto-sync triggers, and
 * keeps the connectivity store (online flag + pending count) in sync.
 */
export function OfflineBootstrap(): null {
  const setOnline = useConnectivityStore((s) => s.setOnline);
  const setPendingCount = useConnectivityStore((s) => s.setPendingCount);
  const setLastSyncAt = useConnectivityStore((s) => s.setLastSyncAt);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const updateOnline = (): void => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    const refreshCount = (): void => {
      void outbox.pendingCount().then(setPendingCount);
    };
    refreshCount();
    const countInterval = window.setInterval(refreshCount, 5_000);

    const dispose = startAutoSync(30_000);
    const onSynced = (): void => {
      setLastSyncAt(Date.now());
      refreshCount();
    };
    window.addEventListener('online', onSynced);

    // Initial flush attempt if already online.
    if (navigator.onLine) {
      void flushOutbox().then(onSynced);
    }

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('online', onSynced);
      window.clearInterval(countInterval);
      dispose();
    };
  }, [setOnline, setPendingCount, setLastSyncAt]);

  return null;
}
