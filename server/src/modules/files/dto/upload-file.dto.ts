import { BadRequestException } from '@nestjs/common';
import { parseUuid } from '../../applications/dto/create-application.dto';

export type FileType =
  | 'RESUME'
  | 'ORG_PROOF'
  | 'CERTIFICATE'
  | 'OFFER_LETTER'
  | 'JOINING_LETTER'
  | 'OTHER';

export interface UploadFileDto {
  applicationId: string;
  candidateId: string;
  fileType: FileType;
}

const FILE_TYPES = new Set<FileType>([
  'RESUME',
  'ORG_PROOF',
  'CERTIFICATE',
  'OFFER_LETTER',
  'JOINING_LETTER',
  'OTHER',
]);

export function parseUploadFileDto(value: unknown): UploadFileDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['applicationId', 'candidateId', 'fileType']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    applicationId: parseUuid(payload.applicationId),
    candidateId: parseUuid(payload.candidateId),
    fileType: parseFileType(payload.fileType),
  };
}

function parseFileType(value: unknown): FileType {
  if (typeof value !== 'string' || !FILE_TYPES.has(value as FileType)) {
    throw new BadRequestException('Validation Error');
  }
  return value as FileType;
}
