import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipEntity } from './tip.entity';
import { GameEntity } from '../game/game.entity';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { computeTipOutcome } from './tip-calculation';
import { TipOutcome } from './tip-outcome.enum';
import { MembershipEntity } from '../membership/membership.entity';
import { MembershipStatus } from '../membership/membership-status.enum';

@Injectable()
export class TipService {
  constructor(
    @InjectRepository(TipEntity)
    private readonly tipRepository: Repository<TipEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
  ) {}

  async create(userId: number, createDto: CreateTipDto): Promise<TipEntity> {
    const game = await this.gameRepository.findOne({
      where: { id: createDto.gameId },
      relations: ['round'],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.round.championshipId !== createDto.championshipId) {
      throw new BadRequestException(
        'Game does not belong to the specified championship',
      );
    }

    const now = new Date();
    if (game.kickoffTime <= now) {
      throw new ForbiddenException(
        'Cannot create or update tip after kickoff time',
      );
    }

    const existingTip = await this.tipRepository.findOne({
      where: { userId, gameId: createDto.gameId },
    });

    if (existingTip) {
      existingTip.homeTeamGoals = createDto.homeTeamGoals;
      existingTip.awayTeamGoals = createDto.awayTeamGoals;
      existingTip.championshipId = createDto.championshipId;
      return this.tipRepository.save(existingTip);
    }

    const tip = this.tipRepository.create({
      userId,
      ...createDto,
    });

    return this.tipRepository.save(tip);
  }

  async update(
    id: string,
    userId: number,
    updateDto: UpdateTipDto,
  ): Promise<TipEntity> {
    const tip = await this.tipRepository.findOne({
      where: { id },
      relations: ['game'],
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    if (tip.userId !== userId) {
      throw new ForbiddenException('You can only update your own tips');
    }

    const game = await this.gameRepository.findOne({
      where: { id: tip.gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const now = new Date();
    if (game.kickoffTime <= now) {
      throw new ForbiddenException('Cannot update tip after kickoff time');
    }

    if (updateDto.homeTeamGoals !== undefined) {
      tip.homeTeamGoals = updateDto.homeTeamGoals;
    }

    if (updateDto.awayTeamGoals !== undefined) {
      tip.awayTeamGoals = updateDto.awayTeamGoals;
    }

    return this.tipRepository.save(tip);
  }

  async findByUserAndChampionship(
    userId: number,
    championshipId: string,
  ): Promise<TipEntity[]> {
    return this.tipRepository.find({
      where: { userId, championshipId },
      relations: ['game', 'game.homeTeam', 'game.awayTeam', 'game.round'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByGame(gameId: string): Promise<TipEntity[]> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['round'],
    });

    if (!game) {
      return [];
    }

    const championshipId = game.round?.championshipId;
    if (!championshipId) {
      return [];
    }

    const activeUserIds = await this.getActiveUserIds(championshipId);
    const activeUserIdSet = new Set(activeUserIds);

    const shouldCreateMissingTips =
      game.isClosed || new Date(game.kickoffTime) <= new Date();

    if (shouldCreateMissingTips) {
      await this.insertNotTippedForMissingUsers(
        gameId,
        championshipId,
        activeUserIds,
      );
    }

    const tips = await this.tipRepository.find({
      where: { gameId },
      relations: ['user'],
    });

    return tips
      .filter((tip) => activeUserIdSet.has(tip.userId))
      .sort((a, b) =>
        (a.user?.username ?? '').localeCompare(b.user?.username ?? ''),
      );
  }

  async evaluateTipsForGame(gameId: string): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game || game.homeScore === null || game.awayScore === null) {
      throw new BadRequestException('Game result not available for evaluation');
    }

    const tips = await this.tipRepository.find({
      where: { gameId },
    });

    for (const tip of tips) {
      if (tip.homeTeamGoals === null || tip.awayTeamGoals === null) {
        continue;
      }

      const outcome = computeTipOutcome(
        tip.homeTeamGoals,
        tip.awayTeamGoals,
        game.homeScore,
        game.awayScore,
      );

      tip.points = outcome.points;
      tip.outcomeType = outcome.outcomeType;

      await this.tipRepository.save(tip);
    }
  }

  async createMissingTipsForGame(
    gameId: string,
    championshipId: string,
  ): Promise<void> {
    const activeUserIds = await this.getActiveUserIds(championshipId);
    await this.insertNotTippedForMissingUsers(
      gameId,
      championshipId,
      activeUserIds,
    );
  }

  async resetTipsForGame(gameId: string): Promise<void> {
    await this.tipRepository.delete({
      gameId,
      outcomeType: TipOutcome.NOT_TIPPED,
    });

    const tipsWithGoals = await this.tipRepository.find({
      where: { gameId },
    });

    for (const tip of tipsWithGoals) {
      if (tip.homeTeamGoals !== null && tip.awayTeamGoals !== null) {
        tip.points = null;
        tip.outcomeType = null;
        await this.tipRepository.save(tip);
      }
    }
  }

  private async getActiveUserIds(championshipId: string): Promise<number[]> {
    const activeMembers = await this.membershipRepository.find({
      where: { championshipId, status: MembershipStatus.ACTIVE },
      select: ['userId'],
    });

    return activeMembers.map((member) => member.userId);
  }

  private async insertNotTippedForMissingUsers(
    gameId: string,
    championshipId: string,
    activeUserIds: number[],
  ): Promise<void> {
    if (activeUserIds.length === 0) {
      return;
    }

    const existingTips = await this.tipRepository.find({
      where: { gameId },
      select: ['userId'],
    });
    const existingUserIdSet = new Set(existingTips.map((tip) => tip.userId));
    const missingUserIds = activeUserIds.filter(
      (userId) => !existingUserIdSet.has(userId),
    );

    if (missingUserIds.length === 0) {
      return;
    }

    const values = missingUserIds.map((userId) => ({
      userId,
      gameId,
      championshipId,
      homeTeamGoals: null,
      awayTeamGoals: null,
      points: 0,
      outcomeType: TipOutcome.NOT_TIPPED,
    }));

    await this.tipRepository
      .createQueryBuilder()
      .insert()
      .into(TipEntity)
      .values(values)
      .orIgnore()
      .execute();
  }
}
