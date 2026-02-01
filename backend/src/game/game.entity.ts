import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoundEntity } from '../round/round.entity';
import { TeamEntity } from '../team/team.entity';

@Entity({ name: 'games' })
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  homeTeamId: string;

  @Column()
  awayTeamId: string;

  @Column({ type: 'timestamp' })
  kickoffTime: Date;

  @Column()
  roundId: string;

  @Column({ type: 'int', nullable: true })
  homeScore: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore: number | null;

  @Column({ default: false })
  isClosed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => RoundEntity, (round) => round.games, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roundId' })
  round: RoundEntity;

  @ManyToOne(() => TeamEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam: TeamEntity;

  @ManyToOne(() => TeamEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam: TeamEntity;
}
