import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { application_status_enum } from '@prisma/client';
import { Transform } from 'class-transformer';

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsEnum(application_status_enum)
  status?: application_status_enum;

  @IsOptional()
  @IsUUID()
  assigned_hr_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
  
  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';
}
