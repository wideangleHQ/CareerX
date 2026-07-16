import { BadRequestException } from '@nestjs/common';
import { parseUuid } from './query-slots.dto';

export interface BulkGenerateSlotsDto {
  hrId: string;
  departmentId: string | null;
  startDate: Date;
  endDate: Date;
  slotTimes: Date[];
  daysOfWeek: number[] | null;
  isRecurring: boolean;
}

function parseDateFlexible(value: unknown): Date {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error: invalid date');
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateOnly) throw new BadRequestException('Validation Error: invalid date format');
  const date = new Date(`${dateOnly[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Validation Error: unparseable date');
  return date;
}

function parseTimeFlexible(value: unknown): Date {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error: invalid time');
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) throw new BadRequestException('Validation Error: invalid time format (expected HH:MM or HH:MM:SS)');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new BadRequestException('Validation Error: time out of range');
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

function parseDaysOfWeek(value: unknown): number[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length === 0 || value.length > 7) {
    throw new BadRequestException('Validation Error: daysOfWeek must be an array of 1-7 day numbers');
  }
  const days = value.map((v) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 6) {
      throw new BadRequestException('Validation Error: daysOfWeek values must be 0 (Sun) through 6 (Sat)');
    }
    return n;
  });
  return [...new Set(days)].sort();
}

export function parseBulkGenerateSlotsDto(value: unknown): BulkGenerateSlotsDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error: payload must be an object');
  }

  const allowed = new Set([
    'hrId', 'departmentId', 'startDate', 'endDate',
    'times', 'slotTimes', 'daysOfWeek', 'isRecurring', 'frequency',
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error: unknown field in payload');
  }

  const payload = value as Record<string, unknown>;

  const timesRaw = payload.times ?? payload.slotTimes;
  if (!Array.isArray(timesRaw) || timesRaw.length === 0 || timesRaw.length > 24) {
    throw new BadRequestException('Validation Error: times must be an array of 1-24 time strings');
  }

  const isRecurring = typeof payload.isRecurring === 'boolean' ? payload.isRecurring : false;
  const daysOfWeek = parseDaysOfWeek(payload.daysOfWeek);

  const startDate = parseDateFlexible(payload.startDate);
  const endDate = parseDateFlexible(payload.endDate);
  if (startDate > endDate) {
    throw new BadRequestException('Validation Error: startDate must be on or before endDate');
  }

  return {
    hrId: parseUuid(payload.hrId),
    departmentId:
      payload.departmentId === undefined || payload.departmentId === null || payload.departmentId === ''
        ? null
        : parseUuid(payload.departmentId),
    startDate,
    endDate,
    slotTimes: timesRaw.map(parseTimeFlexible),
    daysOfWeek,
    isRecurring,
  };
}
