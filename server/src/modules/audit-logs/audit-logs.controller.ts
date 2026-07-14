import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { permission_enum } from '@prisma/client';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';

@Controller('audit-logs')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions(permission_enum.CAREER_ADMIN)
  async getAuditLogs(@Query() filters: AuditFilterDto) {
    return this.auditLogsService.getAuditLogs(filters);
  }

  @Get(':id')
  @Permissions(permission_enum.CAREER_ADMIN)
  async getAuditLogById(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.getAuditLogById(id);
  }
}
