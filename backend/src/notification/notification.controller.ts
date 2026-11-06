import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { User } from '../user/decoratos/user.decorator';
import {
  RegisterSubscriptionDto,
  SendNotificationDto,
} from './dto/notification.dto';
import { NotificationService } from './notification.service';

@Controller()
@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get('notifications/config')
  config() {
    return this.notifications.getConfig();
  }

  @Post('notifications/subscriptions')
  register(@User('id') userId: number, @Body() dto: RegisterSubscriptionDto) {
    return this.notifications.register(userId, dto);
  }

  @Delete('notifications/subscriptions/:id')
  @HttpCode(204)
  remove(@User('id') userId: number, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.remove(userId, id);
  }

  @Post('notifications/subscriptions/:id/test')
  @HttpCode(200)
  test(@User('id') userId: number, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.test(userId, id);
  }

  @Get('rounds/:roundId/notifications')
  @UseGuards(AdminGuard)
  status(@Param('roundId', ParseUUIDPipe) id: string) {
    return this.notifications.status(id);
  }

  @Post('rounds/:roundId/notifications')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  send(
    @Param('roundId', ParseUUIDPipe) id: string,
    @User('id') userId: number,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notifications.send(id, userId, dto);
  }

  @Post('notifications/dispatches/:id/retry')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.retry(id);
  }
}
