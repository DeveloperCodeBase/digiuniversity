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
  listFaculties: () => api.get("/v1/faculties"),
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
