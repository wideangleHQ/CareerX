import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { parseFileFilterDto } from './dto/file-filter.dto';
import { FilesService } from './files.service';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import type { CandidateFileListResponseDto, SignedUrlResponseDto } from './files.service';

@Controller('files')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // Metadata only — no storage paths, no URLs. Mirrors the hr-notes
  // application-scoped read and its CAREER_VIEW gate.
  @Get('application/:applicationId')
  @RequirePermissions('CAREER_VIEW')
  findByApplication(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: CareerJwtPayload,
  ): Promise<CandidateFileListResponseDto> {
    return this.filesService.findByApplication(applicationId, parseFileFilterDto(query), user);
  }

  // Mints a short-lived signed URL for one file, only when the user acts on it.
  @Get(':id/download-url')
  @RequirePermissions('CAREER_VIEW')
  createDownloadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload,
  ): Promise<SignedUrlResponseDto> {
    return this.filesService.createDownloadUrl(id, user);
  }
}
