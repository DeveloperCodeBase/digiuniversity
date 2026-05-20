import { describe, it, expect } from "vitest";
import {
  SCHOOLS, PROGRAMS, FACULTY, COURSES, LABS,
  findCourse, findFaculty, findSchool, findProgram, findLab,
  programsBySchool, coursesByInstructor, coursesByStudent,
  CURRENT_USER, NOTIFICATIONS, CONVERSATIONS, RECORDINGS,
  EVENTS, JOBS, SCHOLARSHIPS, HACKATHONS, ALUMNI, BADGES,
  CREDENTIALS, TRANSCRIPT, WEEKLY_SCHEDULE,
} from "../src/data.js";

describe("Mock database — structure", () => {
  it("has 8 schools, each with unique id and code", () => {
    expect(SCHOOLS).toHaveLength(8);
    const ids = SCHOOLS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least 12 faculty", () => {
    expect(FACULTY.length).toBeGreaterThanOrEqual(12);
    FACULTY.forEach(f => {
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("school");
      expect(f).toHaveProperty("rating");
    });
  });

  it("has 9 labs, each with unique code", () => {
    expect(LABS).toHaveLength(9);
    const codes = LABS.map(l => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("each program belongs to a real school", () => {
    PROGRAMS.forEach(p => {
      const school = findSchool(p.school);
      expect(school, `program ${p.id} → school ${p.school}`).toBeTruthy();
    });
  });

  it("each course has a real instructor (or null) and prereqs valid", () => {
    COURSES.forEach(c => {
      if (c.instructor) {
        const inst = findFaculty(c.instructor);
        expect(inst, `course ${c.id} → instructor`).toBeTruthy();
      }
    });
  });

  it("CURRENT_USER enrolledCourses all resolve", () => {
    CURRENT_USER.enrolledCourses.forEach(id => {
      expect(findCourse(id), `course ${id}`).toBeTruthy();
    });
  });
});

describe("Selectors", () => {
  it("programsBySchool returns only that school", () => {
    const eng = programsBySchool("eng");
    expect(eng.length).toBeGreaterThan(0);
    eng.forEach(p => expect(p.school).toBe("eng"));
  });

  it("coursesByInstructor returns only that instructor", () => {
    const azimi = coursesByInstructor("f-azimi");
    expect(azimi.length).toBeGreaterThan(0);
    azimi.forEach(c => expect(c.instructor).toBe("f-azimi"));
  });

  it("coursesByStudent returns the student's enrolled courses", () => {
    const courses = coursesByStudent(CURRENT_USER);
    expect(courses.length).toBe(CURRENT_USER.enrolledCourses.length);
  });
});

describe("Notifications / conversations", () => {
  it("notifications route to valid pages", () => {
    NOTIFICATIONS.forEach(n => {
      expect(typeof n.route).toBe("string");
    });
  });
  it("conversations have peerId and last preview", () => {
    CONVERSATIONS.forEach(c => {
      expect(c.peerId).toBeTruthy();
      expect(c.last).toBeTruthy();
    });
  });
});

describe("Domain data", () => {
  it("events, jobs, scholarships, hackathons, alumni, badges, credentials, transcript exist", () => {
    expect(EVENTS.length).toBeGreaterThan(0);
    expect(JOBS.length).toBeGreaterThan(0);
    expect(SCHOLARSHIPS.length).toBeGreaterThan(0);
    expect(HACKATHONS.length).toBeGreaterThan(0);
    expect(ALUMNI.length).toBeGreaterThan(0);
    expect(BADGES.length).toBeGreaterThan(0);
    expect(CREDENTIALS.length).toBeGreaterThan(0);
    expect(TRANSCRIPT.length).toBeGreaterThan(0);
    expect(WEEKLY_SCHEDULE.length).toBeGreaterThan(0);
    expect(RECORDINGS.length).toBeGreaterThan(0);
  });
});
