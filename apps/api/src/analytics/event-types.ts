/**
 * Curated catalogue of learning event types.
 *
 * The DB column is open-ended so client code can emit experimental
 * types without a migration, but the analytics service only aggregates
 * the names listed here.
 */
export const SYSTEM_EVENTS = [
  "class_joined",
  "class_left",
  "quiz_started",
  "quiz_submitted",
  "assignment_submitted",
  "submission_graded",
] as const;

export const CLIENT_EVENTS = [
  "course_opened",
  "lesson_opened",
  "lesson_completed",
  "video_played",
  "video_paused",
  "ai_tutor_asked",
  "ai_summary_viewed",
  "confusion_reported",
] as const;

export const ALL_EVENTS = [...SYSTEM_EVENTS, ...CLIENT_EVENTS] as const;
export type LearningEventType = (typeof ALL_EVENTS)[number];
