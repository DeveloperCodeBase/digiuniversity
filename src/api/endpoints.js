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

// ---------- enrollments ----------
export const enrollmentsApi = {
  enrol: ({ courseId, cohortId } = {}) =>
    api.post("/v1/enrollments", { courseId, ...(cohortId ? { cohortId } : {}) }),
  listMine: () => api.get("/v1/enrollments/me"),
  setStatus: (id, status) =>
    api.patch("/v1/enrollments/" + encodeURIComponent(id) + "/status", { status }),
};

// ---------- users ----------
export const usersApi = {
  me: () => api.get("/v1/users/me"),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post("/v1/users/me/change-password", { currentPassword, newPassword }),
};
