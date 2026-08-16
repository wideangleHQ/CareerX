import { candidateError, ApplicationErrorCode } from '../../../common/errors/application-errors';

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
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

function validationError(fields: Record<string, string>): never {
  return candidateError(ApplicationErrorCode.VALIDATION_ERROR, fields);
}

export function parseUuid(value: unknown, fieldName = 'id'): string {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    validationError({ [fieldName]: `Please provide a valid ${fieldName}.` });
  }
  return value;
}

export function parseRequiredText(value: unknown, maxLength: number, minLength?: number): string;
export function parseRequiredText(value: unknown, fieldName: string, maxLength: number, minLength?: number): string;
export function parseRequiredText(value: unknown, fieldOrMax: string | number, maxOrMin?: number, minLength?: number): string {
  let fieldName: string;
  let maxLength: number;
  let min: number;
  if (typeof fieldOrMax === 'number') {
    fieldName = 'field';
    maxLength = fieldOrMax;
    min = maxOrMin ?? 1;
  } else {
    fieldName = fieldOrMax;
    maxLength = maxOrMin!;
    min = minLength ?? 1;
  }
  if (typeof value !== 'string') validationError({ [fieldName]: `${fieldName} is required.` });
  const normalized = value.trim().replace(/<[^>]*>?/gm, '');
  if (normalized.length < min) validationError({ [fieldName]: `${fieldName} must be at least ${min} characters.` });
  if (normalized.length > maxLength) validationError({ [fieldName]: `${fieldName} must not exceed ${maxLength} characters.` });
  return normalized;
}

export function parseEmail(value: unknown): string {
  if (typeof value !== 'string') validationError({ email: 'Please provide a valid email address.' });
  const normalized = value.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized) || normalized.length > 255) validationError({ email: 'Please provide a valid email address.' });
  return normalized;
}

export function parsePhone(value: unknown, fieldName: string, required: boolean): string | null;
export function parsePhone(value: unknown, required: boolean): string | null;
export function parsePhone(value: unknown, fieldOrRequired: string | boolean, required?: boolean): string | null {
  let fieldName: string;
  let isRequired: boolean;
  if (typeof fieldOrRequired === 'boolean') {
    fieldName = 'phone';
    isRequired = fieldOrRequired;
  } else {
    fieldName = fieldOrRequired;
    isRequired = required!;
  }
  if (!value && !isRequired) return null;
  if (typeof value !== 'string') validationError({ [fieldName]: 'Please provide a valid phone number.' });
  const normalized = value.trim().replace(/\s+/g, '');
  if (!PHONE_REGEX.test(normalized) || normalized.length > 20) validationError({ [fieldName]: 'Please provide a valid phone number (e.g. +91XXXXXXXXXX).' });
  return normalized;
}

export function parseCreateApplicationDto(value: unknown): CreateApplicationDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    validationError({ _form: 'Invalid request format.' });
  }

  const payload = value as Record<string, unknown>;

  const experienceYears = typeof payload.experienceYears === 'number'
    ? payload.experienceYears
    : typeof payload.experienceYears === 'string'
      ? parseInt(payload.experienceYears, 10)
      : NaN;

  if (isNaN(experienceYears) || experienceYears < 0 || experienceYears > 50) {
    validationError({ experienceYears: 'Experience must be between 0 and 50 years.' });
  }

  return {
    fullName: parseRequiredText(payload.fullName, 'fullName', 255, 2),
    email: parseEmail(payload.email),
    mobileNumber: parsePhone(payload.mobileNumber, 'mobileNumber', true) as string,
    whatsappNumber: parsePhone(payload.whatsappNumber, 'whatsappNumber', false),
    departmentId: parseUuid(payload.departmentId, 'departmentId'),
    opportunityId: payload.opportunityId ? parseUuid(payload.opportunityId, 'opportunityId') : null,
    selfDescription: parseRequiredText(payload.selfDescription, 'selfDescription', 5000, 10),
    experienceYears,
    resumePath: payload.resumePath ? parseRequiredText(payload.resumePath, 'resumePath', 500) : null,
    previousOrgProofPath: payload.previousOrgProofPath ? parseRequiredText(payload.previousOrgProofPath, 'previousOrgProofPath', 500) : null,
  };
}
