import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';

export interface CreateFeedbackDto {
  applicationId: string;
  interviewSlotId: string;
  rating: number;
  notes: string | null;
}

export function parseCreateFeedbackDto(value: unknown): CreateFeedbackDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['applicationId', 'interviewSlotId', 'rating', 'notes']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    applicationId: parseUuid(payload.applicationId),
    interviewSlotId: parseUuid(payload.interviewSlotId),
    rating: parseRating(payload.rating),
    notes: parseOptionalText(payload.notes, 5000),
  };
}

export function parseRating(value: unknown): number {
  const rating = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new BadRequestException('Validation Error');
  }
  return rating;
}

export function parseOptionalText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) return null;
  if (normalized.length > maxLength) throw new BadRequestException('Validation Error');
  return normalized;
}
