import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const DOC_KINDS = ["text", "pdf", "external"] as const;

export class CreateTutorSessionDto {
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
}

export class AskDto {
  @IsString() @MinLength(1) @MaxLength(4000) question!: string;
  @IsOptional() @IsInt() @Min(1) topK?: number;
}

export class CreateDocumentDto {
  @IsString() @MinLength(2) @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MaxLength(2048) source?: string;
  @IsOptional() @IsString() @IsIn([...DOC_KINDS]) kind?: typeof DOC_KINDS[number];
  @IsOptional() @IsString() @MaxLength(8) language?: string;
  @IsString() @MinLength(1) @MaxLength(200_000) content!: string;
}

export class UpdateDocumentDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2048) source?: string;
  @IsOptional() @IsString() @MaxLength(8) language?: string;
  @IsOptional() @IsString() @MaxLength(200_000) content?: string;
}
