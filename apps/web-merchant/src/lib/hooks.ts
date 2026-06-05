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
import { api, ApiError, type ListShipmentParams } from '@/lib/api';
import type { CreateShipmentInput, LoginInput, ProfileInput } from '@/lib/schemas';
import type { Paginated, SessionUser, Shipment, TrackingEvent } from '@/lib/types';

export const queryKeys = {
  me: ['me'] as const,
  shipments: (params: ListShipmentParams) => ['shipments', params] as const,
  shipment: (id: string) => ['shipment', id] as const,
  timeline: (id: string) => ['timeline', id] as const,
};

export function useMe(): UseQueryResult<SessionUser, ApiError> {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.me(), retry: false });
}

export function useShipments(
  params: ListShipmentParams,
): UseQueryResult<Paginated<Shipment>, ApiError> {
  return useQuery({
    queryKey: queryKeys.shipments(params),
    queryFn: () => api.listShipments(params),
    placeholderData: keepPreviousData,
  });
}

export function useShipment(id: string): UseQueryResult<Shipment, ApiError> {
  return useQuery({
    queryKey: queryKeys.shipment(id),
    queryFn: () => api.getShipment(id),
    enabled: id.length > 0,
  });
}

export function useTimeline(id: string): UseQueryResult<TrackingEvent[], ApiError> {
  return useQuery({
    queryKey: queryKeys.timeline(id),
    queryFn: () => api.getTimeline(id),
    enabled: id.length > 0,
  });
}

export function useLogin(): UseMutationResult<{ user: SessionUser }, ApiError, LoginInput> {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.me, data.user);
      router.replace('/dashboard');
    },
    onError: (error) => {
      toast.error(error.code === 'UNAUTHORIZED' ? 'Invalid credentials.' : error.message);
    },
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

export function useCreateShipment(): UseMutationResult<Shipment, ApiError, CreateShipmentInput> {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShipmentInput) => api.createShipment(input),
    onSuccess: (shipment) => {
      void qc.invalidateQueries({ queryKey: ['shipments'] });
      toast.success(`Shipment ${shipment.trackingNumber} created.`);
      router.push(`/shipments/${shipment.id}`);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCancelShipment(
  id: string,
): UseMutationResult<Shipment, ApiError, string | undefined> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => api.cancelShipment(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.shipment(id) });
      void qc.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Shipment cancelled.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProfile(): UseMutationResult<SessionUser, ApiError, ProfileInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => api.updateProfile(input),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.me, user);
      toast.success('Profile updated.');
    },
    onError: (error) => toast.error(error.message),
  });
}
