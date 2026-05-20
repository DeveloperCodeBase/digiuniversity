import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";

class ListDocumentsQueryDto {
  @IsOptional() @IsString() courseId?: string;
}

const CHUNK_SIZE_CHARS = 1200;
const CHUNK_OVERLAP = 200;

/**
 * Slice the document text into overlapping windows. Cheap and locale-safe
 * (we don't need a tokenizer for the storage layer; ai-gateway will do
 * proper tokenisation when we hook up a real model).
 */
function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE_CHARS) return [text.trim()];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + CHUNK_SIZE_CHARS).trim();
    if (slice) out.push(slice);
    i += CHUNK_SIZE_CHARS - CHUNK_OVERLAP;
  }
  return out;
}

@Controller("documents")
export class DocumentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() q: ListDocumentsQueryDto,
  ) {
    return this.prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        ...(q.courseId ? { courseId: q.courseId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        kind: true,
        language: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { chunks: true } },
      },
      take: 200,
    });
  }

  @Get(":id")
  async getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const row = await this.prisma.document.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        chunks: { orderBy: { orderIndex: "asc" } },
      },
    });
    if (!row) throw new NotFoundException("document not found");
    return row;
  }

  @Roles("admin", "instructor")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDocumentDto) {
    if (dto.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: dto.courseId, tenantId: user.tenantId, deletedAt: null },
      });
      if (!course) throw new BadRequestException("course not in this tenant");
    }
    const chunks = chunkText(dto.content);
    const doc = await this.prisma.document.create({
      data: {
        tenantId: user.tenantId,
        courseId: dto.courseId,
        title: dto.title,
        source: dto.source,
        kind: dto.kind ?? "text",
        language: dto.language ?? "fa",
        content: dto.content,
        createdBy: user.userId,
        updatedBy: user.userId,
        chunks: {
          create: chunks.map((text, idx) => ({
            tenantId: user.tenantId,
            text,
            orderIndex: idx,
            tokenCount: Math.ceil(text.length / 4), // rough Latin estimate
          })),
        },
      },
      include: { _count: { select: { chunks: true } } },
    });
    return doc;
  }

  @Roles("admin", "instructor")
  @Patch(":id")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const existing = await this.prisma.document.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("document not found");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("nothing to update");
    }

    if (dto.content !== undefined) {
      // Re-chunk on content change: drop old chunks, recreate.
      await this.prisma.documentChunk.deleteMany({
        where: { documentId: existing.id },
      });
      const chunks = chunkText(dto.content);
      await this.prisma.documentChunk.createMany({
        data: chunks.map((text, idx) => ({
          tenantId: user.tenantId,
          documentId: existing.id,
          text,
          orderIndex: idx,
          tokenCount: Math.ceil(text.length / 4),
        })),
      });
    }

    return this.prisma.document.update({
      where: { id: existing.id },
      data: { ...dto, updatedBy: user.userId },
    });
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async softDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const existing = await this.prisma.document.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("document not found");
    await this.prisma.document.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), updatedBy: user.userId },
    });
    return { deleted: true };
  }
}
