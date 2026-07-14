import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const feedbackListSelect = {
  id: true,
  rating: true,
  notes: true,
  created_at: true,
  application: {
    select: {
      id: true,
      application_code: true,
      status: true,
      candidate: { select: { id: true, full_name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  },
  hr: { select: { id: true, full_name: true, email: true } },
} satisfies Prisma.interview_feedbackSelect;

export const feedbackDetailSelect = {
  ...feedbackListSelect,
  application: {
    select: {
      id: true,
      application_code: true,
      status: true,
      self_description: true,
      candidate: {
        select: { id: true, full_name: true, email: true, mobile_number: true },
      },
      department: { select: { id: true, name: true } },
      slot_assignment: {
        select: {
          id: true,
          slot_id: true,
          assigned_hr_id: true,
          slot: { select: { id: true, slot_date: true, slot_time: true } },
        },
      },
    },
  },
} satisfies Prisma.interview_feedbackSelect;

@Injectable()
export class InterviewFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById<T extends Prisma.interview_feedbackSelect>(
    id: string,
    select: T,
  ): Prisma.PrismaPromise<Prisma.interview_feedbackGetPayload<{ select: T }> | null> {
    return this.prisma.interview_feedback.findUnique({ where: { id }, select });
  }

  findMany<T extends Prisma.interview_feedbackFindManyArgs>(args: T) {
    return this.prisma.interview_feedback.findMany(args);
  }

  get client() {
    return this.prisma;
  }
}
