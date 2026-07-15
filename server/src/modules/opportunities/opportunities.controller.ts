import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Post()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  create(@Body() body: any) {
  return this.service.create(body);
  }

  @Get('public')
  findPublic(@Query() query: any) {
    return this.service.findPublic(query);
  }

  @Get()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Patch(':id/status')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.service.updateStatus(id, body);
  }

  @Delete(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
