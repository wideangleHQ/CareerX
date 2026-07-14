import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsRepository {
  constructor(private prisma: PrismaService) {}

  private buildApplicationWhere(filters: ReportFilterDto, user?: any): Prisma.applicationsWhereInput {
    const where: Prisma.applicationsWhereInput = {
      deleted_at: null,
    };

    if (filters.search) {
      where.OR = [
        { application_code: { contains: filters.search, mode: 'insensitive' } },
        { candidate: { full_name: { contains: filters.search, mode: 'insensitive' } } },
        { candidate: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.department_id) where.department_id = filters.department_id;
    if (filters.status) where.status = filters.status;
    if (filters.assigned_hr_id) where.assigned_hr_id = filters.assigned_hr_id;
    
    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at.gte = new Date(filters.start_date);
      if (filters.end_date) where.created_at.lte = new Date(filters.end_date);
    }

    if (user) {
      const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
      if (!isElevated) {
         where.assigned_hr_id = user.sub;
      }
    }

    return where;
  }

  async getApplications(filters: ReportFilterDto) {
    const where = this.buildApplicationWhere(filters);
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);
    
    const orderBy: Prisma.applicationsOrderByWithRelationInput = {};
    if (filters.sort_by) {
      orderBy[filters.sort_by as keyof Prisma.applicationsOrderByWithRelationInput] = filters.sort_order || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.applications.findMany({
        where,
        skip,
        take: filters.limit || 10,
        orderBy,
        include: {
          candidate: true,
          department: true,
          assigned_hr: true,
        },
      }),
      this.prisma.applications.count({ where }),
    ]);

    return { data, total, page: filters.page || 1, limit: filters.limit || 10 };
  }

  async getAllApplicationsForExport(filters: ReportFilterDto) {
     return this.prisma.applications.findMany({
       where: this.buildApplicationWhere(filters),
       orderBy: { created_at: 'desc' },
       include: {
          candidate: true,
          department: true,
          assigned_hr: true,
       }
     });
  }

  private buildInterviewWhere(filters: ReportFilterDto, user?: any): Prisma.interview_slotsWhereInput {
    const where: Prisma.interview_slotsWhereInput = {};
    if (filters.start_date || filters.end_date) {
      where.slot_date = {};
      if (filters.start_date) where.slot_date.gte = new Date(filters.start_date);
      if (filters.end_date) where.slot_date.lte = new Date(filters.end_date);
    }
    if (filters.department_id) where.department_id = filters.department_id;
    if (filters.assigned_hr_id) where.hr_id = filters.assigned_hr_id;

    if (user) {
      const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
      if (!isElevated) {
         where.hr_id = user.sub;
      }
    }

    return where;
  }

  async getInterviews(filters: ReportFilterDto) {
     const where = this.buildInterviewWhere(filters);
     const skip = ((filters.page || 1) - 1) * (filters.limit || 10);

     const data = await this.prisma.interview_slots.findMany({
       where,
       skip,
       take: filters.limit || 10,
       orderBy: [{ slot_date: 'desc' }, { slot_time: 'desc' }],
       include: {
         hr: true,
         department: true,
         slot_assignment: {
           include: { application: { include: { candidate: true } } }
         }
       }
     });
     
     const total = await this.prisma.interview_slots.count({ where });

     const stats = await this.prisma.interview_slots.groupBy({
       by: ['is_booked'],
       where,
       _count: true,
     });

     return { data, total, page: filters.page || 1, limit: filters.limit || 10, stats };
  }

  async getAllInterviewsForExport(filters: ReportFilterDto) {
     return this.prisma.interview_slots.findMany({
       where: this.buildInterviewWhere(filters),
       orderBy: [{ slot_date: 'desc' }, { slot_time: 'desc' }],
       include: {
         hr: true,
         department: true,
         slot_assignment: {
           include: { application: { include: { candidate: true } } }
         }
       }
     });
  }

  async getDashboardMetrics(filters: ReportFilterDto, user: any) {
    const where = this.buildApplicationWhere(filters, user);
    
    // Group by status for fast aggregation
    const statusCounts = await this.prisma.applications.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    const metrics: any = {
      applicationsReceived: 0,
      shortlisted: 0,
      selected: 0,
      offersReleased: 0,
      offersAccepted: 0,
      joined: 0,
      rejected: 0,
      withdrawn: 0
    };

    statusCounts.forEach(s => {
      metrics.applicationsReceived += s._count;
      if (s.status === 'SHORTLISTED') metrics.shortlisted += s._count;
      if (s.status === 'SELECTED') metrics.selected += s._count;
      if (s.status === 'OFFER_RELEASED') metrics.offersReleased += s._count;
      if (s.status === 'JOINED') {
         metrics.joined += s._count;
         metrics.offersAccepted += s._count;
      }
      if (s.status === 'REJECTED') metrics.rejected += s._count;
      if (s.status === 'WITHDRAWN') metrics.withdrawn += s._count;
    });

    // Also get interviews
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const intWhere = this.buildInterviewWhere(filters, user);
    const [todaysInterviews, upcomingInterviews] = await Promise.all([
      this.prisma.interview_slots.count({
        where: { ...intWhere, is_booked: true, slot_date: { gte: today, lt: tomorrow } }
      }),
      this.prisma.interview_slots.count({
        where: { ...intWhere, is_booked: true, slot_date: { gte: tomorrow } }
      })
    ]);

    metrics.todaysInterviews = todaysInterviews;
    metrics.upcomingInterviews = upcomingInterviews;

    const totalDecided = metrics.joined + metrics.rejected;
    metrics.hiringSuccessRate = totalDecided > 0 ? (metrics.joined / totalDecided) * 100 : 0;
    
    const totalOffers = metrics.offersReleased + metrics.offersAccepted;
    metrics.offerAcceptanceRate = totalOffers > 0 ? (metrics.offersAccepted / totalOffers) * 100 : 0;

    return { success: true, data: metrics };
  }

  async getHiringFunnel(filters: ReportFilterDto, user: any) {
    const where = this.buildApplicationWhere(filters, user);
    
    const statusCounts = await this.prisma.applications.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    const counts: Record<string, number> = {};
    let total = 0;
    statusCounts.forEach(s => {
      counts[s.status] = s._count;
      total += s._count;
    });

    // A candidate in a late stage passed through early stages (mostly)
    // We build a cumulative funnel
    const joined = counts['JOINED'] || 0;
    const offersReleased = (counts['OFFER_RELEASED'] || 0) + joined;
    const selected = (counts['SELECTED'] || 0) + offersReleased;
    const shortlisted = (counts['SHORTLISTED'] || 0) + selected;
    const interviewed = (counts['INTERVIEWED'] || 0) + shortlisted;
    const interviewScheduled = (counts['SLOT_BOOKED'] || 0) + interviewed;
    const applications = total;

    return {
      success: true,
      data: {
        applications,
        interviewScheduled,
        interviewCompleted: interviewed,
        shortlisted,
        selected,
        offersReleased,
        joined
      }
    };
  }

  async getHrPerformance(filters: ReportFilterDto, user: any) {
    const where = this.buildApplicationWhere(filters, user);
    
    // Group by HR
    const hrStats = await this.prisma.applications.groupBy({
      by: ['assigned_hr_id', 'status'],
      where: { ...where, assigned_hr_id: { not: null } },
      _count: true
    });

    const performanceMap = new Map();
    hrStats.forEach(stat => {
      const hrId = stat.assigned_hr_id;
      if (!performanceMap.has(hrId)) {
        performanceMap.set(hrId, { hrId, totalAssigned: 0, shortlisted: 0, offers: 0, joined: 0 });
      }
      const data = performanceMap.get(hrId);
      data.totalAssigned += stat._count;
      if (['SHORTLISTED', 'SELECTED', 'OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.shortlisted += stat._count;
      }
      if (['OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.offers += stat._count;
      }
      if (stat.status === 'JOINED') {
        data.joined += stat._count;
      }
    });

    return { success: true, data: Array.from(performanceMap.values()) };
  }

  async getDepartmentAnalytics(filters: ReportFilterDto, user: any) {
    const where = this.buildApplicationWhere(filters, user);
    
    const deptStats = await this.prisma.applications.groupBy({
      by: ['department_id', 'status'],
      where,
      _count: true
    });

    const deptMap = new Map();
    deptStats.forEach(stat => {
      const deptId = stat.department_id;
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { departmentId: deptId, applications: 0, offers: 0, hired: 0 });
      }
      const data = deptMap.get(deptId);
      data.applications += stat._count;
      if (['OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.offers += stat._count;
      }
      if (stat.status === 'JOINED') {
        data.hired += stat._count;
      }
    });

    const results = Array.from(deptMap.values()).map(d => ({
       ...d,
       selectionRate: d.applications > 0 ? (d.offers / d.applications) * 100 : 0,
       hiringRate: d.applications > 0 ? (d.hired / d.applications) * 100 : 0
    }));

    return { success: true, data: results };
  }

  async getTimelineAnalytics(filters: ReportFilterDto, user: any) {
    // Average Time to Hire Calculation requires complex DB aggregation which Prisma doesn't support directly
    // Instead we query joined candidates and calculate
    const where = this.buildApplicationWhere(filters, user);
    where.status = 'JOINED';
    
    const applications = await this.prisma.applications.findMany({
      where,
      select: { created_at: true, updated_at: true },
      take: 1000 // Sample size for performance
    });

    let totalDays = 0;
    applications.forEach(app => {
       const ms = app.updated_at.getTime() - app.created_at.getTime();
       totalDays += ms / (1000 * 60 * 60 * 24);
    });

    const averageTimeToHire = applications.length > 0 ? totalDays / applications.length : 0;

    return { success: true, data: { averageTimeToHire, sampleSize: applications.length } };
  }

  async getOpportunityAnalytics(filters: ReportFilterDto, user: any) {
    const where = this.buildApplicationWhere(filters, user);
    
    const oppStats = await this.prisma.applications.groupBy({
      by: ['hiring_opportunity_id', 'status'],
      where: { ...where, hiring_opportunity_id: { not: null } },
      _count: true
    });

    const oppMap = new Map();
    oppStats.forEach(stat => {
      const oppId = stat.hiring_opportunity_id;
      if (!oppMap.has(oppId)) {
        oppMap.set(oppId, { opportunityId: oppId, applications: 0, interviews: 0, selected: 0, offers: 0, joined: 0 });
      }
      const data = oppMap.get(oppId);
      data.applications += stat._count;
      if (['INTERVIEWED', 'SHORTLISTED', 'SELECTED', 'OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.interviews += stat._count;
      }
      if (['SELECTED', 'OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.selected += stat._count;
      }
      if (['OFFER_RELEASED', 'JOINED'].includes(stat.status)) {
        data.offers += stat._count;
      }
      if (stat.status === 'JOINED') {
        data.joined += stat._count;
      }
    });

    const results = Array.from(oppMap.values()).map(o => ({
       ...o,
       interviewRate: o.applications > 0 ? (o.interviews / o.applications) * 100 : 0,
       selectionRate: o.interviews > 0 ? (o.selected / o.interviews) * 100 : 0,
       offerRate: o.selected > 0 ? (o.offers / o.selected) * 100 : 0,
       joinRate: o.offers > 0 ? (o.joined / o.offers) * 100 : 0
    }));

    return { success: true, data: results };
  }

  async getInterviewAnalytics(filters: ReportFilterDto, user: any) {
    const where = this.buildInterviewWhere(filters, user);

    const today = new Date();
    
    // In CareerX workflow, slot_date and is_booked give us basic stats. 
    // Future stats (missed, cancelled) would require adding fields to interview_slots.
    const [upcoming, completed, unbooked] = await Promise.all([
      this.prisma.interview_slots.count({
        where: { ...where, is_booked: true, slot_date: { gte: today } }
      }),
      this.prisma.interview_slots.count({
        where: { ...where, is_booked: true, slot_date: { lt: today } }
      }),
      this.prisma.interview_slots.count({
        where: { ...where, is_booked: false }
      })
    ]);

    // To calculate interview success rate, we look at applications that passed the interview stage.
    // For a real metric, we'd cross-reference slot_assignments with application status.
    const appWhere = this.buildApplicationWhere(filters, user);
    const passedInterviews = await this.prisma.applications.count({
       where: { ...appWhere, status: { in: ['SHORTLISTED', 'SELECTED', 'OFFER_RELEASED', 'JOINED'] } }
    });

    return {
      success: true,
      data: {
        upcomingInterviews: upcoming,
        completedInterviews: completed,
        unbookedSlots: unbooked,
        passedInterviews,
        interviewSuccessRate: completed > 0 ? (passedInterviews / completed) * 100 : 0
      }
    };
  }
}

