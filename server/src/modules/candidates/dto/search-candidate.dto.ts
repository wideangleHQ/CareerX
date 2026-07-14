import { BadRequestException } from '@nestjs/common';
import type { CandidateQuery } from '../candidates.service';

const SORT_FIELDS = new Set(['createdAt', 'fullName', 'email']);
const SORT_ORDERS = new Set(['asc', 'desc']);

export function parseCandidateQuery(query: Record<string, unknown>): CandidateQuery {
  const allowed = new Set(['cursor', 'limit', 'search', 'sortBy', 'sortOrder']);
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const cursor = parseOptionalString(query.cursor, 80);
  const search = parseOptionalString(query.search, 100);
  const limit = parseLimit(query.limit);
  const sortBy = parseSortBy(query.sortBy);
  const sortOrder = parseSortOrder(query.sortOrder);

  return {
    ...(cursor ? { cursor } : {}),
    limit,
    ...(search ? { search } : {}),
    sortBy,
    sortOrder,
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

function parseSortBy(value: unknown): CandidateQuery['sortBy'] {
  if (value === undefined || value === null || value === '') return 'createdAt';
  if (typeof value !== 'string' || !SORT_FIELDS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as CandidateQuery['sortBy'];
}

function parseSortOrder(value: unknown): CandidateQuery['sortOrder'] {
  if (value === undefined || value === null || value === '') return 'desc';
  if (typeof value !== 'string' || !SORT_ORDERS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as CandidateQuery['sortOrder'];
}
