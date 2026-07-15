import { BadRequestException } from '@nestjs/common';
import type { application_status_enum } from '@prisma/client';
import { parseRequiredText } from './create-application.dto';

const STATUSES = new Set(['NEW', 'SLOT_BOOKED', 'INTERVIEWED', 'SHORTLISTED', 'SELECTED', 'OFFER_RELEASED', 'JOINED', 'REJECTED', 'WITHDRAWN']);

export interface UpdateStatusDto {
  status: application_status_enum;
  reason: string | null;
}

export function parseUpdateStatusDto(value: unknown): UpdateStatusDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['status', 'reason']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  if (typeof payload.status !== 'string' || !STATUSES.has(payload.status)) {
    throw new BadRequestException('Validation Error');
  }

  return {
    status: payload.status as application_status_enum,
    reason:
      payload.reason === undefined || payload.reason === null || payload.reason === ''
        ? null
        : parseRequiredText(payload.reason, 1000),
  };
}
