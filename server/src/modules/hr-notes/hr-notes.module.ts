import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { HrNotesController } from './hr-notes.controller';
import { HrNotesRepository } from './hr-notes.repository';
import { HrNotesService } from './hr-notes.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [HrNotesController],
  providers: [HrNotesRepository, HrNotesService],
  exports: [HrNotesService],
})
export class HrNotesModule {}
