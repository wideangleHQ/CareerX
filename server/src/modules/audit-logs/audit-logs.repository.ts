import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditFilterDto } from './dto/audit-filter.dto';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: AuditFilterDto): Prisma.audit_logsWhereInput {
    const where: Prisma.audit_logsWhereInput = {};

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entity: { contains: filters.search, mode: 'insensitive' } },
        { old_value: { contains: filters.search, mode: 'insensitive' } },
        { new_value: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.actor_id) where.actor_id = filters.actor_id;
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;

    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at.gte = new Date(filters.start_date);
      if (filters.end_date) where.created_at.lte = new Date(filters.end_date);
    }

    return where;
  }

  async findAll(filters: AuditFilterDto) {
    const where = this.buildWhere(filters);
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);
    
    const orderBy: Prisma.audit_logsOrderByWithRelationInput = {};
    if (filters.sort_by) {
      orderBy[filters.sort_by as keyof Prisma.audit_logsOrderByWithRelationInput] = filters.sort_order || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        skip,
        take: filters.limit || 10,
        orderBy,
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    return { data, total, page: filters.page || 1, limit: filters.limit || 10 };
  }

  async findById(id: string) {
    return this.prisma.audit_logs.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.audit_logsUncheckedCreateInput) {
    return this.prisma.audit_logs.create({
      data,
    });
  }
}
