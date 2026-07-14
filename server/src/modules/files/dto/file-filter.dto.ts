import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';
import type { FileType } from './upload-file.dto';

export interface FileFilterDto {
  cursor?: string;
  limit: number;
  fileType?: FileType;
}

const FILE_TYPES = new Set<FileType>([
  'RESUME',
  'ORG_PROOF',
  'CERTIFICATE',
  'OFFER_LETTER',
  'JOINING_LETTER',
  'OTHER',
]);

export function parseFileFilterDto(query: Record<string, unknown>): FileFilterDto {
  const allowed = new Set(['cursor', 'limit', 'fileType']);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = parseOptionalUuid(query.cursor);
  const fileType = parseOptionalFileType(query.fileType);
  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
    ...(fileType ? { fileType } : {}),
  };
}

function parseOptionalUuid(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parseUuid(value);
}

function parseOptionalFileType(value: unknown): FileType | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !FILE_TYPES.has(value as FileType)) {
    throw new BadRequestException('Validation Error');
  }
  return value as FileType;
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
