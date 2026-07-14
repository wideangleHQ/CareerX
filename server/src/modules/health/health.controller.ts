import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Public health endpoint - basic status only
  @Get()
  async getBasicHealth(@Res() res: Response) {
    const isAlive = await this.healthService.isAlive();
    const status = isAlive ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    
    return res.status(status).json({
      status: isAlive ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
    });
  }

  // Kubernetes readiness probe
  @Get('ready')
  async getReadiness(@Res() res: Response) {
    const isReady = await this.healthService.isReady();
    const status = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    
    return res.status(status).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
    });
  }

  // Kubernetes liveness probe
  @Get('live')
  async getLiveness(@Res() res: Response) {
    const isAlive = await this.healthService.isAlive();
    const status = isAlive ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    
    return res.status(status).json({
      alive: isAlive,
      timestamp: new Date().toISOString(),
    });
  }

  // Detailed health check - requires admin permission
  @Get('detailed')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async getDetailedHealth(@Res() res: Response) {
    const health = await this.healthService.getSystemHealth();
    
    const statusCode = health.status === 'HEALTHY' ? HttpStatus.OK
      : health.status === 'DEGRADED' ? HttpStatus.OK
      : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(health);
  }
}
