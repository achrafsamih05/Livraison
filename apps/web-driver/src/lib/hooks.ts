'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError, type ShipmentQuery } from '@/lib/api';
import type { LoginInput } from '@/lib/schemas';
import type { DriverProfile, Paginated, Shipment } from '@/lib/types';
import type { DriverActionDef } from '@/lib/delivery-workflow';
import type { ProofOfDelivery } from '@/lib/types';
import { outbox } from '@/offline/outbox';
import { flushOutbox } from '@/offline/sync';
import { useConnectivityStore } from '@/stores/connectivity-store';

export const keys = {
  me: ['me'] as const,
  shipments: (q: ShipmentQuery) => ['shipments', q] as const,
  shipment: (id: string) => ['shipment', id] as const,
};

export function useMe(): UseQueryResult<DriverProfile, ApiError> {
  return useQuery({ queryKey: keys.me, queryFn: () => api.me(), retry: false });
}

export function useLogin(): UseMutationResult<{ user: DriverProfile }, ApiError, LoginInput> {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (data) => {
      qc.setQueryData(keys.me, data.user);
      router.replace('/dashboard');
    },
    onError: (error) =>
      toast.error(error.code === 'UNAUTHORIZED' ? 'Invalid credentials.' : error.message),
  });
}

export function useLogout(): UseMutationResult<void, ApiError, void> {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      qc.clear();
      router.replace('/login');
    },
  });
}

export function useShipments(query: ShipmentQuery): UseQueryResult<Paginated<Shipment>, ApiError> {
  return useQuery({
    queryKey: keys.shipments(query),
    queryFn: () => api.listShipments(query),
    placeholderData: keepPreviousData,
  });
}

export function useShipment(id: string): UseQueryResult<Shipment, ApiError> {
  return useQuery({
    queryKey: keys.shipment(id),
    queryFn: () => api.getShipment(id),
    enabled: id.length > 0,
  });
}

async function refreshPending(): Promise<void> {
  const count = await outbox.pendingCount();
  useConnectivityStore.getState().setPendingCount(count);
}

export interface PerformActionInput {
  shipmentId: string;
  def: DriverActionDef;
  reason?: string;
  pod?: ProofOfDelivery;
}

/**
 * Offline-first action: every driver action is written to the durable outbox
 * first (so it survives reload and offline), then a flush is attempted. The UI
 * optimistically reflects the new status; the backend reconciles on sync.
 */
export function usePerformAction(): UseMutationResult<void, Error, PerformActionInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shipmentId, def, reason, pod }: PerformActionInput) => {
      await outbox.enqueue({
        kind: 'STATUS_TRANSITION',
        shipmentId,
        payload: { status: def.to, reason: reason ?? def.label },
      });
      if (def.requiresPod && pod !== undefined) {
        await outbox.enqueue({ kind: 'POD', shipmentId, payload: pod });
      }
      await refreshPending();
      if (navigator.onLine) {
        await flushOutbox();
        useConnectivityStore.getState().setLastSyncAt(Date.now());
        await refreshPending();
      }
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: keys.shipment(variables.shipmentId) });
      void qc.invalidateQueries({ queryKey: ['shipments'] });
      toast.success(
        navigator.onLine
          ? `${variables.def.label} recorded.`
          : `${variables.def.label} queued (offline).`,
      );
    },
    onError: () => toast.error('Could not record the action. It will retry when online.'),
  });
}

export function useCaptureLocation(): UseMutationResult<
  void,
  Error,
  { shipmentId: string; geo: unknown }
> {
  return useMutation({
    mutationFn: async ({ shipmentId, geo }: { shipmentId: string; geo: unknown }) => {
      await outbox.enqueue({ kind: 'LOCATION', shipmentId, payload: geo });
      await refreshPending();
      if (navigator.onLine) {
        await flushOutbox();
        await refreshPending();
      }
    },
  });
}
