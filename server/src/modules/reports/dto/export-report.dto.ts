import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportFilterDto } from './report-filter.dto';

export enum ExportFormat {
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  PDF = 'PDF'
}

export class ExportReportDto extends ReportFilterDto {
  @IsNotEmpty()
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsNotEmpty()
  @IsEnum(['APPLICATIONS', 'INTERVIEWS'])
  report_type!: 'APPLICATIONS' | 'INTERVIEWS';
}
