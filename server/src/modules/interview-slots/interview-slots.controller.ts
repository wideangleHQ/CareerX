import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { parseBookSlotDto } from './dto/book-slot.dto';
import { parseBulkGenerateSlotsDto } from './dto/bulk-generate-slots.dto';
import { parseCreateSlotDto } from './dto/create-slot.dto';
import { parseQuerySlotsDto } from './dto/query-slots.dto';
import { InterviewSlotsService } from './interview-slots.service';
import type {
  BulkGenerateSlotsResponse,
  SlotListResponse,
  SlotResponse,
} from './interview-slots.service';

@Controller('api/v1/interview-slots')
export class InterviewSlotsController {
  constructor(private readonly interviewSlotsService: InterviewSlotsService) {}

  @Post()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_INTERVIEW')
  create(@Body() body: unknown): Promise<SlotResponse> {
    return this.interviewSlotsService.create(parseCreateSlotDto(body));
  }

  @Post('bulk')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_INTERVIEW')
  bulkGenerate(@Body() body: unknown): Promise<BulkGenerateSlotsResponse> {
    return this.interviewSlotsService.bulkGenerate(parseBulkGenerateSlotsDto(body));
  }

  @Get()
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_VIEW')
  findAll(@Query() query: Record<string, unknown>): Promise<SlotListResponse> {
    return this.interviewSlotsService.findAll(parseQuerySlotsDto(query));
  }

  @Get('available')
  findAvailable(@Query() query: Record<string, unknown>): Promise<SlotListResponse> {
    return this.interviewSlotsService.findAvailable(parseQuerySlotsDto(query, true));
  }

  @Post('book')
  book(@Body() body: unknown): Promise<{ success: true; data: Record<string, any> }> {
    return this.interviewSlotsService.book(parseBookSlotDto(body));
  }

  @Delete(':id')
  @UseGuards(CareerJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CAREER_ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ success: true }> {
    return this.interviewSlotsService.remove(id);
  }
}
