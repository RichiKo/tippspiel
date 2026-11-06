import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushTransportService } from './push-transport.service';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { NotificationDispatchEntity } from './notification-dispatch.entity';
import { NotificationDeliveryEntity } from './notification-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushSubscriptionEntity,
      NotificationDispatchEntity,
      NotificationDeliveryEntity,
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, PushTransportService],
})
export class NotificationModule {}
