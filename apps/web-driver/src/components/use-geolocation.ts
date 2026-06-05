'use client';

import * as React from 'react';
import { useLocationStore } from '@/stores/location-store';
import type { GeoFix } from '@/lib/types';

/**
 * One-shot GPS capture. Returns a function that resolves the current position
 * (and records it in the location store) or rejects with a readable error.
 */
export function useCaptureCurrentPosition(): () => Promise<GeoFix> {
  const pushFix = useLocationStore((s) => s.pushFix);
  const setError = useLocationStore((s) => s.setError);

  return React.useCallback(() => {
    return new Promise<GeoFix>((resolve, reject) => {
      if (typeof navigator === 'undefined' || navigator.geolocation === undefined) {
        const message = 'Geolocation is not available on this device.';
        setError(message);
        reject(new Error(message));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const fix: GeoFix = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          };
          pushFix(fix);
          resolve(fix);
        },
        (error) => {
          setError(error.message);
          reject(new Error(error.message));
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
      );
    });
  }, [pushFix, setError]);
}

/**
 * Continuous position watch while a shift/route is active. Records fixes into
 * the location store; cleans up on unmount or when `active` becomes false.
 */
export function useWatchPosition(active: boolean): void {
  const pushFix = useLocationStore((s) => s.pushFix);
  const setWatching = useLocationStore((s) => s.setWatching);
  const setError = useLocationStore((s) => s.setError);

  React.useEffect(() => {
    if (!active || typeof navigator === 'undefined' || navigator.geolocation === undefined) {
      return;
    }
    setWatching(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        pushFix({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => setError(error.message),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => {
      navigator.geolocation.clearWatch(id);
      setWatching(false);
    };
  }, [active, pushFix, setWatching, setError]);
}
