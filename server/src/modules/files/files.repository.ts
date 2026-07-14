import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { FileType } from './dto/upload-file.dto';

export const fileSelect = {
  id: true,
  application_id: true,
  file_type: true,
  file_name: true,
  file_size_kb: true,
  mime_type: true,
  created_at: true,
} satisfies Prisma.candidate_filesSelect;

const fileInternalSelect = {
  ...fileSelect,
  storage_path: true,
  application: {
    select: { candidate_id: true },
  },
} satisfies Prisma.candidate_filesSelect;

export type FileRecord = Prisma.candidate_filesGetPayload<{ select: typeof fileSelect }>;
export type FileInternalRecord = Prisma.candidate_filesGetPayload<{
  select: typeof fileInternalSelect;
}>;

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findApplicationForCandidate(applicationId: string, candidateId: string) {
    return this.prisma.applications.findFirst({
      where: { id: applicationId, candidate_id: candidateId, deleted_at: null },
      select: { id: true, candidate_id: true },
    });
  }

  findApplication(applicationId: string) {
    return this.prisma.applications.findFirst({
      where: { id: applicationId, deleted_at: null },
      select: { id: true },
    });
  }

  createMetadata(data: {
    applicationId: string;
    fileType: FileType;
    fileName: string;
    storagePath: string;
    fileSizeKb: number;
    mimeType: string;
  }) {
    return this.prisma.candidate_files.create({
      data: {
        application_id: data.applicationId,
        file_type: data.fileType as never,
        file_name: data.fileName,
        storage_path: data.storagePath,
        file_size_kb: data.fileSizeKb,
        mime_type: data.mimeType,
      },
      select: fileSelect,
    });
  }

  findByApplication(applicationId: string, limit: number, cursor?: string, fileType?: FileType) {
    return this.prisma.candidate_files.findMany({
      where: {
        application_id: applicationId,
        ...(fileType ? { file_type: fileType as never } : {}),
      },
      select: fileSelect,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  findInternalById(id: string) {
    return this.prisma.candidate_files.findUnique({
      where: { id },
      select: fileInternalSelect,
    });
  }

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }
}
