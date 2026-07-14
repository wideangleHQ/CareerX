import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import { parseNotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationsService } from './notifications.service';
import type { NotificationDto, NotificationListResponseDto } from './notifications.service';

@Controller('api/v1/notifications')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
@RequirePermissions('CAREER_VIEW')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<NotificationListResponseDto> {
    return this.notificationsService.findAll(parseNotificationFilterDto(query), user);
  }

  @Patch(':id/read')
  async markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<{ success: true; message: string; data: NotificationDto }> {
    const data = await this.notificationsService.markRead(id, user);
    return { success: true, message: 'Notification marked read', data };
  }

  @Patch('read-all')
  markAllRead(
    @CurrentUser() user: CareerJwtPayload | undefined,
  ): Promise<{ success: true; updated: number }> {
    return this.notificationsService.markAllRead(user);
  }
}
