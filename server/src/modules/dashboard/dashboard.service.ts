import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: CareerJwtPayload) {
    const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
    const hrId = isElevated ? undefined : user.sub;

    const baseWhere = {
      deleted_at: null,
      ...(hrId ? { assigned_hr_id: hrId } : {}),
    };

    const slotWhere = {
      is_booked: true,
      ...(hrId ? { assigned_hr_id: hrId } : {}),
    };

    const [
      totalApplications,
      newApplications,
      hiredCount,
      rejectedCount,
      interviewsScheduled,
      recentApplications
    ] = await Promise.all([
      this.prisma.applications.count({ where: baseWhere }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'NEW' } }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'JOINED' } }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      this.prisma.slot_assignments.count({ where: slotWhere }),
      this.prisma.applications.findMany({
        where: baseWhere,
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          application_code: true,
          status: true,
          created_at: true,
          candidate: { select: { full_name: true } },
          department: { select: { name: true } }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalApplications,
        newApplications,
        interviewsScheduled,
        hiredCount,
        rejectedCount,
        recentApplications: recentApplications.map(r => ({
          id: r.id,
          applicationCode: r.application_code,
          status: r.status,
          candidateName: r.candidate?.full_name,
          departmentName: r.department?.name,
          createdAt: r.created_at
        }))
      }
    };
  }

  async getOfferStats(user: CareerJwtPayload) {
    const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
    const hrId = isElevated ? undefined : user.sub;

    const baseWhere = {
      deleted_at: null,
      ...(hrId ? { assigned_hr_id: hrId } : {}),
    };

    const [
      totalOffers,
      acceptedOffers,
      rejectedOffers,
      pendingOffers
    ] = await Promise.all([
      this.prisma.applications.count({ where: { ...baseWhere, status: { in: ['OFFER_RELEASED', 'JOINED'] } } }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'JOINED' } }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      this.prisma.applications.count({ where: { ...baseWhere, status: 'OFFER_RELEASED' } }),
    ]);

    const recentOffers = await this.prisma.applications.findMany({
      where: { ...baseWhere, status: { in: ['OFFER_RELEASED', 'JOINED', 'REJECTED'] } },
      orderBy: { updated_at: 'desc' },
      take: 10,
      select: {
        id: true,
        application_code: true,
        status: true,
        updated_at: true,
        candidate: { select: { full_name: true } },
        department: { select: { name: true } }
      }
    });

    return {
      success: true,
      data: {
        totalOffers,
        acceptedOffers,
        rejectedOffers,
        pendingOffers,
        recentOffers: recentOffers.map(r => ({
          id: r.id,
          applicationCode: r.application_code,
          status: r.status,
          candidateName: r.candidate?.full_name,
          departmentName: r.department?.name,
          updatedAt: r.updated_at
        }))
      }
    };
  }
}
