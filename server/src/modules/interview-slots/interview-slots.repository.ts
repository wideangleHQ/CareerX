import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InterviewSlotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findHr(id: string) {
    return this.prisma.hr_employees.findFirst({
      where: { id, is_active: true },
      select: { id: true, department_id: true },
    });
  }

  findDepartment(id: string) {
    return this.prisma.departments.findFirst({
      where: { 
        id,
        hiring_opportunities: { some: {} }
      },
      select: { id: true },
    });
  }

  findConflict(hrId: string, slotDate: Date, slotTime: Date) {
    return this.prisma.interview_slots.findFirst({
      where: { hr_id: hrId, slot_date: slotDate, slot_time: slotTime },
      select: { id: true },
    });
  }

  create(data: Prisma.interview_slotsUncheckedCreateInput, select: Prisma.interview_slotsSelect) {
    return this.prisma.interview_slots.create({ data, select });
  }
}
