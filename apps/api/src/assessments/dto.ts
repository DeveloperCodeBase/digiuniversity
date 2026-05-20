import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export const KINDS = ["quiz", "assignment"] as const;
export const QUESTION_KINDS = ["multiple_choice", "short_answer", "essay"] as const;
export const STATUSES = ["draft", "published", "closed"] as const;
export const SUBMISSION_STATUSES = ["draft", "submitted", "graded"] as const;

export class CreateAssessmentDto {
  @IsString() @MinLength(2) @MaxLength(64) courseId!: string;
  @IsString() @IsIn([...KINDS]) kind!: typeof KINDS[number];
  @IsString() @MinLength(2) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(4000) instructions?: string;
  @IsOptional() @IsISO8601() dueAt?: string;
  @IsOptional() @IsBoolean() allowLate?: boolean;
}

export class UpdateAssessmentDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(4000) instructions?: string;
  @IsOptional() @IsString() @IsIn([...STATUSES]) status?: typeof STATUSES[number];
  @IsOptional() @IsISO8601() dueAt?: string;
  @IsOptional() @IsBoolean() allowLate?: boolean;
}

export class CreateQuestionDto {
  @IsString() @IsIn([...QUESTION_KINDS]) kind!: typeof QUESTION_KINDS[number];
  @IsString() @MinLength(2) @MaxLength(2000) prompt!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  // Tagged as object/any — DTO can't fully type a discriminated union.
  @IsOptional() correctAnswer?: number | number[] | string;
  @IsOptional() @IsInt() @Min(1) points?: number;
  @IsOptional() @IsInt() @Min(0) orderIndex?: number;
}

export class UpdateQuestionDto {
  @IsOptional() @IsString() @MaxLength(2000) prompt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() correctAnswer?: number | number[] | string;
  @IsOptional() @IsInt() @Min(1) points?: number;
  @IsOptional() @IsInt() @Min(0) orderIndex?: number;
}

// ---------- submissions ----------

export class QuestionAnswer {
  @IsOptional() @IsInt() @Min(0) selectedIndex?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) selectedIndices?: number[];
  @IsOptional() @IsString() @MaxLength(8000) text?: string;
}

export class SubmitDto {
  @IsString() assessmentId!: string;
  // Allow either { answers: { questionId: {...} } } for quizzes OR
  // { text } for assignments.
  @IsObject() answers!: Record<string, unknown>;
  @IsOptional() @IsBoolean() finalize?: boolean;
}

export class GradeSubmissionDto {
  @IsInt() @Min(0) grade!: number; // percentage 0..100
  @IsOptional() @IsString() @MaxLength(4000) feedback?: string;
}
