import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Processor('reports', { concurrency: 2 })
export class ReportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing report job ${job.id}`);
    const { reportType, format, filters, userId } = job.data;

    try {
      const fileName = `report_${job.id}_${Date.now()}.${format === 'EXCEL' ? 'xlsx' : 'csv'}`;
      const tempPath = path.join(process.cwd(), 'temp', fileName);
      
      if (!fs.existsSync(path.dirname(tempPath))) {
        fs.mkdirSync(path.dirname(tempPath), { recursive: true });
      }

      const repository = new (require('../../modules/reports/reports.repository').ReportsRepository)(this.prisma);
      
      let data: any[] = [];
      const user = userId ? { sub: userId, permissions: [] } : undefined; // In a real scenario we'd pass full user context
      
      if (reportType === 'APPLICATIONS') {
        const raw = await repository.getAllApplicationsForExport(filters || {});
        data = raw.map((r: any) => ({
          'Application Code': r.application_code,
          'Candidate Name': r.candidate?.full_name,
          'Candidate Email': r.candidate?.email,
          'Candidate Phone': r.candidate?.mobile_number,
          'Department': r.department?.name,
          'Status': r.status,
          'Assigned HR': r.assigned_hr?.full_name || 'Unassigned',
          'Applied Date': r.created_at.toISOString(),
        }));
      } else if (reportType === 'INTERVIEWS') {
        const raw = await repository.getAllInterviewsForExport(filters || {});
        data = raw.map((r: any) => ({
          'Date': r.slot_date.toISOString().split('T')[0],
          'Time': r.slot_time.toISOString().split('T')[1],
          'HR Name': r.hr?.full_name,
          'Department': r.department?.name || 'Any',
          'Booked': r.is_booked ? 'Yes' : 'No',
          'Candidate Name': r.slot_assignment?.application?.candidate?.full_name || 'N/A'
        }));
      } else {
        // Prepare Extensibility for HR Performance, etc.
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      if (data.length > 0) {
        worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key }));
        worksheet.addRows(data);
      } else {
        worksheet.addRow(['No data found matching the filters']);
      }

      if (format === 'EXCEL') {
        await workbook.xlsx.writeFile(tempPath);
      } else {
        await workbook.csv.writeFile(tempPath);
      }

      this.logger.log(`Report generated successfully at ${tempPath}`);
      
      return { success: true, url: `/downloads/${fileName}` };
    } catch (error) {
      this.logger.error(`Failed to generate report job ${job.id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
