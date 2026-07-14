import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { NotificationFilterDto } from './dto/notification-filter.dto';

export const notificationSelect = {
  id: true,
  application_id: true,
  recipient_hr_id: true,
  channel: true,
  message: true,
  status: true,
  read_at: true,
  created_at: true,
} satisfies Prisma.notification_logsSelect;

export type NotificationRecord = Prisma.notification_logsGetPayload<{
  select: typeof notificationSelect;
}>;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForRecipient(recipientHrId: string, query: NotificationFilterDto) {
    return this.prisma.notification_logs.findMany({
      where: {
        recipient_hr_id: recipientHrId,
        ...(query.unread === true ? { read_at: null } : {}),
        ...(query.unread === false ? { read_at: { not: null } } : {}),
      },
      select: notificationSelect,
      orderBy: [{ created_at: query.sortOrder }, { id: query.sortOrder }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
  }

  createMany(data: Prisma.notification_logsCreateManyInput[]) {
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification_logs.createMany({ data });
  }

  create(data: Prisma.notification_logsUncheckedCreateInput) {
    return this.prisma.notification_logs.create({
      data,
      select: notificationSelect,
    });
  }

  markRead(id: string, recipientHrId: string, readAt: Date) {
    return this.prisma.notification_logs.updateMany({
      where: { id, recipient_hr_id: recipientHrId, read_at: null },
      data: { read_at: readAt, status: 'SENT' },
    });
  }

  findForRecipient(id: string, recipientHrId: string) {
    return this.prisma.notification_logs.findFirst({
      where: { id, recipient_hr_id: recipientHrId },
      select: notificationSelect,
    });
  }

  markAllRead(recipientHrId: string, readAt: Date) {
    return this.prisma.notification_logs.updateMany({
      where: { recipient_hr_id: recipientHrId, read_at: null },
      data: { read_at: readAt, status: 'SENT' },
    });
  }

  findApplicationContext(applicationId: string) {
    return this.prisma.applications.findFirst({
      where: { id: applicationId, deleted_at: null },
      select: {
        id: true,
        application_code: true,
        status: true,
        department_id: true,
        assigned_hr_id: true,
        candidate: { select: { full_name: true } },
      },
    });
  }

  findActiveHr(id: string) {
    return this.prisma.hr_employees.findFirst({
      where: { id, is_active: true },
      select: { id: true },
    });
  }

  async resolveDepartmentAndAdminRecipients(departmentId: string | null): Promise<string[]> {
    const adminRoles = await this.prisma.hr_role_permissions.findMany({
      where: { permission: 'CAREER_ADMIN' },
      select: { performx_role: true },
    });
    const recipientFilters: Prisma.hr_employeesWhereInput[] = [
      ...(departmentId ? [{ department_id: departmentId }] : []),
      ...(adminRoles.length
        ? [{ performx_role: { in: adminRoles.map((role) => role.performx_role) } }]
        : []),
    ];
    if (recipientFilters.length === 0) return [];

    const rows = await this.prisma.hr_employees.findMany({
      where: {
        is_active: true,
        OR: recipientFilters,
      },
      select: { id: true },
    });
    return [...new Set(rows.map((row) => row.id))];
  }
}
