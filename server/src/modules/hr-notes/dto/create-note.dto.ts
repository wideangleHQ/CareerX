import { BadRequestException } from '@nestjs/common';
import { parseRequiredText, parseUuid } from '../../applications/dto/create-application.dto';

export interface CreateNoteDto {
  applicationId: string;
  note: string;
}

export function parseCreateNoteDto(value: unknown): CreateNoteDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['applicationId', 'note']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    applicationId: parseUuid(payload.applicationId),
    note: parseRequiredText(payload.note, 5000),
  };
}
