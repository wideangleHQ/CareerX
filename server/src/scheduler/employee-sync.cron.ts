import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeSyncService } from '../integrations/performx/employee-sync.service';

@Injectable()
export class EmployeeSyncCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmployeeSyncCron.name);

  constructor(private readonly employeeSync: EmployeeSyncService) {}

  async onApplicationBootstrap() {
    this.logger.log('Running startup employee sync...');
    try {
      const result = await this.employeeSync.refreshAndUpsert();
      this.logger.log(`Startup Employee Sync Success: ${result.synced} employees`);
    } catch (error) {
      this.logger.error(
        'Startup Employee Sync Failed (non-fatal)',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Cron('0 */6 * * *')
  async handleCron() {
    this.logger.log('Employee Sync Started');
    try {
      const result = await this.employeeSync.refreshAndUpsert();
      this.logger.log(`Employee Sync Success: ${result.synced} employees refreshed`);
    } catch (error) {
      this.logger.error(
        'Employee Sync Failed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
