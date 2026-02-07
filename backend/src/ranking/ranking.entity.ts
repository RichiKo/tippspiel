import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ChampionshipEntity } from '../championship/championship.entity';

@Entity({ name: 'rankings' })
@Index(['userId', 'championshipId'], { unique: true })
export class RankingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column()
  championshipId: string;

  @Column({ type: 'int', default: 0 })
  rank: number;

  @Column({ type: 'int', default: 0 })
  exactHits: number;

  @Column({ type: 'int', default: 0 })
  goalDiffHits: number;

  @Column({ type: 'int', default: 0 })
  tendencyHits: number;

  @Column({ type: 'int', default: 0 })
  missedTips: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => ChampionshipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'championshipId' })
  championship: ChampionshipEntity;
}
