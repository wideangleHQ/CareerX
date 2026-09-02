import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeSyncService } from '../integrations/performx/employee-sync.service';

@Injectable()
export class EmployeeSyncCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmployeeSyncCron.name);
  private isSyncing = false;

  constructor(private readonly employeeSync: EmployeeSyncService) {}

  async onApplicationBootstrap() {
    if (this.isSyncing) {
      this.logger.warn('Startup sync skipped — a sync is already in progress');
      return;
    }
    this.isSyncing = true;
    this.logger.log('Running startup employee sync...');
    try {
      const result = await this.employeeSync.refreshAndUpsert();
      this.logger.log(`Startup Employee Sync Success: ${result.synced} employees`);
    } catch (error) {
      this.logger.error(
        'Startup Employee Sync Failed (non-fatal)',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      this.isSyncing = false;
    }
  }

  @Cron('0 */6 * * *')
  async handleCron() {
    if (this.isSyncing) {
      this.logger.warn('Scheduled sync skipped — a sync is already in progress');
      return;
    }
    this.isSyncing = true;
    this.logger.log('Employee Sync Started');
    try {
      const result = await this.employeeSync.refreshAndUpsert();
      this.logger.log(`Employee Sync Success: ${result.synced} employees refreshed`);
    } catch (error) {
      this.logger.error(
        'Employee Sync Failed',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      this.isSyncing = false;
    }
  }
}
