// =====================================================
// Typed helpers per resource. Keeps the rest of the SPA free of URL
// literals and HTTP verbs.
// =====================================================

import { api, publicApi } from "./client.js";

// ---------- auth ----------
export const authApi = {
  login: ({ tenantSlug, email, password }) =>
    publicApi.post("/v1/auth/login", { tenantSlug, email, password }),
  register: ({ tenantSlug, email, password, fullName }) =>
    publicApi.post("/v1/auth/register", { tenantSlug, email, password, fullName }),
  refresh: (refreshToken) =>
    publicApi.post("/v1/auth/refresh", { refreshToken }),
  logout: (refreshToken) =>
    publicApi.post("/v1/auth/logout", { refreshToken }),
  me: () => api.get("/v1/auth/me"),
};

// ---------- catalog ----------
export const catalogApi = {
  // Phase B R1 Commit F (D62) — listSchools added. Existing listFaculties
  // gains optional schoolId filter (additive — undefined arg behaves
  // identically to the prior call shape).
  listSchools: () => api.get("/v1/schools"),
  listFaculties: ({ schoolId } = {}) =>
    api.get(
      "/v1/faculties" + (schoolId ? "?schoolId=" + encodeURIComponent(schoolId) : ""),
    ),
  listDepartments: ({ facultyId } = {}) =>
    api.get(
      "/v1/departments" + (facultyId ? "?facultyId=" + encodeURIComponent(facultyId) : ""),
    ),
  listPrograms: ({ departmentId, degreeLevel } = {}) => {
    const q = [];
    if (departmentId) q.push("departmentId=" + encodeURIComponent(departmentId));
    if (degreeLevel) q.push("degreeLevel=" + encodeURIComponent(degreeLevel));
    return api.get("/v1/programs" + (q.length ? "?" + q.join("&") : ""));
  },
  listCourses: ({ programId, level, language } = {}) => {
    const q = [];
    if (programId) q.push("programId=" + encodeURIComponent(programId));
    if (level) q.push("level=" + encodeURIComponent(level));
    if (language) q.push("language=" + encodeURIComponent(language));
    return api.get("/v1/courses" + (q.length ? "?" + q.join("&") : ""));
  },
  getCourse: (id) => api.get("/v1/courses/" + encodeURIComponent(id)),
  listCohorts: ({ programId } = {}) =>
    api.get(
      "/v1/cohorts" + (programId ? "?programId=" + encodeURIComponent(programId) : ""),
    ),
};

// ---------- academic admin (Phase B R1 Commit F — D62) ----------
//
// Full CRUD across the 4-level Academic Hierarchy. Used by the new
// admin pages /admin/schools, /admin/faculties, etc. (Commits G + H).
// All mutations go through @AuditAction-decorated NestJS endpoints
// and require admin role (server-side guarded; client just receives
// 403 if a non-admin somehow reaches these pages).

