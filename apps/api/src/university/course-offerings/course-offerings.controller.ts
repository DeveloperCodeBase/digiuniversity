// apps/api/src/university/course-offerings/course-offerings.controller.ts
//
// Phase B R2 Commit B — CourseOffering REST surface.
// Service-layer holds the state machine + dual-source FK logic; this
// file is HTTP plumbing + DTO validation only.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

import type { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../audit/audit-action.decorator";
import { CourseOfferingsService } from "./course-offerings.service";

// Enum literals duplicated here to avoid a `@prisma/client` runtime
// import in the DTO (class-validator needs literal arrays).
const OFFERING_MODES = ["SYNCHRONOUS", "ASYNCHRONOUS", "HYBRID"] as const;
const OFFERING_STATUSES = [
  "SCHEDULED",
  "OPEN",
  "ACTIVE",
  "COMPLETED",
  "CANCELED",
] as const;

class CreateOfferingDto {
  @IsString() @MinLength(2) @MaxLength(64) programId!: string;
  @IsString() @MinLength(2) @MaxLength(64) slug!: string;
  @IsString() @MinLength(2) @MaxLength(200) nameFa!: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32) shortCode?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsEnum(OFFERING_MODES) mode?: (typeof OFFERING_MODES)[number];
  @IsOptional() @IsString() @MaxLength(64) legacyCohortId?: string;
}

class UpdateOfferingDto {
  @IsOptional() @IsString() @MaxLength(200) nameFa?: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(32) shortCode?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsEnum(OFFERING_MODES) mode?: (typeof OFFERING_MODES)[number];
}

class TransitionDto {
  @IsEnum(OFFERING_STATUSES) to!: (typeof OFFERING_STATUSES)[number];
}

class AssignInstructorDto {
  // Accept null (explicit unassign) or a non-empty string. Empty
  // string is treated as null by the service. `ValidateIf` skips
  // string validation when the value is explicitly null.
  @ValidateIf((_, v) => v !== null)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  instructorId!: string | null;
}

@Controller("offerings")
export class CourseOfferingsController {
  constructor(private readonly service: CourseOfferingsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status") status?: (typeof OFFERING_STATUSES)[number],
    @Query("programId") programId?: string,
  ) {
    return this.service.list(user.tenantId, { status, programId });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.getById(user.tenantId, id);
  }

  @Roles("admin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("course-offering.create")
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOfferingDto) {
    return this.service.create(user.tenantId, user.userId, {
      programId: dto.programId,
      slug: dto.slug,
      nameFa: dto.nameFa,
      nameEn: dto.nameEn,
      shortCode: dto.shortCode,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      capacity: dto.capacity,
      mode: dto.mode,
      legacyCohortId: dto.legacyCohortId,
    });
  }

  @Roles("admin")
  @Patch(":id")
  @AuditAction("course-offering.update")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateOfferingDto,
  ) {
    return this.service.update(user.tenantId, user.userId, id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  /**
   * Status transition. State-machine validated in service layer.
   * Per D65 R2-Reminder-1, illegal transitions return 400 with a
   * helpful message listing allowed-from-current transitions.
   */
  @Roles("admin")
  @Post(":id/transition")
  @HttpCode(HttpStatus.OK)
  @AuditAction("course-offering.transition")
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.service.transition(user.tenantId, user.userId, id, dto.to);
  }

  /**
   * Phase B R3.a Commit E (D68 Q3.a + D69) — assign or unassign an
   * instructor to this offering. Body `{ instructorId: <id> }` to
   * assign, `{ instructorId: null }` (or empty string) to unassign.
   * Service-layer validates that the assigned User holds the
   * `instructor` role and that the instructor lives in the same tenant.
   */
  @Roles("admin")
  @Patch(":id/instructor")
  @AuditAction("course-offering.instructor.assign")
  async assignInstructor(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AssignInstructorDto,
  ) {
    return this.service.assignInstructor(user.tenantId, user.userId, id, dto.instructorId ?? null);
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("course-offering.delete")
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.softDelete(user.tenantId, user.userId, id);
  }
}
