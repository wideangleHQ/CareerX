import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ExportReportDto, ExportFormat } from './dto/export-report.dto';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReportsService {
  constructor(
    private repository: ReportsRepository,
    @InjectQueue('reports') private reportQueue: Queue
  ) {}

  async getApplicationsReport(filters: ReportFilterDto) {
    return this.repository.getApplications(filters);
  }

  async getInterviewsReport(filters: ReportFilterDto) {
    return this.repository.getInterviews(filters);
  }

  async exportReport(dto: ExportReportDto, res: Response, user: any) {
     const ASYNC_THRESHOLD = 1000;
     let total = 0;
     
     if (dto.report_type === 'APPLICATIONS') {
       total = (await this.repository.getApplications(dto as any)).total;
     } else {
       total = (await this.repository.getInterviews(dto as any)).total;
     }

     if (total > ASYNC_THRESHOLD) {
       const job = await this.reportQueue.add('export', {
         reportType: dto.report_type,
         format: dto.format,
         filters: dto,
         userId: user?.sub
       });
       return res.status(202).json({ 
         success: true, 
         message: 'Export exceeds threshold and is processing asynchronously.', 
         jobId: job.id 
       });
     }

     let data: any[];
     if (dto.report_type === 'APPLICATIONS') {
       const raw = await this.repository.getAllApplicationsForExport(dto);
       data = raw.map(r => ({
         'Application Code': r.application_code,
         'Candidate Name': r.candidate?.full_name,
         'Candidate Email': r.candidate?.email,
         'Candidate Phone': r.candidate?.mobile_number,
         'Department': r.department?.name,
         'Status': r.status,
         'Assigned HR': r.assigned_hr?.full_name || 'Unassigned',
         'Applied Date': r.created_at.toISOString(),
       }));
     } else {
       const raw = await this.repository.getAllInterviewsForExport(dto);
       data = raw.map(r => ({
         'Date': r.slot_date.toISOString().split('T')[0],
         'Time': r.slot_time.toISOString().split('T')[1],
         'HR Name': r.hr?.full_name,
         'Department': r.department?.name || 'Any',
         'Booked': r.is_booked ? 'Yes' : 'No',
         'Candidate Name': r.slot_assignment?.application?.candidate?.full_name || 'N/A'
       }));
     }

     if (dto.format === ExportFormat.EXCEL) {
       return this.generateExcel(data, res, `${dto.report_type}_Report`);
     } else if (dto.format === ExportFormat.CSV) {
       return this.generateCsv(data, res, `${dto.report_type}_Report`);
     } else {
       throw new InternalServerErrorException('PDF format not yet supported');
     }
  }

  private async generateExcel(data: any[], res: Response, fileName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key }));
      worksheet.addRows(data);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  }

  private async generateCsv(data: any[], res: Response, fileName: string) {
     const workbook = new ExcelJS.Workbook();
     const worksheet = workbook.addWorksheet('Report');

     if (data.length > 0) {
       worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key }));
       worksheet.addRows(data);
     }

     res.setHeader('Content-Type', 'text/csv');
     res.setHeader('Content-Disposition', `attachment; filename=${fileName}_${Date.now()}.csv`);

     await workbook.csv.write(res);
     res.end();
  }

  async getDashboardMetrics(filters: ReportFilterDto, user: any) {
    return this.repository.getDashboardMetrics(filters, user);
  }

  async getHiringFunnel(filters: ReportFilterDto, user: any) {
    return this.repository.getHiringFunnel(filters, user);
  }

  async getHrPerformance(filters: ReportFilterDto, user: any) {
    return this.repository.getHrPerformance(filters, user);
  }

  async getDepartmentAnalytics(filters: ReportFilterDto, user: any) {
    return this.repository.getDepartmentAnalytics(filters, user);
  }

  async getTimelineAnalytics(filters: ReportFilterDto, user: any) {
    return this.repository.getTimelineAnalytics(filters, user);
  }

  async getOpportunityAnalytics(filters: ReportFilterDto, user: any) {
    return this.repository.getOpportunityAnalytics(filters, user);
  }

  async getInterviewAnalytics(filters: ReportFilterDto, user: any) {
    return this.repository.getInterviewAnalytics(filters, user);
  }
}
