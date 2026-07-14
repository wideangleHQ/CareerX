import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ExportReportDto } from './dto/export-report.dto';
import type { Response } from 'express';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { permission_enum } from '@prisma/client';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
@Controller('reports')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('applications')
  @Permissions(permission_enum.CAREER_REPORTS)
  async getApplications(@Query() filters: ReportFilterDto) {
    return this.reportsService.getApplicationsReport(filters);
  }

  @Get('interviews')
  @Permissions(permission_enum.CAREER_REPORTS)
  async getInterviews(@Query() filters: ReportFilterDto) {
    return this.reportsService.getInterviewsReport(filters);
  }

  @Post('export')
  @Permissions(permission_enum.CAREER_REPORTS)
  async exportReport(@Body() dto: ExportReportDto, @Res() res: Response, @CurrentUser() user: CareerJwtPayload) {
    await this.reportsService.exportReport(dto, res, user);
  }

  @Get('dashboard-metrics')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getDashboardMetrics(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getDashboardMetrics(filters, user);
  }

  @Get('hiring-funnel')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getHiringFunnel(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getHiringFunnel(filters, user);
  }

  @Get('hr-performance')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getHrPerformance(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getHrPerformance(filters, user);
  }

  @Get('department-analytics')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getDepartmentAnalytics(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getDepartmentAnalytics(filters, user);
  }

  @Get('timeline-analytics')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getTimelineAnalytics(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getTimelineAnalytics(filters, user);
  }

  @Get('opportunity-analytics')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getOpportunityAnalytics(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getOpportunityAnalytics(filters, user);
  }

  @Get('interview-analytics')
  @Permissions(permission_enum.CAREER_REPORTS, permission_enum.CAREER_ADMIN)
  async getInterviewAnalytics(@Query() filters: ReportFilterDto, @CurrentUser() user: CareerJwtPayload) {
    return this.reportsService.getInterviewAnalytics(filters, user);
  }
}
