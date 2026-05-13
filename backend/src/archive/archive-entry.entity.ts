import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'archive_entries' })
@Index(['year', 'championshipName'])
export class ArchiveEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  championshipName: string;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'integer', nullable: true })
  firstPlaceUserId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstPlaceManualName: string | null;

  @Column({ length: 100 })
  firstPlaceDisplayName: string;

  @Column({ type: 'integer', default: 0 })
  firstPlacePoints: number;

  @Column({ type: 'integer', nullable: true })
  secondPlaceUserId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  secondPlaceManualName: string | null;

  @Column({ length: 100 })
  secondPlaceDisplayName: string;

  @Column({ type: 'integer', default: 0 })
  secondPlacePoints: number;

  @Column({ type: 'integer', nullable: true })
  thirdPlaceUserId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  thirdPlaceManualName: string | null;

  @Column({ length: 100 })
  thirdPlaceDisplayName: string;

  @Column({ type: 'integer', default: 0 })
  thirdPlacePoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'firstPlaceUserId' })
  firstPlaceUser: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'secondPlaceUserId' })
  secondPlaceUser: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'thirdPlaceUserId' })
  thirdPlaceUser: UserEntity | null;
}
