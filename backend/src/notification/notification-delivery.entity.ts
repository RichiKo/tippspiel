import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationDispatchEntity } from './notification-dispatch.entity';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { DeliveryStatus } from './notification.types';

@Entity('notification_deliveries')
@Index(['dispatchId', 'subscriptionId'], { unique: true })
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) dispatchId: string;
  @Column({ type: 'uuid', nullable: true }) subscriptionId: string | null;
  @Column({ type: 'varchar', default: 'pending' }) status: DeliveryStatus;
  @Column({ type: 'int', nullable: true }) errorCode: number | null;
  @ManyToOne(() => NotificationDispatchEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispatchId' })
  dispatch: NotificationDispatchEntity;
  @ManyToOne(() => PushSubscriptionEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: PushSubscriptionEntity | null;
}
