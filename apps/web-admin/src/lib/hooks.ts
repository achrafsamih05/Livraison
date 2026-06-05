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
import type {
  CreateTenantInput,
  CreateUserInput,
  LoginInput,
  UpdateTenantInput,
  UpdateUserInput,
} from '@/lib/schemas';
import type {
  AdminUser,
  AuditLogEntry,
  Paginated,
  SessionUser,
  Shipment,
  Tenant,
  UserStatus,
} from '@/lib/types';

export const keys = {
  me: ['me'] as const,
  users: ['users'] as const,
  tenants: ['tenants'] as const,
  shipments: (q: ShipmentQuery) => ['shipments', q] as const,
  audit: (id: string) => ['audit', id] as const,
};

export function useMe(): UseQueryResult<SessionUser, ApiError> {
  return useQuery({ queryKey: keys.me, queryFn: () => api.me(), retry: false });
}

export function useLogin(): UseMutationResult<{ user: SessionUser }, ApiError, LoginInput> {
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

export function useUsers(): UseQueryResult<AdminUser[], ApiError> {
  return useQuery({ queryKey: keys.users, queryFn: () => api.listUsers() });
}

export function useCreateUser(): UseMutationResult<AdminUser, ApiError, CreateUserInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => api.createUser(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.users });
      toast.success('User created.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateUser(id: string): UseMutationResult<AdminUser, ApiError, UpdateUserInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => api.updateUser(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.users });
      toast.success('User updated.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSetUserStatus(): UseMutationResult<
  AdminUser,
  ApiError,
  { id: string; status: UserStatus }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.setUserStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.users });
      toast.success('Status updated.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useTenants(): UseQueryResult<Tenant[], ApiError> {
  return useQuery({ queryKey: keys.tenants, queryFn: () => api.listTenants() });
}

export function useCreateTenant(): UseMutationResult<Tenant, ApiError, CreateTenantInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => api.createTenant(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.tenants });
      toast.success('Tenant created.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTenant(
  id: string,
): UseMutationResult<Tenant, ApiError, UpdateTenantInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantInput) => api.updateTenant(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.tenants });
      toast.success('Tenant updated.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useShipments(query: ShipmentQuery): UseQueryResult<Paginated<Shipment>, ApiError> {
  return useQuery({
    queryKey: keys.shipments(query),
    queryFn: () => api.listShipments(query),
    placeholderData: keepPreviousData,
  });
}

export function useAudit(shipmentId: string): UseQueryResult<Paginated<AuditLogEntry>, ApiError> {
  return useQuery({
    queryKey: keys.audit(shipmentId),
    queryFn: () => api.listAudit(shipmentId),
    enabled: shipmentId.length > 0,
  });
}
