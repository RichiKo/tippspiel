import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { MembershipStatus } from './membership-status.enum';

@Entity({ name: 'memberships' })
@Index(['userId', 'championshipId'], { unique: true })
export class MembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column()
  championshipId: string;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE,
  })
  status: MembershipStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => ChampionshipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'championshipId' })
  championship: ChampionshipEntity;
}
