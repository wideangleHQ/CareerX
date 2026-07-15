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
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type {
  CandidateListResponseDto,
  CandidateMutationResponseDto,
} from './dto/candidate-response.dto';
import { parseCreateCandidateDto } from './dto/create-candidate.dto';
import { parseUpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidatesService } from './candidates.service';
import { parseCandidateQuery } from './dto/search-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  async create(@Body() body: unknown): Promise<CandidateMutationResponseDto> {
    const data = await this.candidatesService.create(parseCreateCandidateDto(body));
    return { success: true, message: 'Candidate saved', data };
  }

  @Get()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  findAll(@Query() query: Record<string, unknown>): Promise<CandidateListResponseDto> {
    return this.candidatesService.findAll(parseCandidateQuery(query));
  }

  @Get(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CandidateMutationResponseDto> {
    const data = await this.candidatesService.findOne(id);
    return { success: true, message: 'Candidate fetched', data };
  }

  @Patch(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_EDIT')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ): Promise<CandidateMutationResponseDto> {
    const data = await this.candidatesService.update(id, parseUpdateCandidateDto(body));
    return { success: true, message: 'Candidate updated', data };
  }

  @Delete(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CandidateMutationResponseDto> {
    const data = await this.candidatesService.remove(id);
    return { success: true, message: 'Candidate deleted', data };
  }
}
