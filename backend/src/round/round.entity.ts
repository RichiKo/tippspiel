import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChampionshipEntity } from '../championship/championship.entity';
import { GameEntity } from '../game/game.entity';

@Entity({ name: 'rounds' })
export class RoundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column()
  championshipId: string;

  @ManyToOne(() => ChampionshipEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'championshipId' })
  championship: ChampionshipEntity;

  @OneToMany(() => GameEntity, (game) => game.round)
  games: GameEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
