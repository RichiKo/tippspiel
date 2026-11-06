import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('push_subscriptions')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column() userId: number;
  @Column({ type: 'varchar', length: 2048, unique: true, select: false })
  endpoint: string;
  @Column({ select: false }) p256dh: string;
  @Column({ select: false }) auth: string;
  @Column({ default: 'uk' }) locale: string;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
