import { BadRequestException } from '@nestjs/common';
import {
  normalizeEmail,
  normalizePhone,
  normalizeRequiredString,
} from './create-candidate.dto';

export interface UpdateCandidateDto {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string | null;
}

export function parseUpdateCandidateDto(value: unknown): UpdateCandidateDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['fullName', 'email', 'mobileNumber', 'whatsappNumber']);
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  const dto: UpdateCandidateDto = {};
  if ('fullName' in payload) dto.fullName = normalizeRequiredString(payload.fullName, 255);
  if ('email' in payload) dto.email = normalizeEmail(payload.email);
  if ('mobileNumber' in payload) dto.mobileNumber = normalizePhone(payload.mobileNumber, true);
  if ('whatsappNumber' in payload) {
    dto.whatsappNumber = normalizePhone(payload.whatsappNumber, false);
  }
  return dto;
}
