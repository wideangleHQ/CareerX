import { BadRequestException } from '@nestjs/common';

export interface QuerySlotsDto {
  cursor?: string;
  limit: number;
  departmentId?: string;
  hrId?: string;
  date?: Date;
  isBooked?: boolean;
  availableOnly: boolean;
  sortOrder: 'asc' | 'desc';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseUuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value;
}

export function parseDateOnly(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Validation Error');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Validation Error');
  return date;
}

export function parseTimeOnly(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    throw new BadRequestException('Validation Error');
  }
  const [hourText, minuteText] = value.split(':') as [string, string];
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (hour > 23 || minute > 59) throw new BadRequestException('Validation Error');
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

export function parseQuerySlotsDto(query: Record<string, unknown>, publicOnly = false): QuerySlotsDto {
  const allowed = new Set([
    'cursor',
    'limit',
    'departmentId',
    'hrId',
    'date',
    'isBooked',
    'availableOnly',
    'sortOrder',
  ]);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = optionalString(query.cursor, 80);
  const departmentId = query.departmentId ? parseUuid(query.departmentId) : undefined;
  const hrId = publicOnly ? undefined : query.hrId ? parseUuid(query.hrId) : undefined;
  const date = query.date ? parseDateOnly(query.date) : undefined;

  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
    ...(departmentId ? { departmentId } : {}),
    ...(hrId ? { hrId } : {}),
    ...(date ? { date } : {}),
    ...(publicOnly ? { isBooked: false } : parseIsBooked(query.isBooked)),
    availableOnly: publicOnly || query.availableOnly === 'true',
    sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
  };
}

function optionalString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const normalized = value.trim();
  if (normalized.length === 0) return undefined;
  if (normalized.length > maxLength) throw new BadRequestException('Validation Error');
  return normalized;
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === null || value === '') return 20;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException('Validation Error');
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Validation Error');
  }
  return limit;
}

function parseIsBooked(value: unknown): { isBooked?: boolean } {
  if (value === undefined || value === null || value === '') return {};
  if (value !== 'true' && value !== 'false') throw new BadRequestException('Validation Error');
  return { isBooked: value === 'true' };
}
