import { BadRequestException } from '@nestjs/common';

export interface CreateCandidateDto {
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const email = value.trim().toLowerCase();
  if (email.length > 255 || !EMAIL_REGEX.test(email)) {
    throw new BadRequestException('Validation Error');
  }
  return email;
}

export function normalizeRequiredString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new BadRequestException('Validation Error');
  }
  return normalized;
}

export function normalizePhone(value: unknown, required: true): string;
export function normalizePhone(value: unknown, required: false): string | null;
export function normalizePhone(value: unknown, required: boolean): string | null {
  if ((value === undefined || value === null || value === '') && !required) return null;
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const phone = value.replace(/[\s().-]/g, '').trim();
  if (!/^\+?\d{7,15}$/.test(phone) || phone.length > 20) {
    throw new BadRequestException('Validation Error');
  }
  return phone;
}

export function parseCreateCandidateDto(value: unknown): CreateCandidateDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['fullName', 'email', 'mobileNumber', 'whatsappNumber']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    fullName: normalizeRequiredString(payload.fullName, 255),
    email: normalizeEmail(payload.email),
    mobileNumber: normalizePhone(payload.mobileNumber, true),
    whatsappNumber: normalizePhone(payload.whatsappNumber, false),
  };
}
