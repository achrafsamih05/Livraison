/* eslint-disable no-console */
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  AddressType,
  PrismaClient,
  ServiceLevel,
  ShipmentStatus,
  TrackingEventType,
  EventSource,
  DeliveryOutcome,
  NotificationChannel,
  NotificationStatus,
  AuditAction,
} from '../generated/client';

const prisma = new PrismaClient();

/**
 * Catalog of platform permissions. Idempotently upserted by key.
 */
const PERMISSIONS: Array<{ key: string; resource: string; action: string; description: string }> = [
  { key: 'shipments:read', resource: 'shipments', action: 'read', description: 'View shipments' },
  {
    key: 'shipments:write',
    resource: 'shipments',
    action: 'write',
    description: 'Create/update shipments',
  },
  {
    key: 'shipments:cancel',
    resource: 'shipments',
    action: 'cancel',
    description: 'Cancel shipments',
  },
  { key: 'tracking:read', resource: 'tracking', action: 'read', description: 'View tracking' },
  { key: 'users:read', resource: 'users', action: 'read', description: 'View users' },
  { key: 'users:write', resource: 'users', action: 'write', description: 'Manage users' },
  { key: 'tenants:admin', resource: 'tenants', action: 'admin', description: 'Administer tenants' },
  { key: 'finance:read', resource: 'finance', action: 'read', description: 'View finance' },
  {
    key: 'notifications:send',
    resource: 'notifications',
    action: 'send',
    description: 'Send notifications',
  },
];

/**
 * System roles and the permission keys they grant.
 */
const ROLES: Array<{ key: string; name: string; permissions: string[] }> = [
  { key: 'tenant_admin', name: 'Tenant Admin', permissions: PERMISSIONS.map((p) => p.key) },
  {
    key: 'operator',
    name: 'Operator',
    permissions: ['shipments:read', 'shipments:write', 'tracking:read', 'notifications:send'],
  },
  {
    key: 'support',
    name: 'Support Agent',
    permissions: ['shipments:read', 'tracking:read', 'users:read'],
  },
  { key: 'finance', name: 'Finance Officer', permissions: ['finance:read', 'shipments:read'] },
];

async function seedPermissions(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { resource: perm.resource, action: perm.action, description: perm.description },
      create: perm,
    });
    ids.set(perm.key, row.id);
  }
  console.log(`Seeded ${ids.size} permissions`);
  return ids;
}

async function seedTenant(): Promise<string> {
  const slug = 'demo';
  const existing = await prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
  if (existing !== null) {
    console.log(`Tenant '${slug}' already exists (${existing.id})`);
    return existing.id;
  }
  const tenant = await prisma.tenant.create({
    data: { slug, name: 'Demo Logistics Co.', status: 'ACTIVE', config: { currency: 'SAR' } },
  });
  console.log(`Created tenant '${slug}' (${tenant.id})`);
  return tenant.id;
}

async function seedRoles(
  tenantId: string,
  permissionIds: Map<string, string>,
): Promise<Map<string, string>> {
  const roleIds = new Map<string, string>();
  for (const role of ROLES) {
    const existing = await prisma.role.findFirst({
      where: { tenantId, key: role.key, deletedAt: null },
    });
    const row =
      existing ??
      (await prisma.role.create({
        data: { tenantId, key: role.key, name: role.name, isSystem: true },
      }));
    roleIds.set(role.key, row.id);

    for (const permKey of role.permissions) {
      const permissionId = permissionIds.get(permKey);
      if (permissionId === undefined) {
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: row.id, permissionId } },
        update: {},
        create: { roleId: row.id, permissionId },
      });
    }
  }
  console.log(`Seeded ${roleIds.size} roles with permissions`);
  return roleIds;
}

