import { BadRequestException } from '@nestjs/common';

export interface CreateApplicationDto {
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsappNumber?: string | null;
  departmentId: string;
  opportunityId?: string | null;
  selfDescription: string;
  experienceYears: number;
  resumePath?: string | null;
  previousOrgProofPath?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // Basic E.164-like validation

export function parseUuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new BadRequestException('Validation Error: Invalid UUID');
  }
  return value;
}

export function parseRequiredText(value: unknown, maxLength: number, minLength = 1): string {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error: Expected string');
  const normalized = value.trim().replace(/<[^>]*>?/gm, ''); // Remove HTML tags
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new BadRequestException(`Validation Error: Length must be between ${minLength} and ${maxLength}`);
  }
  return normalized;
}

export function parseEmail(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error: Invalid email');
  const normalized = value.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized) || normalized.length > 255) throw new BadRequestException('Validation Error: Invalid email');
  return normalized;
}

export function parsePhone(value: unknown, required: boolean): string | null {
  if (!value && !required) return null;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error: Invalid phone');
  const normalized = value.trim().replace(/\s+/g, '');
  if (!PHONE_REGEX.test(normalized) || normalized.length > 20) throw new BadRequestException('Validation Error: Invalid phone format');
  return normalized;
}

export function parseCreateApplicationDto(value: unknown): CreateApplicationDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error: Payload must be an object');
  }

  const payload = value as Record<string, unknown>;

  const experienceYears = typeof payload.experienceYears === 'number'
    ? payload.experienceYears
    : typeof payload.experienceYears === 'string'
      ? parseInt(payload.experienceYears, 10)
      : NaN;

  if (isNaN(experienceYears) || experienceYears < 0 || experienceYears > 50) {
    throw new BadRequestException('Validation Error: experienceYears must be between 0 and 50');
  }

  return {
    fullName: parseRequiredText(payload.fullName, 255, 2),
    email: parseEmail(payload.email),
    mobileNumber: parsePhone(payload.mobileNumber, true) as string,
    whatsappNumber: parsePhone(payload.whatsappNumber, false),
    departmentId: parseUuid(payload.departmentId),
    opportunityId: payload.opportunityId ? parseUuid(payload.opportunityId) : null,
    selfDescription: parseRequiredText(payload.selfDescription, 5000, 10),
    experienceYears,
    resumePath: payload.resumePath ? parseRequiredText(payload.resumePath, 500) : null,
    previousOrgProofPath: payload.previousOrgProofPath ? parseRequiredText(payload.previousOrgProofPath, 500) : null,
  };
}
