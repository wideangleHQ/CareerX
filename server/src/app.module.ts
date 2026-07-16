import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CareerEventsModule } from './common/events/career-events.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmailModule } from './modules/email/email.module';
import { HrNotesModule } from './modules/hr-notes/hr-notes.module';
import { InterviewFeedbackModule } from './modules/interview-feedback/interview-feedback.module';
import { InterviewSlotsModule } from './modules/interview-slots/interview-slots.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { WorkerModule } from './workers/worker.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthModule } from './modules/health/health.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { CorrelationMiddleware } from './common/middleware/correlation.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { QueueConfigModule } from './common/queue/queue-config.module';

@Module({
  imports: [
    QueueConfigModule,
    AuthModule,
    CareerEventsModule,
    DashboardModule,
    DepartmentsModule,
    CandidatesModule,
    ApplicationsModule,
    InterviewSlotsModule,
    EmailModule,
    HrNotesModule,
    InterviewFeedbackModule,
    NotificationsModule,
    ReportsModule,
    OpportunitiesModule,
    WorkerModule,
    SchedulerModule,
    HealthModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*');
  }
}