async function seedAdminUser(tenantId: string, adminRoleId: string): Promise<string> {
  const email = 'admin@demo.local';
  const existing = await prisma.user.findFirst({ where: { tenantId, email, deletedAt: null } });
  if (existing !== null) {
    console.log(`Admin user already exists (${existing.id})`);
    return existing.id;
  }
  const passwordHash = await argon2.hash('ChangeMe!2026', { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: {
      tenantId,
      email,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRoleId } },
    update: {},
    create: { userId: user.id, roleId: adminRoleId },
  });
  console.log(`Created admin user ${email} (${user.id})`);
  return user.id;
}

async function seedSampleShipment(tenantId: string, createdBy: string): Promise<void> {
  const existing = await prisma.shipment.findFirst({ where: { tenantId, reference: 'SEED-0001' } });
  if (existing !== null) {
    console.log('Sample shipment already exists');
    return;
  }

  const origin = await prisma.address.create({
    data: {
      tenantId,
      type: AddressType.SENDER,
      contactName: 'Warehouse A',
      contactPhone: '+966500000001',
      line1: '1 Logistics Way',
      city: 'Riyadh',
      countryCode: 'SA',
      latitude: '24.713600',
      longitude: '46.675300',
    },
  });
  const destination = await prisma.address.create({
    data: {
      tenantId,
      type: AddressType.RECIPIENT,
      contactName: 'Jane Customer',
      contactPhone: '+966500000002',
      line1: '42 Palm Street',
      city: 'Jeddah',
      countryCode: 'SA',
      latitude: '21.485800',
      longitude: '39.192500',
    },
  });

  const shipment = await prisma.shipment.create({
    data: {
      tenantId,
      awb: `EX${Date.now()}SA`,
      originId: origin.id,
      destinationId: destination.id,
      status: ShipmentStatus.OUT_FOR_DELIVERY,
      service: ServiceLevel.NEXT_DAY,
      codAmount: '199.00',
      declaredValue: '199.00',
      currency: 'SAR',
      weightGrams: 1200,
      reference: 'SEED-0001',
      createdBy,
      items: {
        create: [
          {
            tenantId,
            description: 'Wireless headphones',
            sku: 'WH-001',
            quantity: 1,
            weightGrams: 1200,
            unitValue: '199.00',
          },
        ],
      },
      trackingEvents: {
        create: [
          {
            tenantId,
            type: TrackingEventType.CREATED,
            source: EventSource.SYSTEM,
            description: 'Shipment created',
          },
          {
            tenantId,
            type: TrackingEventType.PICKED_UP,
            source: EventSource.DRIVER_APP,
            description: 'Picked up from sender',
          },
          {
            tenantId,
            type: TrackingEventType.OUT_FOR_DELIVERY,
            source: EventSource.SYSTEM,
            description: 'Out for delivery',
          },
        ],
      },
      deliveryAttempts: {
        create: [
          {
            tenantId,
            attemptNo: 1,
            outcome: DeliveryOutcome.FAILED,
            reasonCode: 'CUSTOMER_NOT_HOME',
            driverId: randomUUID(),
          },
        ],
      },
      notifications: {
        create: [
          {
            tenantId,
            channel: NotificationChannel.SMS,
            status: NotificationStatus.SENT,
            recipient: '+966500000002',
            template: 'out_for_delivery',
            locale: 'ar',
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId: createdBy,
      actorType: 'user',
      action: AuditAction.CREATE,
      resourceType: 'shipment',
      resourceId: shipment.id,
      after: { awb: shipment.awb, status: shipment.status },
    },
  });

  console.log(`Created sample shipment ${shipment.awb} with items, events, attempt, notification`);
}

async function main(): Promise<void> {
  console.log('Seeding core database...');
  const permissionIds = await seedPermissions();
  const tenantId = await seedTenant();
  const roleIds = await seedRoles(tenantId, permissionIds);
  const adminRoleId = roleIds.get('tenant_admin');
  if (adminRoleId === undefined) {
    throw new Error('tenant_admin role missing after seeding');
  }
  const adminUserId = await seedAdminUser(tenantId, adminRoleId);
  await seedSampleShipment(tenantId, adminUserId);
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
