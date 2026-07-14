import { BadRequestException } from '@nestjs/common';
import type { TemplateVariables } from '../templates/application-received.template';

export type EmailTemplate =
  | 'interview-invitation'
  | 'application-received'
  | 'application-selected'
  | 'application-rejected';

export interface EmailAttachmentDto {
  filename: string;
  contentBase64: string;
  contentType: string;
}

export interface SendEmailDto {
  recipients: string[];
  template: EmailTemplate;
  variables: TemplateVariables;
  applicationId: string | null;
  attachments: EmailAttachmentDto[];
}

const TEMPLATES = new Set<EmailTemplate>([
  'interview-invitation',
  'application-received',
  'application-selected',
  'application-rejected',
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseSendEmailDto(value: unknown): SendEmailDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Validation Error');
  }

  const allowed = new Set(['recipient', 'recipients', 'template', 'variables', 'applicationId', 'attachments']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new BadRequestException('Validation Error');
  }

  const payload = value as Record<string, unknown>;
  const recipients = parseRecipients(payload.recipients ?? payload.recipient);
  const template = parseTemplate(payload.template);
  return {
    recipients,
    template,
    variables: parseVariables(payload.variables),
    applicationId: parseApplicationId(payload.applicationId),
    attachments: parseAttachments(payload.attachments),
  };
}

function parseRecipients(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [value];
  if (raw.length === 0 || raw.length > 100) throw new BadRequestException('Validation Error');
  const recipients = raw.map((item) => {
    if (typeof item !== 'string') throw new BadRequestException('Validation Error');
    const email = item.trim().toLowerCase();
    if (email.length > 255 || /[\r\n]/.test(email) || !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Validation Error');
    }
    return email;
  });
  return [...new Set(recipients)];
}

function parseTemplate(value: unknown): EmailTemplate {
  if (typeof value !== 'string' || !TEMPLATES.has(value as EmailTemplate)) {
    throw new BadRequestException('Validation Error');
  }
  return value as EmailTemplate;
}

function parseVariables(value: unknown): TemplateVariables {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Validation Error');
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 50) throw new BadRequestException('Validation Error');
  const variables: TemplateVariables = {};
  for (const [key, item] of entries) {
    if (!/^[a-zA-Z0-9_]{1,50}$/.test(key)) throw new BadRequestException('Validation Error');
    let parsed: TemplateVariables[string];
    if (typeof item === 'string') {
      parsed = item.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 1000);
    } else if (typeof item === 'number' || typeof item === 'boolean' || item === null) {
      parsed = item;
    } else {
      throw new BadRequestException('Validation Error');
    }
    variables[key] = parsed;
  }
  return variables;
}

function parseApplicationId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) throw new BadRequestException('Validation Error');
  return value;
}

function parseAttachments(value: unknown): EmailAttachmentDto[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 10) throw new BadRequestException('Validation Error');
  return value.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new BadRequestException('Validation Error');
    }
    const attachment = item as Record<string, unknown>;
    const filename = parseHeaderSafeString(attachment.filename, 255);
    const contentType = parseHeaderSafeString(attachment.contentType, 100);
    if (typeof attachment.contentBase64 !== 'string' || attachment.contentBase64.length > 10_000_000) {
      throw new BadRequestException('Validation Error');
    }
    return { filename, contentType, contentBase64: attachment.contentBase64 };
  });
}

function parseHeaderSafeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') throw new BadRequestException('Validation Error');
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maxLength || /[\r\n]/.test(normalized)) {
    throw new BadRequestException('Validation Error');
  }
  return normalized;
}
