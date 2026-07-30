import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

// StorageModule is @Global() but was never imported anywhere, so it was never
// instantiated. Importing it here (its only consumer) registers
// SupabaseStorageService rather than re-providing it.
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService],
})
export class FilesModule {}
