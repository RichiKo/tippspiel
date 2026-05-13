import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ArchiveEntryEntity } from './archive-entry.entity';
import { ArchiveWinnerPlace } from './archive-winner-place.type';
import { ArchiveWinnerDto } from './dto/archive-winner.dto';
import { CreateArchiveEntryDto } from './dto/create-archive-entry.dto';
import { UpdateArchiveEntryDto } from './dto/update-archive-entry.dto';

interface WinnerSnapshot {
  userId: number | null;
  manualName: string | null;
  displayName: string;
  points: number;
}

@Injectable()
export class ArchiveService {
  constructor(
    @InjectRepository(ArchiveEntryEntity)
    private readonly archiveRepository: Repository<ArchiveEntryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findAll(): Promise<ArchiveEntryEntity[]> {
    return this.archiveRepository.find({
      relations: ['firstPlaceUser', 'secondPlaceUser', 'thirdPlaceUser'],
      order: {
        year: 'DESC',
        championshipName: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<ArchiveEntryEntity> {
    const entry = await this.archiveRepository.findOne({
      where: { id },
      relations: ['firstPlaceUser', 'secondPlaceUser', 'thirdPlaceUser'],
    });

    if (!entry) {
      throw new NotFoundException('Archive entry not found');
    }

    return entry;
  }

  async create(dto: CreateArchiveEntryDto): Promise<ArchiveEntryEntity> {
    const payload = await this.buildArchivePayload(dto);
    const archiveEntry = this.archiveRepository.create(payload);
    return this.archiveRepository.save(archiveEntry);
  }

  async update(
    id: string,
    dto: UpdateArchiveEntryDto,
  ): Promise<ArchiveEntryEntity> {
    await this.findOne(id);
    const payload = await this.buildArchivePayload(dto);
    await this.archiveRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.archiveRepository.delete(id);
  }

  private async buildArchivePayload(
    dto: CreateArchiveEntryDto,
  ): Promise<Partial<ArchiveEntryEntity>> {
    const championshipName = this.normalizeName(dto.championshipName);
    if (!championshipName) {
      throw new BadRequestException('Championship name is required');
    }

    this.validateYear(dto.year);
    this.validateWinnerSources([dto.firstPlace, dto.secondPlace, dto.thirdPlace]);

    const usersById = await this.loadUsersById([
      dto.firstPlace,
      dto.secondPlace,
      dto.thirdPlace,
    ]);

    const snapshots = {
      firstPlace: this.buildWinnerSnapshot(dto.firstPlace, usersById),
      secondPlace: this.buildWinnerSnapshot(dto.secondPlace, usersById),
      thirdPlace: this.buildWinnerSnapshot(dto.thirdPlace, usersById),
    };
    this.validateUniqueDisplayNames(snapshots);

    return {
      championshipName,
      year: dto.year,
      firstPlaceUserId: snapshots.firstPlace.userId,
      firstPlaceManualName: snapshots.firstPlace.manualName,
      firstPlaceDisplayName: snapshots.firstPlace.displayName,
      firstPlacePoints: snapshots.firstPlace.points,
      secondPlaceUserId: snapshots.secondPlace.userId,
      secondPlaceManualName: snapshots.secondPlace.manualName,
      secondPlaceDisplayName: snapshots.secondPlace.displayName,
      secondPlacePoints: snapshots.secondPlace.points,
      thirdPlaceUserId: snapshots.thirdPlace.userId,
      thirdPlaceManualName: snapshots.thirdPlace.manualName,
      thirdPlaceDisplayName: snapshots.thirdPlace.displayName,
      thirdPlacePoints: snapshots.thirdPlace.points,
    };
  }

  private validateYear(year: number): void {
    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      throw new BadRequestException('Archive year cannot be in the future');
    }
  }

  private validateWinnerSources(winners: ArchiveWinnerDto[]): void {
    const userIds = new Set<number>();
    const manualNames = new Set<string>();

    for (const winner of winners) {
      if (!Number.isInteger(winner.points) || winner.points < 0) {
        throw new BadRequestException('Archive winner points must be positive');
      }

      const hasUserId = winner.userId !== undefined && winner.userId !== null;
      const manualName = this.normalizeName(winner.manualName);
      const hasManualName = manualName.length > 0;

      if (hasUserId === hasManualName) {
        throw new BadRequestException(
          'Each archive winner needs exactly one source',
        );
      }

      if (hasUserId) {
        if (userIds.has(winner.userId!)) {
          throw new BadRequestException('Archive winners must be unique');
        }
        userIds.add(winner.userId!);
      }

      if (hasManualName) {
        const key = this.normalizeComparisonKey(manualName);
        if (manualNames.has(key)) {
          throw new BadRequestException('Archive winners must be unique');
        }
        manualNames.add(key);
      }
    }
  }

  private async loadUsersById(
    winners: ArchiveWinnerDto[],
  ): Promise<Map<number, UserEntity>> {
    const userIds = Array.from(
      new Set(
        winners
          .map((winner) => winner.userId)
          .filter((userId): userId is number => typeof userId === 'number'),
      ),
    );

    if (userIds.length === 0) {
      return new Map();
    }

    const users = await this.userRepository.findBy({ id: In(userIds) });
    const usersById = new Map(users.map((user) => [user.id, user]));

    for (const userId of userIds) {
      if (!usersById.has(userId)) {
        throw new NotFoundException('Winner user not found');
      }
    }

    return usersById;
  }

  private buildWinnerSnapshot(
    winner: ArchiveWinnerDto,
    usersById: Map<number, UserEntity>,
  ): WinnerSnapshot {
    if (winner.userId !== undefined && winner.userId !== null) {
      const user = usersById.get(winner.userId);
      if (!user) {
        throw new NotFoundException('Winner user not found');
      }

      return {
        userId: user.id,
        manualName: null,
        displayName: user.username,
        points: winner.points,
      };
    }

    const manualName = this.normalizeName(winner.manualName);
    return {
      userId: null,
      manualName,
      displayName: manualName,
      points: winner.points,
    };
  }

  private validateUniqueDisplayNames(
    snapshots: Record<ArchiveWinnerPlace, WinnerSnapshot>,
  ): void {
    const displayNames = new Set<string>();

    for (const snapshot of Object.values(snapshots)) {
      const key = this.normalizeComparisonKey(snapshot.displayName);
      if (displayNames.has(key)) {
        throw new BadRequestException('Archive winners must be unique');
      }
      displayNames.add(key);
    }
  }

  private normalizeName(value: string | null | undefined): string {
    return (value ?? '').trim().replace(/\s+/g, ' ');
  }

  private normalizeComparisonKey(value: string): string {
    return this.normalizeName(value).toLocaleLowerCase('de');
  }
}
