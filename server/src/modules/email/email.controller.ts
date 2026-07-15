import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { parseSendEmailDto } from './dto/send-email.dto';
import { EmailService } from './email.service';

@Controller('email')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @RequirePermissions('CAREER_ADMIN')
  send(@Body() body: unknown): Promise<{ success: true; queued: number }> {
    return this.emailService.queueEmail(parseSendEmailDto(body));
  }

  @Get('logs')
  @RequirePermissions('CAREER_VIEW')
  logs(@Query() query: Record<string, unknown>) {
    return this.emailService.getLogs(query);
  }

  @Get('queue/stats')
  @RequirePermissions('CAREER_ADMIN')
  async queueStats() {
    return this.emailService.getQueueStats();
  }

  @Get('queue/failed')
  @RequirePermissions('CAREER_ADMIN') 
  async failedJobs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.emailService.getFailedJobs(parsedLimit);
  }
}
