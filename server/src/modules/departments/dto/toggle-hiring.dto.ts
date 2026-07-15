import { BadRequestException } from '@nestjs/common';
import type { 
  opportunity_status_enum,
  priority_enum,
  hiring_type_enum,
  confidentiality_enum,
  career_level_enum,
  work_mode_enum
} from '@prisma/client';

export interface ToggleHiringDto {
  isHiringEnabled: boolean;
  status?: opportunity_status_enum | undefined;
  internalPosition?: string | undefined;
  numberOfOpenings?: number | undefined;
  hiringPriority?: priority_enum | undefined;
  hiringType?: hiring_type_enum | undefined;
  confidentialityLevel?: confidentiality_enum | undefined;
  hiringManagerId?: string | null | undefined;
  reportingManagerId?: string | null | undefined;
  internalNotes?: string | null | undefined;

  publicTitle?: string | undefined;
  careerLevel?: career_level_enum | undefined;
  workMode?: work_mode_enum | undefined;
  location?: string | undefined;
  minExperienceYears?: number | undefined;
  maxExperienceYears?: number | null | undefined;
  educationalQualification?: string | null | undefined;
  
  about?: string | null | undefined;
  responsibilities?: string | null | undefined;
  benefits?: string | null | undefined;
  careerGrowth?: string | null | undefined;
}

export function parseToggleHiringDto(value: unknown): ToggleHiringDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error: Must be an object');
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.isHiringEnabled !== 'boolean') {
    throw new BadRequestException('Validation Error: isHiringEnabled must be a boolean');
  }

  const dto: ToggleHiringDto = { isHiringEnabled: payload.isHiringEnabled };

  const parseString = (val: unknown, maxLength: number, required = false): string | undefined | null => {
    if (val === null || val === undefined) return required ? undefined : (val as null | undefined);
    if (typeof val !== 'string') throw new BadRequestException('Validation Error: Expected string');
    const trimmed = val.trim();
    if (required && trimmed.length === 0) throw new BadRequestException('Validation Error: Cannot be empty');
    if (trimmed.length > maxLength) throw new BadRequestException(`Validation Error: Max length ${maxLength} exceeded`);
    return trimmed.replace(/<[^>]*>?/gm, ''); // Basic sanitization against script tags
  };

  const parseEnum = <T extends string>(val: unknown, allowed: string[]): T | undefined => {
    if (val === undefined || val === null) return undefined;
    if (typeof val !== 'string' || !allowed.includes(val)) throw new BadRequestException('Validation Error: Invalid enum value');
    return val as T;
  };

  const parseIntVal = (val: unknown, min: number, max: number): number | undefined | null => {
    if (val === null || val === undefined) return val as null | undefined;
    if (typeof val !== 'number' || !Number.isInteger(val)) throw new BadRequestException('Validation Error: Expected integer');
    if (val < min || val > max) throw new BadRequestException(`Validation Error: Must be between ${min} and ${max}`);
    return val;
  };

  const parseUuid = (val: unknown): string | undefined | null => {
    if (val === null || val === undefined) return val as null | undefined;
    if (typeof val !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
      throw new BadRequestException('Validation Error: Invalid UUID');
    }
    return val;
  };

  if (payload.isHiringEnabled || payload.status === 'PUBLISHED') {
    // If we are publishing or enabling hiring, we must have the required fields per workflow
    dto.internalPosition = parseString(payload.internalPosition, 255, true) as string;
    dto.publicTitle = parseString(payload.publicTitle, 255, true) as string;
    dto.numberOfOpenings = parseIntVal(payload.numberOfOpenings, 1, 1000) as number || 1;
    dto.status = parseEnum(payload.status, ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']) || (payload.isHiringEnabled ? 'PUBLISHED' : 'DRAFT');
  } else {
    dto.internalPosition = parseString(payload.internalPosition, 255, false) as string | undefined;
    dto.publicTitle = parseString(payload.publicTitle, 255, false) as string | undefined;
    dto.numberOfOpenings = parseIntVal(payload.numberOfOpenings, 1, 1000) as number | undefined;
    dto.status = parseEnum(payload.status, ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']);
  }

  dto.hiringPriority = parseEnum(payload.hiringPriority, ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
  dto.hiringType = parseEnum(payload.hiringType, ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']);
  dto.confidentialityLevel = parseEnum(payload.confidentialityLevel, ['STANDARD', 'HIGH', 'STRICTLY_CONFIDENTIAL']);
  dto.careerLevel = parseEnum(payload.careerLevel, ['ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE']);
  dto.workMode = parseEnum(payload.workMode, ['ON_SITE', 'HYBRID', 'REMOTE']);
  
  dto.hiringManagerId = parseUuid(payload.hiringManagerId);
  dto.reportingManagerId = parseUuid(payload.reportingManagerId);
  
  dto.location = parseString(payload.location, 255, false) as string | undefined;
  dto.educationalQualification = parseString(payload.educationalQualification, 255, false) as string | null | undefined;
  
  dto.internalNotes = parseString(payload.internalNotes, 10000, false);
  dto.about = parseString(payload.about, 10000, false);
  dto.responsibilities = parseString(payload.responsibilities, 10000, false);
  dto.benefits = parseString(payload.benefits, 10000, false);
  dto.careerGrowth = parseString(payload.careerGrowth, 10000, false);

  dto.minExperienceYears = parseIntVal(payload.minExperienceYears, 0, 50) as number | undefined;
  dto.maxExperienceYears = parseIntVal(payload.maxExperienceYears, 0, 50);

  return dto;
}
