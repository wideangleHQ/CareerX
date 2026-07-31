import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CandidateListItemDto,
  CandidateListResponseDto,
  CandidateResponseDto,
} from './dto/candidate-response.dto';
import type { CreateCandidateDto } from './dto/create-candidate.dto';
import type { UpdateCandidateDto } from './dto/update-candidate.dto';

export interface CandidateQuery {
  cursor?: string;
  limit: number;
  search?: string;
  sortBy: 'createdAt' | 'fullName' | 'email';
  sortOrder: 'asc' | 'desc';
}

const candidateSelect = {
  id: true,
  full_name: true,
  email: true,
  mobile_number: true,
  whatsapp_number: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.candidatesSelect;

const candidateListSelect = {
  id: true,
  full_name: true,
  email: true,
  mobile_number: true,
  created_at: true,
} satisfies Prisma.candidatesSelect;

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCandidateDto): Promise<CandidateResponseDto> {
    try {
      const existing = await this.prisma.candidates.findFirst({
        where: {
          deleted_at: null,
          OR: [{ email: dto.email }, { mobile_number: dto.mobileNumber }],
        },
        select: candidateSelect,
      });
      if (existing) return this.toCandidateResponse(existing);

      const candidate = await this.prisma.candidates.create({
        data: {
          full_name: dto.fullName,
          email: dto.email,
          mobile_number: dto.mobileNumber,
          whatsapp_number: dto.whatsappNumber,
        },
        select: candidateSelect,
      });
      return this.toCandidateResponse(candidate);
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAll(query: CandidateQuery): Promise<CandidateListResponseDto> {
    try {
      const where: Prisma.candidatesWhereInput = {
        deleted_at: null,
        ...(query.search
          ? {
              OR: [
                { full_name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { mobile_number: { contains: query.search } },
              ],
            }
          : {}),
      };

      const orderBy = this.getOrderBy(query);
      const rows = await this.prisma.candidates.findMany({
        where,
        select: candidateListSelect,
        orderBy,
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });

      const hasMore = rows.length > query.limit;
      const data = rows.slice(0, query.limit).map((candidate) => ({
        id: candidate.id,
        fullName: candidate.full_name,
        email: candidate.email,
        mobileNumber: candidate.mobile_number,
        createdAt: candidate.created_at,
      }));

      return {
        success: true,
        data,
        pagination: {
          limit: query.limit,
          nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
          hasMore,
        },
      };
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findOne(id: string): Promise<CandidateResponseDto> {
    const candidate = await this.findActiveCandidate(id);
    return this.toCandidateResponse(candidate);
  }

  async getActivity(candidateId: string) {
    await this.findActiveCandidate(candidateId);

    const applications = await this.prisma.applications.findMany({
      where: { candidate_id: candidateId, deleted_at: null },
      select: { id: true },
    });
    const applicationIds = applications.map((a) => a.id);
    if (applicationIds.length === 0) return [];

    const [statusHistory, notes, files, feedback] = await Promise.all([
      this.prisma.status_history.findMany({
        where: { application_id: { in: applicationIds } },
        select: {
          id: true,
          application_id: true,
          from_status: true,
          to_status: true,
          reason: true,
          created_at: true,
          changed_by: { select: { id: true, full_name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      this.prisma.hr_notes.findMany({
        where: { application_id: { in: applicationIds } },
        select: {
          id: true,
          application_id: true,
          created_at: true,
          hr: { select: { id: true, full_name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      this.prisma.candidate_files.findMany({
        where: { application_id: { in: applicationIds } },
        select: {
          id: true,
          application_id: true,
          file_type: true,
          file_name: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      this.prisma.interview_feedback.findMany({
        where: { application_id: { in: applicationIds } },
        select: {
          id: true,
          application_id: true,
          rating: true,
          created_at: true,
          hr: { select: { id: true, full_name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
    ]);

    const events: Array<{
      id: string;
      application_id: string;
      event_type: string;
      description: string;
      created_at: Date;
      hr_id: string | null;
      hr: { id: string; full_name: string } | null;
    }> = [];

    for (const sh of statusHistory) {
      events.push({
        id: sh.id,
        application_id: sh.application_id,
        event_type: 'UPDATE',
        description: sh.from_status
          ? `Status changed from ${sh.from_status} to ${sh.to_status}${sh.reason ? `: ${sh.reason}` : ''}`
          : `Application submitted (${sh.to_status})`,
        created_at: sh.created_at,
        hr_id: sh.changed_by?.id ?? null,
        hr: sh.changed_by,
      });
    }

    for (const note of notes) {
      events.push({
        id: note.id,
        application_id: note.application_id,
        event_type: 'NOTE_ADDED',
        description: 'HR note added',
        created_at: note.created_at,
        hr_id: note.hr?.id ?? null,
        hr: note.hr,
      });
    }

    for (const file of files) {
      events.push({
        id: file.id,
        application_id: file.application_id,
        event_type: 'DOWNLOAD',
        description: `${file.file_type} uploaded: ${file.file_name}`,
        created_at: file.created_at,
        hr_id: null,
        hr: null,
      });
    }

    for (const fb of feedback) {
      events.push({
        id: fb.id,
        application_id: fb.application_id,
        event_type: 'UPDATE',
        description: `Interview feedback submitted (Rating: ${fb.rating}/5)`,
        created_at: fb.created_at,
        hr_id: fb.hr?.id ?? null,
        hr: fb.hr,
      });
    }

    events.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return events.slice(0, 50);
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<CandidateResponseDto> {
    try {
      await this.findActiveCandidate(id);

      if (dto.email || dto.mobileNumber) {
        const duplicate = await this.prisma.candidates.findFirst({
          where: {
            deleted_at: null,
            id: { not: id },
            OR: [
              ...(dto.email ? [{ email: dto.email }] : []),
              ...(dto.mobileNumber ? [{ mobile_number: dto.mobileNumber }] : []),
            ],
          },
          select: { id: true },
        });
        if (duplicate) throw new ConflictException('Conflict');
      }

      const updated = await this.prisma.candidates.update({
        where: { id },
        data: {
          ...(dto.fullName !== undefined ? { full_name: dto.fullName } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.mobileNumber !== undefined ? { mobile_number: dto.mobileNumber } : {}),
          ...(dto.whatsappNumber !== undefined ? { whatsapp_number: dto.whatsappNumber } : {}),
          updated_at: new Date(),
        },
        select: candidateSelect,
      });
      return this.toCandidateResponse(updated);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async remove(id: string): Promise<CandidateResponseDto> {
    try {
      await this.findActiveCandidate(id);
      const deleted = await this.prisma.candidates.update({
        where: { id },
        data: { deleted_at: new Date(), updated_at: new Date() },
        select: candidateSelect,
      });
      return this.toCandidateResponse(deleted);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private async findActiveCandidate(id: string) {
    try {
      const candidate = await this.prisma.candidates.findFirst({
        where: { id, deleted_at: null },
        select: candidateSelect,
      });
      if (!candidate) throw new NotFoundException('Not Found');
      return candidate;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private getOrderBy(query: CandidateQuery): Prisma.candidatesOrderByWithRelationInput[] {
    const field =
      query.sortBy === 'fullName' ? 'full_name' : query.sortBy === 'createdAt' ? 'created_at' : 'email';
    return [{ [field]: query.sortOrder }, { id: 'asc' }];
  }

  private toCandidateResponse(candidate: Prisma.candidatesGetPayload<{ select: typeof candidateSelect }>): CandidateResponseDto {
    return {
      id: candidate.id,
      fullName: candidate.full_name,
      email: candidate.email,
      mobileNumber: candidate.mobile_number,
      whatsappNumber: candidate.whatsapp_number,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
    };
  }
}
