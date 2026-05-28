import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../auth/password";

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
  // Phase-15 R1: full 9-role set (was 5 after Phase 14.6). The 4 new
  // ones extend RBAC for the audit's recommended hierarchy:
  //   - ta              — teaching assistant; subset of instructor
  //   - content_manager — author + publish lessons across courses
  //   - support         — view-all + impersonate + refund (no schema changes)
  //   - moderator       — flag/hide content, suspend users
  //   - super_admin     — cross-tenant operations
  // Role NAMES use snake_case (matches the api convention; user.roles[]
  // exposes these to the frontend which maps them to RoleId).
  console.log(`[seed] ensuring default roles for tenant=${tenant.id}`);
  const defaults = [
    { name: "admin", label: "مدیر سامانه" },
    { name: "instructor", label: "استاد" },
    { name: "student", label: "دانشجو" },
    { name: "parent", label: "والد" },
    { name: "org", label: "سازمان" },
    { name: "ta", label: "دستیار آموزشی" },
    { name: "content_manager", label: "مدیر محتوا" },
    { name: "support", label: "پشتیبانی" },
    { name: "moderator", label: "ناظر" },
    { name: "super_admin", label: "ادمین کل" },
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
    const passwordHash = await hashPassword(adminPassword);
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

  // ---------- Phase 11 + 14.6: demo users for every role ----------
  // The demo tenant ships with one user per role so the LoginPage
  // role tabs are all live and an auditor can exercise every nav set
  // without admin having to create them by hand. Idempotent on
  // (tenantId, email).
  //
  // ALL credentials are documented in docs/DEMO_USERS.md.
  const instructorRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "instructor" } },
  });
  const studentRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "student" } },
  });
  const parentRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "parent" } },
  });
  const orgRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "org" } },
  });
  // Phase-15 R7: lookup the 5 roles added in R1 so we can seed a demo
  // user for each. Without these, the LoginPage role-tab demo creds
  // panel would have entries for roles with no actual user to log in.
  const taRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "ta" } },
  });
  const contentManagerRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "content_manager" } },
  });
  const supportRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "support" } },
  });
  const moderatorRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "moderator" } },
  });
  const superAdminRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: "super_admin" } },
  });
  const demoUsers: Array<{ email: string; fullName: string; password: string; roleId?: string }> = [
    {
      email: "instructor1@digiuniversity.ir",
      fullName: "استاد علی رضایی",
      password: process.env.SEED_INSTRUCTOR_PASSWORD ?? "InstructorPass!1",
      roleId: instructorRole?.id,
    },
    {
      email: "student1@digiuniversity.ir",
      fullName: "نرگس رضوی",
      password: process.env.SEED_STUDENT_PASSWORD ?? "StudentPass!1",
      roleId: studentRole?.id,
    },
    {
      email: "parent1@digiuniversity.ir",
      fullName: "محمد رضوی",
      password: process.env.SEED_PARENT_PASSWORD ?? "ParentPass!1",
      roleId: parentRole?.id,
    },
    {
      email: "org1@digiuniversity.ir",
      fullName: "شرکت دانش‌بنیان فردا",
      password: process.env.SEED_ORG_PASSWORD ?? "OrgPass!1",
      roleId: orgRole?.id,
    },
    {
      email: "ta1@digiuniversity.ir",
      fullName: "سینا کریمی",
      password: process.env.SEED_TA_PASSWORD ?? "TaPass!1",
      roleId: taRole?.id,
    },
    {
      email: "cm1@digiuniversity.ir",
      fullName: "ندا رحمانی",
      password: process.env.SEED_CONTENT_MANAGER_PASSWORD ?? "ContentPass!1",
      roleId: contentManagerRole?.id,
    },
    {
      email: "support1@digiuniversity.ir",
      fullName: "حسین مرادی",
      password: process.env.SEED_SUPPORT_PASSWORD ?? "SupportPass!1",
      roleId: supportRole?.id,
    },
    {
      email: "moderator1@digiuniversity.ir",
      fullName: "زهرا فرجی",
      password: process.env.SEED_MODERATOR_PASSWORD ?? "ModeratorPass!1",
      roleId: moderatorRole?.id,
    },
    {
      email: "superadmin@digiuniversity.ir",
      fullName: "علی هاشمی",
      password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? "SuperAdminPass!1",
      roleId: superAdminRole?.id,
    },
  ];
  for (const u of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
    });
    if (existingUser) {
      console.log(`[seed] demo user ${u.email} already exists; skipping`);
      continue;
    }
    const hash = await hashPassword(u.password);
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: u.email,
        passwordHash: hash,
        fullName: u.fullName,
        userRoles: u.roleId ? { create: [{ roleId: u.roleId }] } : undefined,
      },
    });
    console.log(`[seed] created demo user ${u.email}`);
  }

  // ---------- Phase 3: university domain demo data ----------
  // Idempotent: every upsert keys on a tenant-scoped natural id. Re-runs
  // are no-ops once the demo content exists.
  console.log(`[seed] ensuring demo university structure`);

  // Phase B R1 (D63) — School sits above Faculty. Seed one demo School so
  // the existing engineering Faculty has a parent. Idempotent: upsert keyed
  // on (tenantId, slug). Re-runs are no-ops.
  const school = await prisma.school.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "stem" } },
    update: {
      nameEn: "School of Science, Technology, Engineering & Math",
      shortCode: "STEM",
    },
    create: {
      tenantId: tenant.id,
      slug: "stem",
      nameFa: "دانشکده‌ی علوم، فناوری، مهندسی و ریاضی",
      nameEn: "School of Science, Technology, Engineering & Math",
      shortCode: "STEM",
      description: "دانشکده‌ی پایه‌ای رشته‌های فنی-مهندسی و علوم",
      sortOrder: 10,
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "engineering" } },
    // Phase B R1 (D63) — update path backfills the new additive columns
    // on existing seeded Faculty row (idempotent across reseeds).
    update: {
      schoolId: school.id,
      nameEn: "Faculty of Engineering",
      shortCode: "ENG",
    },
    create: {
      tenantId: tenant.id,
      schoolId: school.id,
      slug: "engineering",
      name: "دانشکده مهندسی",
      nameEn: "Faculty of Engineering",
      shortCode: "ENG",
      description: "Faculty of Engineering",
    },
  });

  const department = await prisma.department.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "computer-science" } },
    // Phase B R1 (D63) — backfill nameEn + shortCode on existing seed.
    update: {
      nameEn: "Department of Computer Science",
      shortCode: "CS",
    },
    create: {
      tenantId: tenant.id,
      facultyId: faculty.id,
      slug: "computer-science",
      name: "علوم کامپیوتر",
      nameEn: "Department of Computer Science",
      shortCode: "CS",
      description: "Department of Computer Science",
    },
  });

  const program = await prisma.program.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "bsc-cs" } },
    // Phase B R1 (D63) — backfill nameEn + shortCode on existing seed.
    update: {
      nameEn: "B.Sc. in Computer Science",
      shortCode: "BSC-CS",
    },
    create: {
      tenantId: tenant.id,
      departmentId: department.id,
      slug: "bsc-cs",
      name: "کارشناسی علوم کامپیوتر",
      nameEn: "B.Sc. in Computer Science",
      shortCode: "BSC-CS",
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

  // Phase B R2 (D65) — seed sample CourseOffering linked to existing
  // Cohort via legacyCohortId. Demonstrates the dual-source pattern:
  // the offering is the modern surface, the cohort stays alive during
  // the Sunset window per MIGRATION_POLICY §6.
  const offering = await prisma.courseOffering.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "1405-fall-cs-online" } },
    update: {},
    create: {
      tenantId: tenant.id,
      programId: program.id,
      slug: "1405-fall-cs-online",
      nameFa: "ترم پاییز ۱۴۰۵ — مقدمه‌ای بر علوم کامپیوتر (برخط)",
      nameEn: "Fall 1405 — Intro to Computer Science (Online)",
      shortCode: "F1405-CS-ON",
      description: "First offering migrated from cohort 1405-fall as part of Phase B R2 dual-write demo.",
      startDate: new Date("2026-09-23T00:00:00Z"),
      endDate: new Date("2027-01-31T23:59:59Z"),
      capacity: 60,
      mode: "HYBRID",
      status: "OPEN",
      legacyCohortId: cohort.id,
    },
  });

  // Mark the Cohort as upgraded — the dual-write interceptor would do
  // this at runtime; the seed pre-populates the backlink for the demo.
  await prisma.cohort.update({
    where: { id: cohort.id },
    data: { upgradedToOfferingId: offering.id },
  });

  // Seed a MigrationSyncLog row recording the upgrade. Backfills count
  // as `action: "backfill"` per MIGRATION_POLICY §1.
  await prisma.migrationSyncLog.create({
    data: {
      tenantId: tenant.id,
      source: "Cohort",
      target: "CourseOffering",
      rowId: cohort.id,
      targetId: offering.id,
      action: "backfill",
      notes: "seed-time backfill: 1405-fall → 1405-fall-cs-online",
      syncedBy: "system",
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

  // ---------- Phase 6: a demo upcoming class session + recording ----------
  // The session is anchored to a deterministic id so re-seeding is a no-op.
  const sessionId = `seed_${tenant.id}_${course.id}_s1`;
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
  const end = new Date(start.getTime() + 90 * 60 * 1000);   // +90 min

  await prisma.classSession.upsert({
    where: { id: sessionId },
    update: {},
    create: {
      id: sessionId,
      tenantId: tenant.id,
      courseId: course.id,
      title: "جلسه افتتاحیه — مقدمه‌ای بر علوم کامپیوتر",
      description:
        "مرور سرفصل‌ها، معرفی استاد، روش ارزیابی و معرفی پروژه نیمسال.",
      scheduledStart: start,
      scheduledEnd: end,
      status: "scheduled",
      joinPolicy: "enrolled",
      provider: "mock",
      providerMeetingId: "mock_seed_cs101_s1",
      joinUrl: "https://digiuniversity.ir/#classroom/mock_seed_cs101_s1",
    },
  });

  const recordingId = `seed_${tenant.id}_${sessionId}_rec`;
  await prisma.recording.upsert({
    where: { classSessionId: sessionId },
    update: {},
    create: {
      id: recordingId,
      tenantId: tenant.id,
      classSessionId: sessionId,
      status: "ready",
      mediaUrl: "s3://recordings/demo/cs101-s1.mp4",
      transcriptUrl: "s3://transcripts/demo/cs101-s1.json",
      durationSeconds: 5400,
    },
  });

  console.log(`[seed] class session ${sessionId} scheduled at ${start.toISOString()}`);

  // ---------- Phase 7: a demo quiz + 3 multiple-choice questions ----------
  const quizId = `seed_${tenant.id}_${course.id}_quiz1`;
  const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // a week out
  const quiz = await prisma.assessment.upsert({
    where: { id: quizId },
    update: {},
    create: {
      id: quizId,
      tenantId: tenant.id,
      courseId: course.id,
      kind: "quiz",
      title: "آزمون فصل اول — مفاهیم پایه",
      description: "آزمون چندگزینه‌ای از مفاهیم درس‌های ۱ و ۲.",
      instructions: "هر سوال یک پاسخ صحیح دارد. زمان: ۲۰ دقیقه.",
      status: "published",
      publishedAt: new Date(),
      dueAt,
    },
  });

  type SeedQuestion = {
    suffix: string;
    prompt: string;
    options: string[];
    correctAnswer: number;
    points: number;
  };
  const seedQs: SeedQuestion[] = [
    {
      suffix: "q1",
      prompt: "کدام گزینه تعریف overfitting را بهتر بیان می‌کند؟",
      options: [
        "مدل روی داده آموزشی بیش از حد دقیق می‌شود و تعمیم نمی‌دهد",
        "مدل به اندازه کافی پیچیده نیست",
        "داده آموزشی و آزمون با هم یکسان‌اند",
        "هیچکدام",
      ],
      correctAnswer: 0,
      points: 2,
    },
    {
      suffix: "q2",
      prompt: "هدف مجموعه validation چیست؟",
      options: [
        "آموزش مدل",
        "ارزیابی هایپرپارامترها بدون آلودگی داده آزمون",
        "ذخیره خروجی نهایی",
        "افزایش حجم داده",
      ],
      correctAnswer: 1,
      points: 2,
    },
    {
      suffix: "q3",
      prompt:
        "پیچیدگی زمانی الگوریتم جستجوی دودویی روی یک آرایه مرتب با n عضو چیست؟",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctAnswer: 1,
      points: 1,
    },
  ];

  for (let i = 0; i < seedQs.length; i++) {
    const q = seedQs[i];
    await prisma.question.upsert({
      where: { id: `seed_${tenant.id}_${quizId}_${q.suffix}` },
      update: {},
      create: {
        id: `seed_${tenant.id}_${quizId}_${q.suffix}`,
        tenantId: tenant.id,
        assessmentId: quiz.id,
        kind: "multiple_choice",
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        orderIndex: i,
      },
    });
  }
  // Denormalised totalPoints on the assessment.
  const totalPoints = seedQs.reduce((s, q) => s + q.points, 0);
  if (quiz.totalPoints !== totalPoints) {
    await prisma.assessment.update({
      where: { id: quiz.id },
      data: { totalPoints },
    });
  }
  console.log(`[seed] quiz ${quiz.id} published (${seedQs.length} questions, ${totalPoints} pts)`);

  // ---------- Phase 9: a reference document for the tutor on CS101 ----------
  const docId = `seed_${tenant.id}_${course.id}_doc1`;
  const seedDocText = [
    "خلاصه فصل اول — مفاهیم پایه علوم کامپیوتر.",
    "",
    "تعریف overfitting: حالتی است که در آن مدل آنقدر روی داده‌های آموزشی دقیق می‌شود",
    "که توانایی تعمیم به داده‌های جدید را از دست می‌دهد. نشانه‌های آن: خطای آموزش پایین،",
    "خطای اعتبارسنجی بالا، و حساسیت زیاد به نویز.",
    "",
    "مجموعه validation: زیرمجموعه‌ای از داده‌ها که برای انتخاب هایپرپارامترها استفاده می‌شود.",
    "هرگز نباید با داده آزمون نهایی یکی باشد.",
    "",
    "پیچیدگی زمانی جستجوی دودویی (binary search) روی یک آرایه مرتب با n عنصر برابر",
    "با O(log n) است. این بهترین حالت برای جستجو در داده‌های مرتب‌شده است.",
    "",
    "مفاهیم کلیدی این فصل: تعریف الگوریتم، تحلیل پیچیدگی زمانی و فضایی،",
    "تفاوت validation و test set، و راه‌های جلوگیری از overfitting (رگولاریزاسیون،",
    "early stopping، افزایش داده).",
  ].join("\n");

  const existingDoc = await prisma.document.findUnique({ where: { id: docId } });
  if (!existingDoc) {
    await prisma.document.create({
      data: {
        id: docId,
        tenantId: tenant.id,
        courseId: course.id,
        title: "خلاصه فصل اول — مفاهیم پایه",
        kind: "text",
        language: "fa",
        content: seedDocText,
        chunks: {
          create: [
            {
              tenantId: tenant.id,
              orderIndex: 0,
              text: seedDocText,
              tokenCount: Math.ceil(seedDocText.length / 4),
            },
          ],
        },
      },
    });
    console.log(`[seed] document ${docId} created with 1 chunk`);
  }

  // ---------- Phase B R3.a (D68 + D69) — Identity backfill ----------
  // Profile is strict 1:1 with User per Q2.a. Backfill an empty Profile
  // for every existing tenant user so the /profile self-service page
  // works for everyone on first login. Idempotent (keyed on userId).
  //
  // Student + Instructor are demo-only sample rows wired to existing
  // demo users (student1@… and instructor1@…) so admin pages have
  // visible data on first deploy. Idempotent (keyed on userId UNIQUE).
  console.log(`[seed] ensuring Profile rows for all tenant users`);
  const tenantUsers = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, email: true },
  });
  let profilesCreated = 0;
  for (const u of tenantUsers) {
    // upsert keyed on userId UNIQUE — no-op once Profile exists.
    const existingProfile = await prisma.profile.findUnique({ where: { userId: u.id } });
    if (!existingProfile) {
      await prisma.profile.create({
        data: { userId: u.id, locale: null },
      });
      profilesCreated++;
    }
  }
  console.log(`[seed] Profile backfill: ${profilesCreated} created, ${tenantUsers.length - profilesCreated} already existed`);

  // Sample Instructor — wires the existing instructor1 demo user to the
  // CS Department + assigns rank + a couple of expertise tags. Used by
  // /admin/instructors and the R2 instructorId wire demo.
  const instructorUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: "instructor1@digiuniversity.ir" } },
  });
  if (instructorUser) {
    const existingInstructor = await prisma.instructor.findUnique({ where: { userId: instructorUser.id } });
    if (!existingInstructor) {
      const inst = await prisma.instructor.create({
        data: {
          tenantId: tenant.id,
          userId: instructorUser.id,
          instructorCode: "INS-001",
          departmentId: department.id,
          rank: "ASSISTANT",
          expertise: ["machine_learning", "intro_cs"],
          hireDate: new Date("2024-09-01T00:00:00Z"),
          status: "ACTIVE",
        },
      });
      console.log(`[seed] sample Instructor ${inst.instructorCode} created for instructor1`);

      // Wire the seed CourseOffering to this sample Instructor (Q3.a demo).
      // Idempotent — only sets if currently null, so re-runs don't overwrite
      // a manual reassignment.
      const offeringRow = await prisma.courseOffering.findUnique({ where: { id: offering.id } });
      if (offeringRow && offeringRow.instructorId === null) {
        await prisma.courseOffering.update({
          where: { id: offering.id },
          data: { instructorId: inst.id },
        });
        console.log(`[seed] linked offering ${offering.slug} → instructor ${inst.instructorCode}`);
      }
    } else {
      console.log(`[seed] Instructor for instructor1 already exists; skipping`);
    }
  }

  // Sample Student — wires the existing student1 demo user.
  const studentUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: "student1@digiuniversity.ir" } },
  });
  if (studentUser) {
    const existingStudent = await prisma.student.findUnique({ where: { userId: studentUser.id } });
    if (!existingStudent) {
      await prisma.student.create({
        data: {
          tenantId: tenant.id,
          userId: studentUser.id,
          studentCode: "STU-1405001",
          admissionDate: new Date("2026-09-23T00:00:00Z"),
          status: "ENROLLED",
        },
      });
      console.log(`[seed] sample Student STU-1405001 created for student1`);
    } else {
      console.log(`[seed] Student for student1 already exists; skipping`);
    }
  }

  // ---------- Phase B R3.b (D71) — sample Applications + NotificationLog ----------
  // Demonstrates the full AppStatus state machine + verification gate +
  // (for ENROLLED) the find-or-create-or-link side effect result. All
  // upserts keyed on `(tenantId, applicantEmail, programId)` (student) or
  // `(tenantId, applicantEmail)` (instructor) — re-runs are no-ops.
  //
  // We seed 5 student apps + 2 instructor apps spanning the canonical states
  // so admin smoke can verify each transition path + filter UI without
  // creating apps manually.
  console.log(`[seed] ensuring R3.b sample applications across AppStatus states`);

  const studentApplicationSamples = [
    {
      email: "applicant.submitted@digiuniversity.ir",
      fullName: "زهرا اسلامی",
      status: "SUBMITTED" as const,
      verifyEmail: false,
      verifyPhone: false,
      phone: "09120000001",
      bio: "علاقمند به علوم کامپیوتر و ML",
    },
    {
      email: "applicant.review.partial@digiuniversity.ir",
      fullName: "علی حسینی",
      status: "UNDER_REVIEW" as const,
      verifyEmail: true,
      verifyPhone: false, // demonstrates the Q4.a verification gate (incomplete)
      phone: "09120000002",
      bio: "فارغ‌التحصیل ریاضی، علاقمند به CS",
    },
    {
      email: "applicant.review.full@digiuniversity.ir",
      fullName: "نگار محمدی",
      status: "UNDER_REVIEW" as const,
      verifyEmail: true,
      verifyPhone: true, // ready to advance
      phone: "09120000003",
      bio: "کارآفرین فناوری، علاقمند به MBA + CS",
    },
    {
      email: "applicant.interview@digiuniversity.ir",
      fullName: "محمد رضایی",
      status: "INTERVIEW" as const,
      verifyEmail: true,
      verifyPhone: true,
      phone: "09120000004",
      bio: "برنامه‌نویس فرانت‌اند با ۳ سال تجربه",
    },
    {
      email: "applicant.rejected@digiuniversity.ir",
      fullName: "فاطمه کریمی",
      status: "REJECTED" as const,
      verifyEmail: true,
      verifyPhone: true,
      phone: "09120000005",
      bio: "(درخواست رد شده — نمونه)",
    },
  ];

  for (const s of studentApplicationSamples) {
    const existing = await prisma.studentApplication.findFirst({
      where: {
        tenantId: tenant.id,
        applicantEmail: s.email,
        programId: program.id,
      },
    });
    if (existing) continue;
    await prisma.studentApplication.create({
      data: {
        tenantId: tenant.id,
        programId: program.id,
        applicantFullName: s.fullName,
        applicantEmail: s.email,
        applicantPhone: s.phone,
        applicantBio: s.bio,
        applicantEmailVerifiedAt: s.verifyEmail ? new Date() : null,
        applicantPhoneVerifiedAt: s.verifyPhone ? new Date() : null,
        status: s.status,
        decidedAt: s.status === "REJECTED" ? new Date() : null,
      },
    });
    console.log(`[seed] sample StudentApplication ${s.email} status=${s.status}`);
  }

  const instructorApplicationSamples = [
    {
      email: "applicant.instructor.submitted@digiuniversity.ir",
      fullName: "دکتر سعید پارسا",
      status: "SUBMITTED" as const,
      verifyEmail: false,
      verifyPhone: false,
      phone: "09120000010",
      bio: "PhD CS، 8 سال سابقه تدریس",
      expertise: ["algorithms", "distributed_systems"],
      cvUrl: "https://example.com/cv/parsa.pdf",
    },
    {
      email: "applicant.instructor.accepted@digiuniversity.ir",
      fullName: "دکتر مریم نوری",
      status: "ACCEPTED" as const,
      verifyEmail: true,
      verifyPhone: true,
      phone: "09120000011",
      bio: "PhD AI، خط‌مشی پژوهشی NLP فارسی",
      expertise: ["nlp", "machine_learning", "persian_language"],
      cvUrl: "https://example.com/cv/nouri.pdf",
    },
  ];

  for (const i of instructorApplicationSamples) {
    const existing = await prisma.instructorApplication.findFirst({
      where: { tenantId: tenant.id, applicantEmail: i.email },
    });
    if (existing) continue;
    await prisma.instructorApplication.create({
      data: {
        tenantId: tenant.id,
        departmentId: department.id,
        applicantFullName: i.fullName,
        applicantEmail: i.email,
        applicantPhone: i.phone,
        applicantBio: i.bio,
        expertise: i.expertise,
        cvUrl: i.cvUrl,
        applicantEmailVerifiedAt: i.verifyEmail ? new Date() : null,
        applicantPhoneVerifiedAt: i.verifyPhone ? new Date() : null,
        status: i.status,
      },
    });
    console.log(`[seed] sample InstructorApplication ${i.email} status=${i.status}`);
  }

  // Seed a couple of NotificationLog rows demonstrating the stub:
  //   - "application.submitted" template for the SUBMITTED student app
  //   - "application.spam.suspected" template (per Q8.a) as a demo of the
  //     spam-flag UI surface admins will filter on
  // Both idempotent on a deterministic id so re-runs are no-ops.
  const submittedApp = await prisma.studentApplication.findFirst({
    where: { tenantId: tenant.id, applicantEmail: "applicant.submitted@digiuniversity.ir" },
  });
  if (submittedApp) {
    const submittedLogId = `seed_${tenant.id}_notif_submitted`;
    const existing = await prisma.notificationLog.findUnique({ where: { id: submittedLogId } });
    if (!existing) {
      await prisma.notificationLog.create({
        data: {
          id: submittedLogId,
          tenantId: tenant.id,
          kind: "email",
          template: "application.submitted",
          targetEmail: submittedApp.applicantEmail,
          subject: "درخواست شما دریافت شد",
          body: `سلام ${submittedApp.applicantFullName}،\nدرخواست شما با شناسه ${submittedApp.id} ثبت شد. مدت بازبینی ۱۴ روز.\n\n— دیجی‌یونیورسیتی`,
          studentApplicationId: submittedApp.id,
          status: "queued",
        },
      });
      console.log(`[seed] sample NotificationLog application.submitted created`);
    }
  }

  const spamLogId = `seed_${tenant.id}_notif_spam_demo`;
  const existingSpamLog = await prisma.notificationLog.findUnique({ where: { id: spamLogId } });
  if (!existingSpamLog) {
    await prisma.notificationLog.create({
      data: {
        id: spamLogId,
        tenantId: tenant.id,
        kind: "in_app",
        template: "application.spam.suspected",
        subject: "احتمال spam در درخواست‌های ورودی",
        body: `بیش از 3 درخواست در یک ساعت اخیر از 192.0.2.42 دریافت شده است. لطفاً برای بررسی فیلتر spam را در /admin/applications اعمال کنید.`,
        status: "queued",
      },
    });
    console.log(`[seed] sample NotificationLog application.spam.suspected created`);
  }

  // ---------- Phase B R4 (D73 Q0.a) — sample program-term Enrollment ----------
  // Demonstrates the Q0.a two-shape model: a program-term admission
  // (offeringId SET + courseId NULL) for student1 into the seed
  // CourseOffering. This is the shape the R4 ENROLLED side effect
  // creates. Idempotent (deterministic id). studentUser + offering are
  // already in scope from the R3.a + R2 seed sections above.
  if (studentUser) {
    const programTermEnrollmentId = `seed_${tenant.id}_enr_programterm`;
    const existingEnr = await prisma.enrollment.findUnique({
      where: { id: programTermEnrollmentId },
    });
    if (!existingEnr) {
      await prisma.enrollment.create({
        data: {
          id: programTermEnrollmentId,
          tenantId: tenant.id,
          userId: studentUser.id,
          // Q0.a program-term admission shape: offering set, course null.
          offeringId: offering.id,
          courseId: null,
          status: "active",
          createdBy: "system",
          updatedBy: "system",
        },
      });
      console.log(
        `[seed] sample program-term Enrollment (offeringId=${offering.slug}, courseId=null) for student1`,
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
