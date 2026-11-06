import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoundEntity } from '../round/round.entity';
import { UserEntity } from '../user/user.entity';
import { NotificationPayload, NotificationType } from './notification.types';

@Entity('notification_dispatches')
@Index(['roundId', 'type'], { unique: true, where: `"type" = 'new_round'` })
export class NotificationDispatchEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', unique: true }) requestId: string;
  @Index() @Column({ type: 'uuid' }) roundId: string;
  @Column({ type: 'varchar' }) type: NotificationType;
  @Column({ type: 'int', nullable: true }) adminId: number | null;
  @Column({ type: 'jsonb' }) payload: NotificationPayload;
  @Column({ type: 'int' }) recipientCount: number;
  @Column({ type: 'timestamp', nullable: true }) lockedUntil: Date | null;
  @Column({ type: 'uuid', nullable: true }) lockToken: string | null;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => RoundEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roundId' })
  round: RoundEntity;
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminId' })
  admin: UserEntity | null;
}