export const academicAdminApi = {
  // --- Schools ---
  listSchools: () => api.get("/v1/schools"),
  getSchool: (id) => api.get("/v1/schools/" + encodeURIComponent(id)),
  createSchool: (data) => api.post("/v1/schools", data),
  updateSchool: (id, data) => api.patch("/v1/schools/" + encodeURIComponent(id), data),
  deleteSchool: (id) => api.delete("/v1/schools/" + encodeURIComponent(id)),

  // --- Faculties ---
  listFaculties: ({ schoolId } = {}) =>
    api.get("/v1/faculties" + (schoolId ? "?schoolId=" + encodeURIComponent(schoolId) : "")),
  getFaculty: (id) => api.get("/v1/faculties/" + encodeURIComponent(id)),
  createFaculty: (data) => api.post("/v1/faculties", data),
  updateFaculty: (id, data) => api.patch("/v1/faculties/" + encodeURIComponent(id), data),
  deleteFaculty: (id) => api.delete("/v1/faculties/" + encodeURIComponent(id)),

  // --- Departments ---
  listDepartments: ({ facultyId } = {}) =>
    api.get("/v1/departments" + (facultyId ? "?facultyId=" + encodeURIComponent(facultyId) : "")),
  getDepartment: (id) => api.get("/v1/departments/" + encodeURIComponent(id)),
  createDepartment: (data) => api.post("/v1/departments", data),
  updateDepartment: (id, data) => api.patch("/v1/departments/" + encodeURIComponent(id), data),
  deleteDepartment: (id) => api.delete("/v1/departments/" + encodeURIComponent(id)),

  // --- Programs ---
  listPrograms: ({ departmentId, degreeLevel } = {}) => {
    const q = [];
    if (departmentId) q.push("departmentId=" + encodeURIComponent(departmentId));
    if (degreeLevel) q.push("degreeLevel=" + encodeURIComponent(degreeLevel));
    return api.get("/v1/programs" + (q.length ? "?" + q.join("&") : ""));
  },
  getProgram: (id) => api.get("/v1/programs/" + encodeURIComponent(id)),
  createProgram: (data) => api.post("/v1/programs", data),
  updateProgram: (id, data) => api.patch("/v1/programs/" + encodeURIComponent(id), data),
  deleteProgram: (id) => api.delete("/v1/programs/" + encodeURIComponent(id)),

  // --- CourseOfferings (Phase B R2 D65) — modern surface for the
  // Cohort → Offering migration. Both APIs live in parallel during
  // the Sunset window per MIGRATION_POLICY §6.
  listOfferings: ({ status, programId } = {}) => {
    const q = [];
    if (status) q.push("status=" + encodeURIComponent(status));
    if (programId) q.push("programId=" + encodeURIComponent(programId));
    return api.get("/v1/offerings" + (q.length ? "?" + q.join("&") : ""));
  },
  getOffering: (id) => api.get("/v1/offerings/" + encodeURIComponent(id)),
  createOffering: (data) => api.post("/v1/offerings", data),
  updateOffering: (id, data) => api.patch("/v1/offerings/" + encodeURIComponent(id), data),
  // Status transitions guarded by service-layer state machine.
  // Illegal transitions reject 400 with an allowed-from-current list.
  transitionOffering: (id, to) =>
    api.post("/v1/offerings/" + encodeURIComponent(id) + "/transition", { to }),
  deleteOffering: (id) => api.delete("/v1/offerings/" + encodeURIComponent(id)),
  // Phase B R3.a Commit G (D68 Q3.a + D69) — assign/unassign instructor.
  // Pass instructorId=null (or "") to unassign. Backend validates the
  // target User holds the 'instructor' role and lives in the same tenant.
  assignOfferingInstructor: (id, instructorId) =>
    api.patch("/v1/offerings/" + encodeURIComponent(id) + "/instructor", { instructorId }),

  // --- Cohorts (legacy, Sunset 2026-12-31) — list/CRUD kept alive
  // for the dual-write window. Backend emits Sunset / Deprecation /
  // Link headers on every endpoint per MIGRATION_POLICY §6.
  listCohorts: ({ programId } = {}) =>
    api.get("/v1/cohorts" + (programId ? "?programId=" + encodeURIComponent(programId) : "")),
  getCohort: (id) => api.get("/v1/cohorts/" + encodeURIComponent(id)),
  createCohort: (data) => api.post("/v1/cohorts", data),
  updateCohort: (id, data) => api.patch("/v1/cohorts/" + encodeURIComponent(id), data),
  deleteCohort: (id) => api.delete("/v1/cohorts/" + encodeURIComponent(id)),
};

