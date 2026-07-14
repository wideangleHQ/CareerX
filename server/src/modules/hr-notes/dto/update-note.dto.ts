import { BadRequestException } from '@nestjs/common';
import { parseRequiredText } from '../../applications/dto/create-application.dto';

export interface UpdateNoteDto {
  note: string;
}

export function parseUpdateNoteDto(value: unknown): UpdateNoteDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['note']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  return { note: parseRequiredText((value as Record<string, unknown>).note, 5000) };
}
