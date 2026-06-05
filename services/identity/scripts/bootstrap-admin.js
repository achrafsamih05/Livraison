/**
 * One-off local bootstrap: creates an initial tenant + admin user so the
 * platform can be exercised end-to-end (login). Idempotent — safe to re-run.
 *
 * Usage (inside the identity container, where @prisma/client + argon2 exist):
 *   node scripts/bootstrap-admin.js
 *
 * Configurable via env:
 *   BOOTSTRAP_TENANT_SLUG (default: demo)
 *   BOOTSTRAP_TENANT_NAME (default: Demo Logistics)
 *   BOOTSTRAP_ADMIN_EMAIL (default: admin@demo.test)
 *   BOOTSTRAP_ADMIN_PASSWORD (default: ChangeMe!12345)
 */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const slug = process.env.BOOTSTRAP_TENANT_SLUG || 'demo';
  const name = process.env.BOOTSTRAP_TENANT_NAME || 'Demo Logistics';
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@demo.test').toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'ChangeMe!12345';

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: { slug, name, status: 'ACTIVE' },
  });

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { passwordHash, status: 'ACTIVE', roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      status: 'ACTIVE',
      roles: ['TENANT_ADMIN', 'SUPER_ADMIN'],
    },
  });

  console.log(JSON.stringify({ tenant: tenant.slug, email: user.email, roles: user.roles }));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