// ---------- class sessions ----------
export const classSessionsApi = {
  list: ({ courseId, status } = {}) => {
    const q = [];
    if (courseId) q.push("courseId=" + encodeURIComponent(courseId));
    if (status) q.push("status=" + encodeURIComponent(status));
    return api.get("/v1/class-sessions" + (q.length ? "?" + q.join("&") : ""));
  },
  get: (id) => api.get("/v1/class-sessions/" + encodeURIComponent(id)),
  join: (id) => api.post("/v1/class-sessions/" + encodeURIComponent(id) + "/join"),
  leave: (id) => api.post("/v1/class-sessions/" + encodeURIComponent(id) + "/leave"),
  analyze: (id, { task = "analyze", language = "fa" } = {}) =>
    api.post("/v1/class-sessions/" + encodeURIComponent(id) + "/analyze", { task, language }),
};

// ---------- assessments + submissions ----------
export const assessmentsApi = {
  list: ({ courseId, status, kind } = {}) => {
    const q = [];
    if (courseId) q.push("courseId=" + encodeURIComponent(courseId));
    if (status) q.push("status=" + encodeURIComponent(status));
    if (kind) q.push("kind=" + encodeURIComponent(kind));
    return api.get("/v1/assessments" + (q.length ? "?" + q.join("&") : ""));
  },
  get: (id) => api.get("/v1/assessments/" + encodeURIComponent(id)),
  create: (body) => api.post("/v1/assessments", body),
  addQuestion: (assessmentId, body) =>
    api.post("/v1/assessments/" + encodeURIComponent(assessmentId) + "/questions", body),
  publish: (id) => api.patch("/v1/assessments/" + encodeURIComponent(id), { status: "published" }),
};

export const submissionsApi = {
  submit: ({ assessmentId, answers, finalize = false }) =>
    api.post("/v1/submissions", { assessmentId, answers, finalize }),
  listMine: () => api.get("/v1/submissions/me"),
  getMine: (assessmentId) =>
    api.get("/v1/submissions/me/assessment/" + encodeURIComponent(assessmentId)),
  get: (id) => api.get("/v1/submissions/" + encodeURIComponent(id)),
  list: ({ assessmentId } = {}) =>
    api.get(
      "/v1/submissions" + (assessmentId ? "?assessmentId=" + encodeURIComponent(assessmentId) : ""),
    ),
  grade: (id, { grade, feedback }) =>
    api.patch("/v1/submissions/" + encodeURIComponent(id) + "/grade", { grade, feedback }),
  aiGradeDraft: (id) =>
    api.post("/v1/submissions/" + encodeURIComponent(id) + "/ai-grade-draft"),
};

// ---------- enrollments ----------
export const enrollmentsApi = {
  enrol: ({ courseId, cohortId } = {}) =>
    api.post("/v1/enrollments", { courseId, ...(cohortId ? { cohortId } : {}) }),
  listMine: () => api.get("/v1/enrollments/me"),
  setStatus: (id, status) =>
    api.patch("/v1/enrollments/" + encodeURIComponent(id) + "/status", { status }),
};

// ---------- analytics + learning events ----------
export const analyticsApi = {
  studentMe: () => api.get("/v1/analytics/student/me"),
  studentByUser: (userId) =>
    api.get("/v1/analytics/student/" + encodeURIComponent(userId)),
  course: (courseId) => api.get("/v1/analytics/course/" + encodeURIComponent(courseId)),
  tenant: () => api.get("/v1/analytics/tenant"),
  riskMe: () => api.get("/v1/analytics/risk/me"),
  riskByUser: (userId) =>
    api.get("/v1/analytics/risk/" + encodeURIComponent(userId)),
};

export const learningEventsApi = {
  emit: ({ type, courseId, lessonId, assessmentId, classSessionId, data } = {}) =>
    api.post("/v1/learning-events", {
      type,
      ...(courseId ? { courseId } : {}),
      ...(lessonId ? { lessonId } : {}),
      ...(assessmentId ? { assessmentId } : {}),
      ...(classSessionId ? { classSessionId } : {}),
      ...(data ? { data } : {}),
    }),
  listMine: ({ type, courseId } = {}) => {
    const q = [];
    if (type) q.push("type=" + encodeURIComponent(type));
    if (courseId) q.push("courseId=" + encodeURIComponent(courseId));
    return api.get("/v1/learning-events/me" + (q.length ? "?" + q.join("&") : ""));
  },
};

