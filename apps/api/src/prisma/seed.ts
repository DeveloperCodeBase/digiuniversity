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

  // ---------- Phase 3: university domain demo data ----------
  // Idempotent: every upsert keys on a tenant-scoped natural id. Re-runs
  // are no-ops once the demo content exists.
  console.log(`[seed] ensuring demo university structure`);

  const faculty = await prisma.faculty.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "engineering" } },
    update: {},
    create: {
      tenantId: tenant.id,
      slug: "engineering",
      name: "دانشکده مهندسی",
      description: "Faculty of Engineering",
    },
  });

  const department = await prisma.department.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "computer-science" } },
    update: {},
    create: {
      tenantId: tenant.id,
      facultyId: faculty.id,
      slug: "computer-science",
      name: "علوم کامپیوتر",
      description: "Department of Computer Science",
    },
  });

  const program = await prisma.program.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "bsc-cs" } },
    update: {},
    create: {
      tenantId: tenant.id,
      departmentId: department.id,
      slug: "bsc-cs",
      name: "کارشناسی علوم کامپیوتر",
      degreeLevel: "bachelor",
      durationSemesters: 8,
    },
  });

  const cohort = await prisma.cohort.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "1405-fall" } },
    update: {},
    create: {
      tenantId: tenant.id,
      programId: program.id,
      slug: "1405-fall",
      name: "ورودی پاییز ۱۴۰۵",
      startDate: new Date("2026-09-23T00:00:00Z"),
    },
  });

  const course = await prisma.course.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "CS101" } },
    update: {},
    create: {
      tenantId: tenant.id,
      programId: program.id,
      code: "CS101",
      title: "مقدمه‌ای بر علوم کامپیوتر",
      description: "Introduction to Computer Science",
      credits: 3,
      language: "fa",
      level: "beginner",
    },
  });

  // Two modules + a couple of lessons each, just enough to demonstrate
  // a real course shape.
  const m1 = await prisma.courseModule.upsert({
    where: { id: `seed_${tenant.id}_${course.id}_m1` },
    update: {},
    create: {
      id: `seed_${tenant.id}_${course.id}_m1`,
      tenantId: tenant.id,
      courseId: course.id,
      title: "مفاهیم پایه",
      orderIndex: 0,
    },
  });
  const m2 = await prisma.courseModule.upsert({
    where: { id: `seed_${tenant.id}_${course.id}_m2` },
    update: {},
    create: {
      id: `seed_${tenant.id}_${course.id}_m2`,
      tenantId: tenant.id,
      courseId: course.id,
      title: "الگوریتم‌ها",
      orderIndex: 1,
    },
  });
  const lessons = [
    { mod: m1, idx: 0, title: "حساب و منطق", minutes: 45 },
    { mod: m1, idx: 1, title: "متغیرها و توابع", minutes: 60 },
    { mod: m2, idx: 0, title: "ساختمان داده‌ها", minutes: 60 },
    { mod: m2, idx: 1, title: "پیچیدگی زمانی", minutes: 50 },
  ];
  for (const l of lessons) {
    await prisma.lesson.upsert({
      where: { id: `seed_${tenant.id}_${l.mod.id}_l${l.idx}` },
      update: {},
      create: {
        id: `seed_${tenant.id}_${l.mod.id}_l${l.idx}`,
        tenantId: tenant.id,
        moduleId: l.mod.id,
        title: l.title,
        durationMinutes: l.minutes,
        orderIndex: l.idx,
      },
    });
  }

  console.log(
    `[seed] university: faculty=${faculty.slug}, department=${department.slug}, ` +
      `program=${program.slug}, cohort=${cohort.slug}, course=${course.code}`,
  );

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
