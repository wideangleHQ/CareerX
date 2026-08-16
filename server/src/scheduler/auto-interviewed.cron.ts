import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerHealthService } from './scheduler-health.service';

@Injectable()
export class AutoInterviewedCron {
  private readonly logger = new Logger(AutoInterviewedCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerHealth: SchedulerHealthService,
  ) {}

  @Cron('*/15 * * * *')
  async handleCron() {
    this.logger.log('Checking for interviews completed ≥30 min ago...');
    let success = true;

    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

      const candidates = await this.prisma.slot_assignments.findMany({
        where: {
          application: {
            status: 'ACCEPTED',
            deleted_at: null,
          },
          slot: {
            is_booked: true,
            slot_date: { lte: thirtyMinAgo },
          },
        },
        select: {
          application_id: true,
          slot: { select: { slot_date: true, slot_time: true } },
        },
        take: 200,
      });

      const eligible = candidates.filter((c) => {
        const d = c.slot.slot_date;
        const t = c.slot.slot_time;
        const interviewEnd = new Date(
          d.getFullYear(), d.getMonth(), d.getDate(),
          t.getUTCHours(), t.getUTCMinutes(),
        );
        return interviewEnd.getTime() <= thirtyMinAgo.getTime();
      });

      if (eligible.length === 0) {
        this.logger.log('No interviews eligible for auto-INTERVIEWED transition.');
        return;
      }

      let transitioned = 0;
      for (const item of eligible) {
        await this.prisma.$transaction([
          this.prisma.applications.update({
            where: { id: item.application_id },
            data: {
              status: 'INTERVIEWED',
              updated_at: new Date(),
            },
          }),
          this.prisma.status_history.create({
            data: {
              application_id: item.application_id,
              from_status: 'ACCEPTED',
              to_status: 'INTERVIEWED',
              reason: 'Auto-transitioned: interview time passed',
            },
          }),
        ]);
        transitioned++;
      }

      this.logger.log(`Auto-transitioned ${transitioned} applications to INTERVIEWED.`);
    } catch (error) {
      success = false;
      this.logger.error(
        'Auto-INTERVIEWED cron failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.schedulerHealth.recordJobExecution('AutoInterviewedCron', success);
    }
  }
}
