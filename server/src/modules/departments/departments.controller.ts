import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DepartmentsService } from './departments.service';
import type {
  DepartmentListItem,
  DepartmentSyncSummary,
  HiringDepartmentItem,
} from './departments.service';
import { parseToggleHiringDto } from './dto/toggle-hiring.dto';

@Controller('api/v1/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get('hiring')
  getHiringDepartments(@Query() query: any): Promise<HiringDepartmentItem[]> {
    return this.departmentsService.getHiringDepartments(query);
  }

  @Get()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @Permissions('CAREER_VIEW')
  getAllDepartments(): Promise<DepartmentListItem[]> {
    return this.departmentsService.getAllDepartments();
  }

  @Patch(':id/hiring')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @Permissions('CAREER_ADMIN')
  toggleHiring(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ): Promise<DepartmentListItem> {
    const dto = parseToggleHiringDto(body);
    return this.departmentsService.toggleHiring(id, dto);
  }

  @Post('sync')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @Permissions('CAREER_ADMIN')
  syncFromPerformx(): Promise<DepartmentSyncSummary> {
    return this.departmentsService.syncFromPerformx();
  }
}
