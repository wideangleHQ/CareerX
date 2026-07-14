import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { application_status_enum } from '@prisma/client';

@Injectable()
export class ApplicationCleanupCron {
  private readonly logger = new Logger(ApplicationCleanupCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Starting application cleanup...');
    try {
      const retentionDays = parseInt(process.env.APP_RETENTION_DAYS || '90', 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await this.prisma.applications.updateMany({
        where: {
          OR: [
            { status: application_status_enum.WITHDRAWN },
            { 
              status: application_status_enum.REJECTED,
              updated_at: { lt: cutoffDate }
            }
          ],
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        }
      });

      this.logger.log(`Cleaned up ${result.count} old applications.`);
    } catch (error) {
      this.logger.error('Failed to cleanup applications', error instanceof Error ? error.stack : String(error));
    }
  }
}
