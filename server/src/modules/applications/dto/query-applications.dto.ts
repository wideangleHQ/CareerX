import { BadRequestException } from '@nestjs/common';
import type { application_status_enum } from '@prisma/client';
import { parseUuid } from './create-application.dto';

export interface QueryApplicationsDto {
  cursor?: string;
  limit: number;
  search?: string;
  departmentId?: string;
  hiringOpportunityId?: string;
  status?: application_status_enum;
  assignedHrId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  careerLevel?: string;
  hiringType?: string;
  hiringPriority?: string;
  workMode?: string;
  location?: string;
  minExperience?: number;
  maxExperience?: number;
  sortBy: 'createdAt' | 'updatedAt' | 'status' | 'candidateName' | 'department' | 'assignedHr' | 'priority';
  sortOrder: 'asc' | 'desc';
}

const STATUSES = new Set(['NEW', 'SLOT_BOOKED', 'INTERVIEWED', 'SELECTED', 'OFFER_RELEASED', 'JOINED', 'REJECTED', 'WITHDRAWN']);
const SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'status', 'candidateName', 'department', 'assignedHr', 'priority']);
const SORT_ORDERS = new Set(['asc', 'desc']);

export function parseQueryApplicationsDto(query: Record<string, unknown>): QueryApplicationsDto {
  const allowed = new Set([
    'cursor',
    'limit',
    'search',
    'departmentId',
    'hiringOpportunityId',
    'status',
    'assignedHrId',
    'dateFrom',
    'dateTo',
    'careerLevel',
    'hiringType',
    'hiringPriority',
    'workMode',
    'location',
    'minExperience',
    'maxExperience',
    'sortBy',
    'sortOrder',
  ]);
  
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error: Unknown query parameter');
  }

  const cursor = parseOptionalString(query.cursor, 80);
  const search = parseOptionalString(query.search, 100);
  const departmentId = query.departmentId ? parseUuid(query.departmentId) : undefined;
  const hiringOpportunityId = query.hiringOpportunityId ? parseUuid(query.hiringOpportunityId) : undefined;
  const assignedHrId = query.assignedHrId ? parseUuid(query.assignedHrId) : undefined;
  const status = parseStatus(query.status);
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo);

  const careerLevel = parseOptionalString(query.careerLevel, 50);
  const hiringType = parseOptionalString(query.hiringType, 50);
  const hiringPriority = parseOptionalString(query.hiringPriority, 50);
  const workMode = parseOptionalString(query.workMode, 50);
  const location = parseOptionalString(query.location, 100);
  
  const minExperience = query.minExperience !== undefined ? Number(query.minExperience) : undefined;
  const maxExperience = query.maxExperience !== undefined ? Number(query.maxExperience) : undefined;

  if (dateFrom && dateTo && dateFrom > dateTo) throw new BadRequestException('Validation Error');

  return {
    ...(cursor ? { cursor } : {}),
    limit: parseLimit(query.limit),
    ...(search ? { search } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(hiringOpportunityId ? { hiringOpportunityId } : {}),
    ...(status ? { status } : {}),
    ...(assignedHrId ? { assignedHrId } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(careerLevel ? { careerLevel } : {}),
    ...(hiringType ? { hiringType } : {}),
    ...(hiringPriority ? { hiringPriority } : {}),
    ...(workMode ? { workMode } : {}),
    ...(location ? { location } : {}),
    ...(minExperience !== undefined ? { minExperience } : {}),
    ...(maxExperience !== undefined ? { maxExperience } : {}),
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

function parseStatus(value: unknown): application_status_enum | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !STATUSES.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as application_status_enum;
}

function parseDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Validation Error');
  return date;
}

function parseSortBy(value: unknown): QueryApplicationsDto['sortBy'] {
  if (value === undefined || value === null || value === '') return 'createdAt';
  if (typeof value !== 'string' || !SORT_FIELDS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as QueryApplicationsDto['sortBy'];
}

function parseSortOrder(value: unknown): QueryApplicationsDto['sortOrder'] {
  if (value === undefined || value === null || value === '') return 'desc';
  if (typeof value !== 'string' || !SORT_ORDERS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as QueryApplicationsDto['sortOrder'];
}
