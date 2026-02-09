import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BonusRuleEntity } from './bonus-rule.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'bonus_evaluations' })
@Index(['bonusRuleId', 'userId', 'subrule'], { unique: true })
export class BonusEvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bonusRuleId: string;

  @Column()
  userId: number;

  @Column({ length: 50 })
  subrule: string;

  @Column({ type: 'int' })
  points: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => BonusRuleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bonusRuleId' })
  bonusRule: BonusRuleEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
