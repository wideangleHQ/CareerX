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
import { parseCreateFeedbackDto } from './dto/create-feedback.dto';
import { parseFeedbackFilterDto } from './dto/feedback-filter.dto';
import { parseUpdateFeedbackDto } from './dto/update-feedback.dto';
import { InterviewFeedbackService } from './interview-feedback.service';

@Controller('api/v1/interview-feedback')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class InterviewFeedbackController {
  constructor(private readonly interviewFeedbackService: InterviewFeedbackService) {}

  @Post()
  @RequirePermissions('CAREER_INTERVIEW')
  async create(@Body() body: unknown, @CurrentUser() user: CareerJwtPayload) {
    const data = await this.interviewFeedbackService.create(parseCreateFeedbackDto(body), user);
    return { success: true, message: 'Interview feedback created', data };
  }

  @Get()
  @RequirePermissions('CAREER_VIEW')
  findAll(@Query() query: Record<string, unknown>) {
    return this.interviewFeedbackService.findAll(parseFeedbackFilterDto(query));
  }

  @Get(':id')
  @RequirePermissions('CAREER_VIEW')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.interviewFeedbackService.findOne(id);
    return { success: true, message: 'Interview feedback fetched', data };
  }

  @Patch(':id')
  @RequirePermissions('CAREER_ADMIN')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: CareerJwtPayload,
  ) {
    const data = await this.interviewFeedbackService.update(id, parseUpdateFeedbackDto(body), user);
    return { success: true, message: 'Interview feedback updated', data };
  }

  @Delete(':id')
  @RequirePermissions('CAREER_ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.interviewFeedbackService.remove(id);
  }
}
