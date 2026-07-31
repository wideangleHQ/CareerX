import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';
import { StorageConfig } from '../../storage/storage.config';
import type { StorageBucket } from '../../storage/storage.config';
import type { FileFilterDto } from './dto/file-filter.dto';
import type { FileRecord } from './files.repository';
import { FilesRepository } from './files.repository';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';

export interface CandidateFileDto {
  id: string;
  fileName: string;
  fileType: string;
  bucket: string;
  fileSizeKb: number | null;
  mimeType: string | null;
  createdAt: Date;
}

export interface CandidateFileListResponseDto {
  success: true;
  data: CandidateFileDto[];
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export interface SignedUrlResponseDto {
  success: true;
  data: {
    url: string;
    fileName: string;
    mimeType: string | null;
    expiresInSeconds: number;
  };
}

@Injectable()
export class FilesService {
  constructor(
    private readonly repository: FilesRepository,
    private readonly storage: SupabaseStorageService,
  ) {}

  async findByApplication(
    applicationId: string,
    filter: FileFilterDto,
    user: CareerJwtPayload,
  ): Promise<CandidateFileListResponseDto> {
    const application = await this.repository.findApplicationForCareerUser(applicationId, user);
    if (!application) throw new NotFoundException('Application not found');

    const rows = await this.repository.findByApplication(
      applicationId,
      filter.limit,
      filter.cursor,
      filter.fileType,
    );

    const hasMore = rows.length > filter.limit;
    const data = rows.slice(0, filter.limit).map((row) => this.toDto(row));

    return {
      success: true,
      data,
      pagination: {
        limit: filter.limit,
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async createDownloadUrl(fileId: string, user: CareerJwtPayload): Promise<SignedUrlResponseDto> {
    const file = await this.repository.findInternalById(fileId);
    if (!file) throw new NotFoundException('File not found');
    if (!this.canViewApplication(file.application.assigned_hr_id, file.application.department_id, user)) {
      throw new NotFoundException('File not found');
    }

    const expiry = StorageConfig.signedUrlExpiry;
    const url = await this.storage.createSignedUrl({ bucket: file.bucket as StorageBucket, path: file.storage_path, expiresInSeconds: expiry });

    return {
      success: true,
      data: {
        url,
        fileName: file.file_name,
        mimeType: file.mime_type,
        expiresInSeconds: expiry,
      },
    };
  }

  private canViewApplication(_assignedHrId: string | null, _departmentId: string, user: CareerJwtPayload): boolean {
    return user.permissions.includes('CAREER_VIEW');
  }

  private toDto(row: FileRecord): CandidateFileDto {
    return {
      id: row.id,
      fileName: row.file_name,
      fileType: row.file_type,
      bucket: row.bucket,
      fileSizeKb: row.file_size_kb,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    };
  }
}
