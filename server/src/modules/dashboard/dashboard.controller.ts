import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';

@Controller('api/v1/dashboard')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermissions('CAREER_VIEW')
  async getStats(@CurrentUser() user: CareerJwtPayload) {
    return this.dashboardService.getStats(user);
  }

  @Get('offers-stats')
  @RequirePermissions('CAREER_VIEW')
  async getOfferStats(@CurrentUser() user: CareerJwtPayload) {
    return this.dashboardService.getOfferStats(user);
  }
}
