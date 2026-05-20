import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed the demo tenant and its admin user.
 *
 * Safe to run repeatedly: every upsert keys on a natural id (slug,
 * tenantId+name, tenantId+email) so re-running is a no-op once the
 * data exists. Re-running with a different SEED_ADMIN_PASSWORD does
 * NOT silently overwrite the existing admin password — passwords are
 * the kind of thing that should change through /v1/users/me/change-password,
 * not a seed.
 */
async function main(): Promise<void> {
  const slug = process.env.SEED_TENANT_SLUG ?? "demo";
  const tenantName = process.env.SEED_TENANT_NAME ?? "DigiUniversity Demo";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@digiuniversity.ir").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";

  console.log(`[seed] ensuring tenant slug=${slug}`);
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { name: tenantName, isActive: true },
    create: { slug, name: tenantName, isActive: true },
  });

  // Default roles for every tenant.
  console.log(`[seed] ensuring default roles for tenant=${tenant.id}`);
  const defaults = [
    { name: "admin", label: "مدیر سامانه" },
    { name: "instructor", label: "استاد" },
    { name: "student", label: "دانشجو" },
  ] as const;
  for (const r of defaults) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
      update: { label: r.label },
      create: { tenantId: tenant.id, name: r.name, label: r.label },
    });
  }

  // Phase-2 starter permission catalogue. These map to the @Roles()
  // decorators we ship today; Phase 3+ extend the list.
  const seedPerms = [
    "tenant:read",
    "tenant:create",
    "user:read",
    "user:invite",
    "user:assign-role",
    "ai-log:write",
    "ai-log:read",
  ];
  for (const key of seedPerms) {
    await prisma.permission.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key } },
      update: {},
      create: { tenantId: tenant.id, key },
    });
  }
  const adminRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "admin" } },
  });
  const allPerms = await prisma.permission.findMany({
    where: { tenantId: tenant.id, key: { in: seedPerms } },
  });
  if (adminRole) {
    for (const p of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: p.id },
      });
    }
  }

  // Admin user. Only created the first time; we never overwrite the
  // password from the seed env after that.
  console.log(`[seed] ensuring admin user email=${adminEmail}`);
  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
  });
  if (existing) {
    console.log(`[seed] admin user already exists (id=${existing.id}); skipping password set`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash,
        fullName: "Demo Admin",
        userRoles: adminRole ? { create: [{ roleId: adminRole.id }] } : undefined,
      },
    });
    console.log(`[seed] created admin user id=${user.id}`);
    if (adminPassword === "ChangeMe!2026") {
      console.warn(
        "[seed] WARNING: using the default seed password — change it via /v1/users/me/change-password",
      );
    }
  }

  console.log("[seed] done");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
