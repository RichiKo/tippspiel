import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { TeamEntity } from '../team/team.entity';
import { RoundEntity } from '../round/round.entity';
import { MembershipEntity } from '../membership/membership.entity';

@Entity({ name: 'championships' })
export class ChampionshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  image: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => TeamEntity, (team) => team.championships)
  teams: TeamEntity[];

  @OneToMany(() => RoundEntity, (round) => round.championship)
  rounds: RoundEntity[];

  @OneToMany(() => MembershipEntity, (membership) => membership.championship)
  memberships: MembershipEntity[];
}
