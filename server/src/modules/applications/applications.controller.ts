import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import { ApplicationsService } from './applications.service';
import type { ApplicationUploadFile } from './applications.service';
import type {
  ApplicationListResponseDto,
  ApplicationMutationResponseDto,
} from './dto/application-response.dto';
import { parseAssignHrDto } from './dto/assign-hr.dto';
import { parseCreateApplicationDto } from './dto/create-application.dto';
import { parseQueryApplicationsDto } from './dto/query-applications.dto';
import { parseUpdateStatusDto } from './dto/update-status.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'resume', maxCount: 1 },
    { name: 'previousOrgProof', maxCount: 1 },
  ]))
  async create(
    @Body() body: unknown,
    @UploadedFiles() files?: {
      resume?: ApplicationUploadFile[];
      previousOrgProof?: ApplicationUploadFile[];
    },
  ): Promise<ApplicationMutationResponseDto> {
    const uploadFiles = {
      ...(files?.resume?.[0] ? { resume: files.resume[0] } : {}),
      ...(files?.previousOrgProof?.[0] ? { previousOrgProof: files.previousOrgProof[0] } : {}),
    };
    const data = await this.applicationsService.create(parseCreateApplicationDto(body), uploadFiles);
    return { success: true, message: 'Application created', data };
  }

  @Get()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  findAll(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: CareerJwtPayload
  ): Promise<ApplicationListResponseDto> {
    return this.applicationsService.findAll(parseQueryApplicationsDto(query), user);
  }

  @Post('bulk/status')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  async bulkUpdateStatus(
    @Body() body: { applicationIds: string[], status: string, reason?: string },
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.bulkUpdateStatus(body.applicationIds, body.status, body.reason, user);
    return { success: true, message: 'Bulk status update completed', data };
  }

  @Post('bulk/assign')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async bulkAssignHr(
    @Body() body: { applicationIds: string[], hrId: string },
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.bulkAssignHr(body.applicationIds, body.hrId, user);
    return { success: true, message: 'Bulk HR assignment completed', data };
  }

  @Post('bulk/archive')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async bulkArchive(
    @Body() body: { applicationIds: string[] },
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.bulkArchive(body.applicationIds, user);
    return { success: true, message: 'Bulk archive completed', data };
  }

  @Get(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload
  ): Promise<ApplicationMutationResponseDto> {
    const data = await this.applicationsService.findOne(id, user);
    return { success: true, message: 'Application fetched', data };
  }

  @Get(':id/timeline')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  async getTimeline(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload,
    @Query() query: Record<string, string>
  ) {
    const data = await this.applicationsService.getTimeline(id, user, query);
    return { success: true, message: 'Timeline fetched', data };
  }

  @Patch(':id/status')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: CareerJwtPayload,
  ): Promise<ApplicationMutationResponseDto> {
    const data = await this.applicationsService.updateStatus(
      id,
      parseUpdateStatusDto(body),
      user,
    );
    return { success: true, message: 'Application status updated', data };
  }

  @Patch(':id/assign')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async assignHr(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ): Promise<ApplicationMutationResponseDto> {
    const data = await this.applicationsService.assignHr(id, parseAssignHrDto(body));
    return { success: true, message: 'Application assigned', data };
  }

  @Delete(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ApplicationMutationResponseDto> {
    const data = await this.applicationsService.remove(id);
    return { success: true, message: 'Application deleted', data };
  }

  @Get(':id/offer')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  async getOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.getOffer(id, user);
    return { success: true, data };
  }

  @Post(':id/offer')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  async generateOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: Record<string, any>,
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.generateOffer(id, body, user);
    return { success: true, message: 'Offer generated successfully', data };
  }

  @Patch(':id/offer/status')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  async updateOfferStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('status') status: string,
    @CurrentUser() user: CareerJwtPayload
  ) {
    const data = await this.applicationsService.updateOfferStatus(id, status, user);
    return { success: true, message: 'Offer status updated successfully', data };
  }
}
