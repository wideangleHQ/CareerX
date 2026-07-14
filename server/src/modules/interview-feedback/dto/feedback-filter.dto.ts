import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';
import { parseRating } from './create-feedback.dto';

export interface FeedbackFilterDto {
  cursor?: string;
  limit: number;
  search?: string;
  applicationId?: string;
  departmentId?: string;
  hrId?: string;
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: 'createdAt' | 'rating';
  sortOrder: 'asc' | 'desc';
}

const SORT_FIELDS = new Set(['createdAt', 'rating']);
const SORT_ORDERS = new Set(['asc', 'desc']);

export function parseFeedbackFilterDto(query: Record<string, unknown>): FeedbackFilterDto {
  const allowed = new Set([
    'cursor',
    'limit',
    'search',
    'applicationId',
    'departmentId',
    'hrId',
    'rating',
    'dateFrom',
    'dateTo',
    'sortBy',
    'sortOrder',
  ]);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = parseOptionalString(query.cursor, 80);
  const search = parseOptionalString(query.search, 100);
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) throw new BadRequestException('Validation Error');

  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
    ...(search ? { search } : {}),
    ...(query.applicationId ? { applicationId: parseUuid(query.applicationId) } : {}),
    ...(query.departmentId ? { departmentId: parseUuid(query.departmentId) } : {}),
    ...(query.hrId ? { hrId: parseUuid(query.hrId) } : {}),
    ...(query.rating !== undefined && query.rating !== null && query.rating !== ''
      ? { rating: parseRating(query.rating) }
      : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    sortBy: parseSortBy(query.sortBy),
    sortOrder: parseSortOrder(query.sortOrder),
  };
}

function parseOptionalString(value: unknown, maxLength: number): string | undefined {
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

function parseDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Validation Error');
  return date;
}

function parseSortBy(value: unknown): FeedbackFilterDto['sortBy'] {
  if (value === undefined || value === null || value === '') return 'createdAt';
  if (typeof value !== 'string' || !SORT_FIELDS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as FeedbackFilterDto['sortBy'];
}

function parseSortOrder(value: unknown): FeedbackFilterDto['sortOrder'] {
  if (value === undefined || value === null || value === '') return 'desc';
  if (typeof value !== 'string' || !SORT_ORDERS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as FeedbackFilterDto['sortOrder'];
}
