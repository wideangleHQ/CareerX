import { BadRequestException } from '@nestjs/common';
import { parseDateOnly, parseTimeOnly, parseUuid } from './query-slots.dto';

export interface CreateSlotDto {
  hrId: string;
  departmentId: string | null;
  slotDate: Date;
  slotTime: Date;
  isRecurring: boolean;
}

export function parseCreateSlotDto(value: unknown): CreateSlotDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['hrId', 'departmentId', 'slotDate', 'slotTime', 'isRecurring']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    hrId: parseUuid(payload.hrId),
    departmentId:
      payload.departmentId === undefined || payload.departmentId === null || payload.departmentId === ''
        ? null
        : parseUuid(payload.departmentId),
    slotDate: parseDateOnly(payload.slotDate),
    slotTime: parseTimeOnly(payload.slotTime),
    isRecurring: payload.isRecurring === true,
  };
}
