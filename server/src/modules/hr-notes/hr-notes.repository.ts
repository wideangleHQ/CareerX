import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const hrNoteSelect = {
  id: true,
  application_id: true,
  hr_id: true,
  note: true,
  created_at: true,
  hr: {
    select: { id: true, full_name: true, email: true },
  },
} satisfies Prisma.hr_notesSelect;

export type HrNoteRecord = Prisma.hr_notesGetPayload<{ select: typeof hrNoteSelect }>;

@Injectable()
export class HrNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findApplication(applicationId: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.applications.findFirst({
      where: { id: applicationId, deleted_at: null },
      select: { id: true },
    });
  }

  findActiveHr(hrId: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.hr_employees.findFirst({
      where: { id: hrId, is_active: true },
      select: { id: true },
    });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.hr_notes.findUnique({
      where: { id },
      select: hrNoteSelect,
    });
  }

  create(applicationId: string, hrId: string, note: string, tx: Prisma.TransactionClient) {
    return tx.hr_notes.create({
      data: { application_id: applicationId, hr_id: hrId, note },
      select: hrNoteSelect,
    });
  }

  findByApplication(applicationId: string, limit: number, cursor?: string) {
    return this.prisma.hr_notes.findMany({
      where: { application_id: applicationId },
      select: hrNoteSelect,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  update(id: string, note: string, tx: Prisma.TransactionClient) {
    return tx.hr_notes.update({
      where: { id },
      data: { note },
      select: hrNoteSelect,
    });
  }

  createAuditLog(
    actorId: string,
    noteId: string,
    oldValue: string,
    newValue: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.audit_logs.create({
      data: {
        actor_id: actorId,
        action: 'HR_NOTE_UPDATED',
        entity: 'hr_notes',
        entity_id: noteId,
        old_value: oldValue,
        new_value: newValue,
      },
      select: { id: true },
    });
  }

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }
}
