import { BadRequestException } from '@nestjs/common';
import { parseUuid } from './create-application.dto';

export interface AssignHrDto {
  hrId: string;
}

export function parseAssignHrDto(value: unknown): AssignHrDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== 'hrId') {
    throw new BadRequestException('Validation Error');
  }

  return { hrId: parseUuid((value as { hrId?: unknown }).hrId) };
}
