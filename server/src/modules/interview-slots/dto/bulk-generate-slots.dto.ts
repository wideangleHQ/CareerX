import { BadRequestException } from '@nestjs/common';
import { parseDateOnly, parseTimeOnly, parseUuid } from './query-slots.dto';

export interface BulkGenerateSlotsDto {
  hrId: string;
  departmentId: string | null;
  startDate: Date;
  endDate: Date;
  slotTimes: Date[];
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export function parseBulkGenerateSlotsDto(value: unknown): BulkGenerateSlotsDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['hrId', 'departmentId', 'startDate', 'endDate', 'slotTimes', 'frequency']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  if (!Array.isArray(payload.slotTimes) || payload.slotTimes.length === 0 || payload.slotTimes.length > 24) {
    throw new BadRequestException('Validation Error');
  }

  const frequency = payload.frequency;
  if (frequency !== 'DAILY' && frequency !== 'WEEKLY' && frequency !== 'MONTHLY') {
    throw new BadRequestException('Validation Error');
  }

  const startDate = parseDateOnly(payload.startDate);
  const endDate = parseDateOnly(payload.endDate);
  if (startDate > endDate) throw new BadRequestException('Validation Error');

  return {
    hrId: parseUuid(payload.hrId),
    departmentId:
      payload.departmentId === undefined || payload.departmentId === null || payload.departmentId === ''
        ? null
        : parseUuid(payload.departmentId),
    startDate,
    endDate,
    slotTimes: payload.slotTimes.map(parseTimeOnly),
    frequency,
  };
}
