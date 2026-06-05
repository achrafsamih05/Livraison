'use client';

import * as React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useConnectivityStore } from '@/stores/connectivity-store';
import { flushOutbox } from '@/offline/sync';
import { outbox } from '@/offline/outbox';

/**
 * Persistent connectivity indicator. Shows an offline banner and a count of
 * queued changes with a manual "Sync now" affordance when online.
 */
export function ConnectivityBanner(): React.JSX.Element | null {
  const online = useConnectivityStore((s) => s.online);
  const pending = useConnectivityStore((s) => s.pendingCount);
  const setPending = useConnectivityStore((s) => s.setPendingCount);
  const [syncing, setSyncing] = React.useState(false);

  if (online && pending === 0) {
    return null;
  }

  const onSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      await flushOutbox();
      setPending(await outbox.pendingCount());
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="status"
      className={
        online
          ? 'flex items-center justify-between gap-2 bg-warning px-4 py-2 text-sm text-warning-foreground'
          : 'flex items-center justify-between gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground'
      }
    >
      <span className="flex items-center gap-2">
        <CloudOff className="size-4" aria-hidden="true" />
        {online
          ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync`
          : 'Offline — changes are saved and will sync automatically'}
      </span>
      {online && pending > 0 ? (
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium underline-offset-2 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={syncing ? 'size-4 animate-spin' : 'size-4'} aria-hidden="true" />
          Sync now
        </button>
      ) : null}
    </div>
  );
}
