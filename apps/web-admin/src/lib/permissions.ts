import type { PermissionDef, RoleName } from '@/lib/types';

export const ALL_ROLES: RoleName[] = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'DRIVER',
  'FINANCE',
  'SUPPORT',
  'MERCHANT',
  'CUSTOMER',
];

/**
 * Canonical permission catalog and the roles that hold each permission.
 * Mirrors the platform RBAC model (see BLUEPRINT.md permission matrix and the
 * identity service roles). Used to render the read-only Roles & Permissions
 * matrix in the admin portal.
 */
export const PERMISSIONS: PermissionDef[] = [
  { key: 'tenants:admin', resource: 'Tenants', action: 'Administer', roles: ['SUPER_ADMIN'] },
  {
    key: 'users:read',
    resource: 'Users',
    action: 'Read',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'SUPPORT'],
  },
  {
    key: 'users:write',
    resource: 'Users',
    action: 'Write',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER'],
  },
  {
    key: 'shipments:read',
    resource: 'Shipments',
    action: 'Read',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'SUPPORT', 'MERCHANT'],
  },
  {
    key: 'shipments:write',
    resource: 'Shipments',
    action: 'Write',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'MERCHANT'],
  },
  {
    key: 'shipments:cancel',
    resource: 'Shipments',
    action: 'Cancel',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'MERCHANT'],
  },
  {
    key: 'tracking:read',
    resource: 'Tracking',
    action: 'Read',
    roles: [
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'MANAGER',
      'OPERATOR',
      'SUPPORT',
      'MERCHANT',
      'CUSTOMER',
    ],
  },
  {
    key: 'finance:read',
    resource: 'Finance',
    action: 'Read',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'FINANCE'],
  },
  {
    key: 'notifications:send',
    resource: 'Notifications',
    action: 'Send',
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR'],
  },
  { key: 'audit:read', resource: 'Audit', action: 'Read', roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
];

export function roleHasPermission(perm: PermissionDef, role: RoleName): boolean {
  return perm.roles.includes(role);
}
