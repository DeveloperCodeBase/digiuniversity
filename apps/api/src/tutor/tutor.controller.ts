import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuditAction } from "../audit/audit-action.decorator";
import { AskDto, CreateTutorSessionDto } from "./dto";
import { TutorService } from "./tutor.service";

@Controller("tutor")
export class TutorController {
  constructor(private readonly tutor: TutorService) {}

  @Post("sessions")
  @HttpCode(HttpStatus.CREATED)
  @AuditAction("tutor.session.create")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTutorSessionDto) {
    return this.tutor.createSession(user, dto);
  }

  @Get("sessions")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.tutor.listMine(user);
  }

  @Get("sessions/:id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tutor.getSession(user, id);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.OK)
  @AuditAction("tutor.session.delete")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tutor.deleteSession(user, id);
  }

  @Post("sessions/:id/ask")
  @HttpCode(HttpStatus.OK)
  @AuditAction("tutor.session.ask")
  ask(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AskDto,
  ) {
    return this.tutor.ask(user, id, dto);
  }
}
