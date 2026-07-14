import { Injectable } from '@nestjs/common';
import type { Prisma, log_status_enum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface EmailLogQuery {
  cursor?: string;
  limit: number;
  recipient?: string;
  status?: log_status_enum;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const emailLogSelect = {
  id: true,
  application_id: true,
  recipient: true,
  template: true,
  status: true,
  error_message: true,
  sent_at: true,
  created_at: true,
} satisfies Prisma.email_logsSelect;

@Injectable()
export class EmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  createQueuedLog(input: { applicationId: string | null; recipient: string; template: string }) {
    return this.prisma.email_logs.create({
      data: {
        application_id: input.applicationId,
        recipient: input.recipient,
        template: input.template,
        status: 'QUEUED',
      },
      select: { id: true },
    });
  }

  markSent(id: string) {
    return this.prisma.email_logs.update({
      where: { id },
      data: { status: 'SENT', sent_at: new Date(), error_message: null },
      select: { id: true },
    });
  }

  markFailed(id: string, error: string) {
    return this.prisma.email_logs.update({
      where: { id },
      data: { status: 'FAILED', error_message: error.slice(0, 1000) },
      select: { id: true },
    });
  }

  async findLogs(query: EmailLogQuery) {
    const where: Prisma.email_logsWhereInput = {
      ...(query.recipient ? { recipient: { contains: query.recipient, mode: 'insensitive' } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { recipient: { contains: query.search, mode: 'insensitive' } },
              { template: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            created_at: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.email_logs.findMany({
      where,
      select: emailLogSelect,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    return {
      success: true as const,
      data: rows.slice(0, query.limit).map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        recipient: row.recipient,
        template: row.template,
        status: row.status,
        errorMessage: row.error_message,
        sentAt: row.sent_at,
        createdAt: row.created_at,
      })),
      pagination: {
        limit: query.limit,
        nextCursor: hasMore ? (rows.at(query.limit - 1)?.id ?? null) : null,
        hasMore,
      },
    };
  }
}
