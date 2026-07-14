import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';

export interface NoteFilterDto {
  cursor?: string;
  limit: number;
}

export function parseNoteFilterDto(query: Record<string, unknown>): NoteFilterDto {
  const allowed = new Set(['cursor', 'limit']);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = parseOptionalCursor(query.cursor);
  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
  };
}

function parseOptionalCursor(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 80) {
    throw new BadRequestException('Validation Error');
  }
  return parseUuid(value);
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === null || value === '') return 20;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException('Validation Error');
  }

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Validation Error');
  }
  return limit;
}
