import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChampionshipEntity } from '../championship/championship.entity';
import { BonusPickEntity } from './bonus-pick.entity';
import { BonusEvaluationEntity } from './bonus-evaluation.entity';
import { BonusRuleType } from './bonus-rule-type.enum';
import { BonusRuleStatus } from './bonus-rule-status.enum';
import { BonusRuleConfig } from './bonus-rule-config.interface';

@Entity({ name: 'bonus_rules' })
export class BonusRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  championshipId: string;

  @Column({ type: 'enum', enum: BonusRuleType })
  type: BonusRuleType;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'jsonb' })
  config: BonusRuleConfig;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: BonusRuleStatus,
    default: BonusRuleStatus.DRAFT,
  })
  status: BonusRuleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ChampionshipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'championshipId' })
  championship: ChampionshipEntity;

  @OneToMany(() => BonusPickEntity, (pick) => pick.bonusRule)
  picks: BonusPickEntity[];

  @OneToMany(() => BonusEvaluationEntity, (evaluation) => evaluation.bonusRule)
  evaluations: BonusEvaluationEntity[];
}
