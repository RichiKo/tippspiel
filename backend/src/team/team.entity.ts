import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ChampionshipEntity } from '../championship/championship.entity';

@Entity({ name: 'teams' })
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10 })
  shortName: string;

  @Column()
  logoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(
    () => ChampionshipEntity,
    (championship) => championship.teams,
  )
  @JoinTable({
    name: 'team_championships',
    joinColumn: { name: 'teamId', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'championshipId',
      referencedColumnName: 'id',
    },
  })
  championships: ChampionshipEntity[];
}
