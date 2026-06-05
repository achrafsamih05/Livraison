import { create } from 'zustand';
import type { GeoFix } from '@/lib/types';

const MAX_HISTORY = 50;

interface LocationState {
  current: GeoFix | null;
  history: GeoFix[];
  watching: boolean;
  error: string | null;
  setWatching: (watching: boolean) => void;
  setError: (error: string | null) => void;
  pushFix: (fix: GeoFix) => void;
}

/**
 * Holds the driver's last known GPS position and a bounded history for the
 * route display. Capped to MAX_HISTORY to avoid unbounded memory growth on
 * long shifts.
 */
export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  history: [],
  watching: false,
  error: null,
  setWatching: (watching) => set({ watching }),
  setError: (error) => set({ error }),
  pushFix: (fix) =>
    set((state) => ({
      current: fix,
      error: null,
      history: [...state.history, fix].slice(-MAX_HISTORY),
    })),
}));
