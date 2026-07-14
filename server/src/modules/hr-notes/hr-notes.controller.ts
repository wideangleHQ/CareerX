import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import { parseCreateNoteDto } from './dto/create-note.dto';
import { parseNoteFilterDto } from './dto/note-filter.dto';
import { parseUpdateNoteDto } from './dto/update-note.dto';
import { HrNotesService } from './hr-notes.service';
import type { HrNoteDto, HrNoteListResponseDto } from './hr-notes.service';

interface HrNoteMutationResponseDto {
  success: true;
  message: string;
  data: HrNoteDto;
}

@Controller('api/v1/hr-notes')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class HrNotesController {
  constructor(private readonly hrNotesService: HrNotesService) {}

  @Post()
  @RequirePermissions('CAREER_EDIT')
  async create(
    @Body() body: unknown,
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<HrNoteMutationResponseDto> {
    const data = await this.hrNotesService.create(parseCreateNoteDto(body), user?.sub ?? null);
    return { success: true, message: 'HR note created', data };
  }

  @Get('application/:applicationId')
  @RequirePermissions('CAREER_VIEW')
  findByApplication(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Query() query: Record<string, unknown>,
  ): Promise<HrNoteListResponseDto> {
    return this.hrNotesService.findByApplication(applicationId, parseNoteFilterDto(query));
  }

  @Patch(':id')
  @RequirePermissions('CAREER_EDIT')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<HrNoteMutationResponseDto> {
    const data = await this.hrNotesService.update(id, parseUpdateNoteDto(body), user);
    return { success: true, message: 'HR note updated', data };
  }

  @Delete(':id')
  @RequirePermissions('CAREER_ADMIN')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<never> {
    return this.hrNotesService.remove(id, user);
  }
}