// ---------- tutor ----------
export const tutorApi = {
  createSession: ({ courseId, title } = {}) =>
    api.post("/v1/tutor/sessions", {
      ...(courseId ? { courseId } : {}),
      ...(title ? { title } : {}),
    }),
  listSessions: () => api.get("/v1/tutor/sessions"),
  getSession: (id) => api.get("/v1/tutor/sessions/" + encodeURIComponent(id)),
  ask: (id, { question, topK = 5 }) =>
    api.post("/v1/tutor/sessions/" + encodeURIComponent(id) + "/ask", { question, topK }),
  deleteSession: (id) => api.del("/v1/tutor/sessions/" + encodeURIComponent(id)),
};

export const documentsApi = {
  list: ({ courseId } = {}) =>
    api.get("/v1/documents" + (courseId ? "?courseId=" + encodeURIComponent(courseId) : "")),
  get: (id) => api.get("/v1/documents/" + encodeURIComponent(id)),
  create: (body) => api.post("/v1/documents", body),
};

// ---------- users ----------
export const usersApi = {
  me: () => api.get("/v1/users/me"),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post("/v1/users/me/change-password", { currentPassword, newPassword }),
};

// ---------- identity (Phase B R3.a D68 + D69) ----------
//
// Profile / Student / Instructor surface. All Profile endpoints use the
// SelfOrAdminGuard (D69 primitive): a non-admin caller can only access
// their own resource; admins can access any in the tenant. Backend
// returns 403 on cross-user attempts by non-admins.

export const profileApi = {
  // Self-service (uses JWT to resolve target user)
  getOwn: () => api.get("/v1/profile"),
  updateOwn: (data) => api.patch("/v1/profile", data),

  // Admin listing — powers /admin/profiles
  listAdmin: () => api.get("/v1/profiles"),

  // SelfOrAdmin — :userId can be self (any role) or any user (admin only)
  getByUserId: (userId) => api.get("/v1/users/" + encodeURIComponent(userId) + "/profile"),
  updateByUserId: (userId, data) =>
    api.patch("/v1/users/" + encodeURIComponent(userId) + "/profile", data),
};

export const studentApi = {
  // Admin list/get/create/update/delete + self-read /me
  list: ({ status } = {}) =>
    api.get("/v1/students" + (status ? "?status=" + encodeURIComponent(status) : "")),
  get: (id) => api.get("/v1/students/" + encodeURIComponent(id)),
  getOwn: () => api.get("/v1/students/me"),
  create: (data) => api.post("/v1/students", data),
  update: (id, data) => api.patch("/v1/students/" + encodeURIComponent(id), data),
  delete: (id) => api.delete("/v1/students/" + encodeURIComponent(id)),
};

export const instructorApi = {
  // List + getById are visible to admin + student (catalog browsing).
  // All mutations admin-only (backend guarded).
  list: ({ status, departmentId } = {}) => {
    const q = [];
    if (status) q.push("status=" + encodeURIComponent(status));
    if (departmentId) q.push("departmentId=" + encodeURIComponent(departmentId));
    return api.get("/v1/instructors" + (q.length ? "?" + q.join("&") : ""));
  },
  get: (id) => api.get("/v1/instructors/" + encodeURIComponent(id)),
  getOwn: () => api.get("/v1/instructors/me"),
  create: (data) => api.post("/v1/instructors", data),
  update: (id, data) => api.patch("/v1/instructors/" + encodeURIComponent(id), data),
  // Dedicated sub-resource for department reassignment per memo. Pass
  // departmentId=null (or "") to detach.
  assignDepartment: (id, departmentId) =>
    api.patch("/v1/instructors/" + encodeURIComponent(id) + "/department", { departmentId }),
  delete: (id) => api.delete("/v1/instructors/" + encodeURIComponent(id)),
};
