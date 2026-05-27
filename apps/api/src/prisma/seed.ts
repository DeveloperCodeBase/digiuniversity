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
