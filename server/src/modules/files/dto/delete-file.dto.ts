import { BadRequestException } from '@nestjs/common';

export interface DeleteFileDto {
  reason?: string;
}

export function parseDeleteFileDto(value: unknown): DeleteFileDto {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['reason']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const reason = (value as Record<string, unknown>).reason;
  if (reason === undefined || reason === null || reason === '') return {};
  if (typeof reason !== 'string') throw new BadRequestException('Validation Error');

  const normalized = reason.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) return {};
  if (normalized.length > 500) throw new BadRequestException('Validation Error');
  return { reason: normalized };
}
