import { create } from 'zustand';

interface ConnectivityState {
  online: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncAt: (ts: number) => void;
}

/**
 * Tracks connectivity and the offline outbox depth so the UI can surface an
 * accurate "X changes will sync" indicator and an offline banner.
 */
export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (online) => set({ online }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
