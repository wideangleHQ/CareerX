import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';

export interface NotificationFilterDto {
  cursor?: string;
  limit: number;
  unread?: boolean;
  sortOrder: 'asc' | 'desc';
}

const SORT_ORDERS = new Set(['asc', 'desc']);

export function parseNotificationFilterDto(query: Record<string, unknown>): NotificationFilterDto {
  const allowed = new Set(['cursor', 'limit', 'unread', 'sortOrder']);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = parseOptionalUuid(query.cursor);
  const unread = parseOptionalBoolean(query.unread);
  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
    ...(unread !== undefined ? { unread } : {}),
    sortOrder: parseSortOrder(query.sortOrder),
  };
}

function parseOptionalUuid(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parseUuid(value);
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new BadRequestException('Validation Error');
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

function parseSortOrder(value: unknown): 'asc' | 'desc' {
  if (value === undefined || value === null || value === '') return 'desc';
  if (typeof value !== 'string' || !SORT_ORDERS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as 'asc' | 'desc';
}
