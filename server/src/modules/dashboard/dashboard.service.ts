import { Injectable } from '@nestjs/common';
import type { application_status_enum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';

// Every status in application_status_enum. Seeding the tally with all of them
// means a status with no rows reports 0 instead of being absent from the
// payload, and adding a new enum member surfaces here instead of silently
// dropping out of the dashboard.
const APPLICATION_STATUSES: application_status_enum[] = [
  'NEW',
  'SLOT_BOOKED',
  'INTERVIEWED',
  'SHORTLISTED',
  'SELECTED',
  'OFFER_RELEASED',
  'JOINED',
  'REJECTED',
  'WITHDRAWN',
];

type StatusTally = Record<application_status_enum, number>;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private emptyTally(): StatusTally {
    return Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as StatusTally;
  }

  // Same visibility rule the applications list uses, so the cards can never
  // disagree with the table beneath them. Non-elevated HR sees their own
  // candidates plus the unassigned intake queue (applications start with
  // assigned_hr_id = null and only gain an owner at slot booking, and SQL
  // equality never matches NULL). Elevated roles stay org-wide.
  private scopeToUser(user: CareerJwtPayload) {
    const isElevated =
      user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
    return {
      deleted_at: null,
      ...(isElevated
        ? {}
        : { OR: [{ assigned_hr_id: user.sub }, { assigned_hr_id: null }] }),
    };
  }

  async getStats(user: CareerJwtPayload) {
    const baseWhere = this.scopeToUser(user);

    // One grouped query replaces the per-metric counts, so every card is
    // derived from a single consistent snapshot of the same rows.
    const [grouped, recentApplications] = await Promise.all([
      this.prisma.applications.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
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

    const byStatus = this.emptyTally();
    for (const row of grouped) {
      byStatus[row.status] = row._count._all;
    }
    const totalApplications = APPLICATION_STATUSES.reduce((sum, s) => sum + byStatus[s], 0);

    return {
      success: true,
      data: {
        totalApplications,
        newApplications: byStatus.NEW,
        // An interview is "scheduled" while the application sits in
        // SLOT_BOOKED. Counting slot_assignments instead (the previous
        // behaviour) also swept in interviews already conducted and
        // candidates who later withdrew or were rejected.
        interviewsScheduled: byStatus.SLOT_BOOKED,
        selectedCount: byStatus.SELECTED,
        offersReleased: byStatus.OFFER_RELEASED,
        joinedCount: byStatus.JOINED,
        rejectedCount: byStatus.REJECTED,
        byStatus,
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
    const baseWhere = this.scopeToUser(user);

    // Only rejections that happened *after* an offer went out count as a
    // declined offer. The previous query counted every REJECTED application,
    // including candidates screened out long before the offer stage.
    const declinedWhere = {
      ...baseWhere,
      status: 'REJECTED' as const,
      status_history: { some: { from_status: 'OFFER_RELEASED' as const } },
    };

    const [grouped, declinedOffers, recentOffers] = await Promise.all([
      this.prisma.applications.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.applications.count({ where: declinedWhere }),
      this.prisma.applications.findMany({
        where: { ...baseWhere, status: { in: ['OFFER_RELEASED', 'JOINED'] } },
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
      })
    ]);

    const byStatus = this.emptyTally();
    for (const row of grouped) {
      byStatus[row.status] = row._count._all;
    }

    return {
      success: true,
      data: {
        // Offer released and awaiting a response.
        releasedOffers: byStatus.OFFER_RELEASED,
        // JOINED is the only accepted-offer state in application_status_enum.
        acceptedOffers: byStatus.JOINED,
        joinedCount: byStatus.JOINED,
        declinedOffers,
        totalOffers: byStatus.OFFER_RELEASED + byStatus.JOINED + declinedOffers,
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
