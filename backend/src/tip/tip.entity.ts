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
import { GameEntity } from '../game/game.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { TipOutcome } from './tip-outcome.enum';

@Entity({ name: 'tips' })
@Index(['userId', 'gameId'], { unique: true })
export class TipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @Column()
  gameId: string;

  @Column()
  championshipId: string;

  @Column({ type: 'int', nullable: true })
  homeTeamGoals: number | null;

  @Column({ type: 'int', nullable: true })
  awayTeamGoals: number | null;

  @Column({ type: 'int', nullable: true })
  points: number | null;

  @Column({
    type: 'enum',
    enum: TipOutcome,
    nullable: true,
  })
  outcomeType: TipOutcome | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => GameEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: GameEntity;

  @ManyToOne(() => ChampionshipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'championshipId' })
  championship: ChampionshipEntity;
}
