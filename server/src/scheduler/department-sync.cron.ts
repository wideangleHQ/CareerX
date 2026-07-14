import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DepartmentSyncService } from '../integrations/performx/department-sync.service';

@Injectable()
export class DepartmentSyncCron {
  private readonly logger = new Logger(DepartmentSyncCron.name);

  constructor(private readonly departmentSync: DepartmentSyncService) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async handleCron() {
    this.logger.log('Department Sync Started');
    try {
      const result = await this.departmentSync.refreshCache();
      this.logger.log(`Department Sync Success: ${result.synced} departments refreshed`);
    } catch (error) {
      this.logger.error(
        'Department Sync Failed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
