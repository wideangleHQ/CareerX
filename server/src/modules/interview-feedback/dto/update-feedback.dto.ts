import { BadRequestException } from '@nestjs/common';
import { parseOptionalText, parseRating } from './create-feedback.dto';

export interface UpdateFeedbackDto {
  rating?: number;
  notes?: string | null;
}

export function parseUpdateFeedbackDto(value: unknown): UpdateFeedbackDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['rating', 'notes']);
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    ...(payload.rating !== undefined ? { rating: parseRating(payload.rating) } : {}),
    ...(Object.hasOwn(payload, 'notes') ? { notes: parseOptionalText(payload.notes, 5000) } : {}),
  };
}
