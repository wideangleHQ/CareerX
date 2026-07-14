import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import type { CreateNoteDto } from './dto/create-note.dto';
import type { NoteFilterDto } from './dto/note-filter.dto';
import type { UpdateNoteDto } from './dto/update-note.dto';
import { HrNotesRepository } from './hr-notes.repository';
import type { HrNoteRecord } from './hr-notes.repository';

export interface HrNoteDto {
  id: string;
  applicationId: string;
  hr: {
    id: string;
    fullName: string;
    email: string;
  };
  note: string;
  createdAt: Date;
}

export interface HrNoteListResponseDto {
  success: true;
  data: HrNoteDto[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

@Injectable()
export class HrNotesService {
  constructor(
    private readonly hrNotesRepository: HrNotesRepository,
    private readonly events: EventEmitter,
  ) {}

  async create(dto: CreateNoteDto, actorId: string | null): Promise<HrNoteDto> {
    if (!actorId) throw new ForbiddenException('Forbidden');

    try {
      const note = await this.hrNotesRepository.transaction(async (tx) => {
        const [application, hr] = await Promise.all([
          this.hrNotesRepository.findApplication(dto.applicationId, tx),
          this.hrNotesRepository.findActiveHr(actorId, tx),
        ]);
        if (!application) throw new NotFoundException('Application not found');
        if (!hr) throw new ForbiddenException('Forbidden');

        return this.hrNotesRepository.create(dto.applicationId, actorId, dto.note, tx);
      });

      this.events.emit('HRNoteCreated', {
        id: note.id,
        applicationId: note.application_id,
        hrId: note.hr_id,
        createdAt: note.created_at,
      });

      return this.toDto(note);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findByApplication(
    applicationId: string,
    query: NoteFilterDto,
  ): Promise<HrNoteListResponseDto> {
    try {
      const application = await this.hrNotesRepository.findApplication(applicationId);
      if (!application) throw new NotFoundException('Application not found');

      const rows = await this.hrNotesRepository.findByApplication(
        applicationId,
        query.limit,
        query.cursor,
      );
      const hasMore = rows.length > query.limit;
      const data = rows.slice(0, query.limit).map((note) => this.toDto(note));

      return {
        success: true,
        data,
        pagination: {
          limit: query.limit,
          nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
          hasMore,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async update(id: string, dto: UpdateNoteDto, user: CareerJwtPayload | undefined): Promise<HrNoteDto> {
    if (!user?.sub) throw new ForbiddenException('Forbidden');

    try {
      return await this.hrNotesRepository.transaction(async (tx) => {
        const [existing, hr] = await Promise.all([
          this.hrNotesRepository.findById(id, tx),
          this.hrNotesRepository.findActiveHr(user.sub, tx),
        ]);
        if (!existing) throw new NotFoundException('Note not found');
        if (!hr) throw new ForbiddenException('Forbidden');

        const isCreator = existing.hr_id === user.sub;
        const isAdmin = user.permissions.includes('CAREER_ADMIN');
        if (!isCreator && !isAdmin) throw new ForbiddenException('Forbidden');

        const updated = await this.hrNotesRepository.update(id, dto.note, tx);
        await this.hrNotesRepository.createAuditLog(user.sub, id, existing.note, updated.note, tx);
        return this.toDto(updated);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async remove(id: string, user: CareerJwtPayload | undefined): Promise<never> {
    if (!user?.sub) throw new ForbiddenException('Forbidden');

    try {
      const [existing, hr] = await Promise.all([
        this.hrNotesRepository.findById(id),
        this.hrNotesRepository.findActiveHr(user.sub),
      ]);
      if (!existing) throw new NotFoundException('Note not found');
      if (!hr) throw new ForbiddenException('Forbidden');
      throw new BadRequestException('Deletion disabled');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private toDto(note: HrNoteRecord): HrNoteDto {
    return {
      id: note.id,
      applicationId: note.application_id,
      hr: {
        id: note.hr.id,
        fullName: note.hr.full_name,
        email: note.hr.email,
      },
      note: note.note,
      createdAt: note.created_at,
    };
  }
}
