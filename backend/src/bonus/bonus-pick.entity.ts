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
import { BonusRuleEntity } from './bonus-rule.entity';
import { UserEntity } from '../user/user.entity';
import { TeamEntity } from '../team/team.entity';

@Entity({ name: 'bonus_picks' })
@Index(['bonusRuleId', 'userId'], { unique: true })
export class BonusPickEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bonusRuleId: string;

  @Column()
  userId: number;

  @Column()
  teamId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BonusRuleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bonusRuleId' })
  bonusRule: BonusRuleEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: TeamEntity;
}
