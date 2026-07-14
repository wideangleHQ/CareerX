import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpiredSlotCron {
  private readonly logger = new Logger(ExpiredSlotCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *') // Every hour
  async handleCron() {
    this.logger.log('Starting expired slot cleanup...');
    try {
      const now = new Date();
      
      const expiredUnbooked = await this.prisma.interview_slots.deleteMany({
        where: {
          is_booked: false,
          slot_date: { lt: now },
        }
      });
      
      this.logger.log(`Deleted ${expiredUnbooked.count} unbooked expired slots.`);
    } catch (error) {
      this.logger.error('Failed to clean up expired slots', error instanceof Error ? error.stack : String(error));
    }
  }
}
