import { BadRequestException } from '@nestjs/common';
import { parseUuid } from './query-slots.dto';

export interface BookSlotDto {
  applicationId: string;
  slotId: string;
}

export function parseBookSlotDto(value: unknown): BookSlotDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes('applicationId') || !keys.includes('slotId')) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    applicationId: parseUuid(payload.applicationId),
    slotId: parseUuid(payload.slotId),
  };
}
