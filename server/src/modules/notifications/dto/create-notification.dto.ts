import { BadRequestException } from '@nestjs/common';
import type { notification_channel_enum } from '@prisma/client';
import { parseRequiredText, parseUuid } from '../../applications/dto/create-application.dto';

export interface CreateNotificationDto {
  recipientHrId: string;
  message: string;
  applicationId?: string;
  channel: notification_channel_enum;
}

const CHANNELS = new Set(['IN_APP', 'EMAIL', 'WHATSAPP']);

export function parseCreateNotificationDto(value: unknown): CreateNotificationDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['recipientHrId', 'message', 'applicationId', 'channel']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  return {
    recipientHrId: parseUuid(payload.recipientHrId),
    message: parseRequiredText(payload.message, 1000),
    ...(payload.applicationId ? { applicationId: parseUuid(payload.applicationId) } : {}),
    channel: parseChannel(payload.channel),
  };
}

function parseChannel(value: unknown): notification_channel_enum {
  if (value === undefined || value === null || value === '') return 'IN_APP';
  if (typeof value !== 'string' || !CHANNELS.has(value)) {
    throw new BadRequestException('Validation Error');
  }
  return value as notification_channel_enum;
}
