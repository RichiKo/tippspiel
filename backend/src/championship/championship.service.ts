import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';
import { MembershipService } from '../membership/membership.service';
import {
  ChampionshipCardResponseDto,
  ChampionshipDetailResponseDto,
  CurrentRoundTipLabelDto,
  RoundPredictionProgressDto,
} from './types/championship-response';
import { MembershipEntity } from '../membership/membership.entity';
import { MembershipStatus } from '../membership/membership-status.enum';
import { RoundEntity } from '../round/round.entity';
import { GameEntity } from '../game/game.entity';
import { TipEntity } from '../tip/tip.entity';

@Injectable()
export class ChampionshipService {
  constructor(
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(RoundEntity)
    private readonly roundRepository: Repository<RoundEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(TipEntity)
    private readonly tipRepository: Repository<TipEntity>,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
  ) {}

  async findAll(userId: number | null): Promise<ChampionshipCardResponseDto[]> {
    const championships = await this.championshipRepository.find();
    if (championships.length === 0) {
      return [];
    }

    if (!userId) {
      return championships.map((championship) => ({
        ...championship,
        currentRoundTipLabel: null,
      }));
    }

    const championshipIds = championships.map((championship) => championship.id);
    const activeMemberships = await this.membershipRepository.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        championshipId: In(championshipIds),
      },
      select: ['championshipId'],
    });
    const activeChampionshipIdSet = new Set(
      activeMemberships.map((membership) => membership.championshipId),
    );

    if (activeChampionshipIdSet.size === 0) {
      return championships.map((championship) => ({
        ...championship,
        currentRoundTipLabel: null,
      }));
    }

    const activeRounds = await this.roundRepository
      .createQueryBuilder('round')
      .where('round.championshipId IN (:...championshipIds)', {
        championshipIds: Array.from(activeChampionshipIdSet),
      })
      // Tip-label relevance is deadline-driven: show until round end date.
      .andWhere('COALESCE(round.endDate, round.startDate) >= CURRENT_DATE')
      .orderBy('COALESCE(round.endDate, round.startDate)', 'ASC')
      .addOrderBy('round.startDate', 'ASC')
      .addOrderBy('round.createdAt', 'ASC')
      .getMany();

    const activeRoundByChampionshipId = new Map<string, RoundEntity>();
    for (const round of activeRounds) {
      const existingRound = activeRoundByChampionshipId.get(round.championshipId);
      if (
        !existingRound ||
        this.compareRoundsByClosestDeadline(round, existingRound) < 0
      ) {
        activeRoundByChampionshipId.set(round.championshipId, round);
      }
    }

    if (activeRoundByChampionshipId.size === 0) {
      return championships.map((championship) => ({
        ...championship,
        currentRoundTipLabel: null,
      }));
    }

    const activeRoundIds = Array.from(activeRoundByChampionshipId.values()).map(
      (round) => round.id,
    );
    const games = await this.gameRepository.find({
      where: { roundId: In(activeRoundIds) },
      select: ['id', 'roundId'],
    });

    const totalGamesCountByRoundId = new Map<string, number>();
    const gameRoundByGameId = new Map<string, string>();
    for (const game of games) {
      totalGamesCountByRoundId.set(
        game.roundId,
        (totalGamesCountByRoundId.get(game.roundId) ?? 0) + 1,
      );
      gameRoundByGameId.set(game.id, game.roundId);
    }

    const gameIds = games.map((game) => game.id);
    const tips =
      gameIds.length > 0
        ? await this.tipRepository.find({
            where: {
              userId,
              gameId: In(gameIds),
            },
            select: ['gameId', 'homeTeamGoals', 'awayTeamGoals'],
          })
        : [];

    const tippedGamesCountByRoundId = new Map<string, number>();
    for (const tip of tips) {
      if (tip.homeTeamGoals === null || tip.awayTeamGoals === null) {
        continue;
      }

      const roundId = gameRoundByGameId.get(tip.gameId);
      if (!roundId) {
        continue;
      }

      tippedGamesCountByRoundId.set(
        roundId,
        (tippedGamesCountByRoundId.get(roundId) ?? 0) + 1,
      );
    }

    return championships.map((championship) => {
      const label = this.buildCurrentRoundTipLabel(
        championship.id,
        activeChampionshipIdSet,
        activeRoundByChampionshipId,
        totalGamesCountByRoundId,
        tippedGamesCountByRoundId,
      );

      return {
        ...championship,
        currentRoundTipLabel: label,
      };
    });
  }

  async findOne(id: string): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }
    return championship;
  }

  async findOneDetail(id: string): Promise<ChampionshipDetailResponseDto> {
    const championship = await this.findOne(id);

    const activeMemberships = await this.membershipRepository.find({
      where: {
        championshipId: id,
        status: MembershipStatus.ACTIVE,
      },
      select: ['userId'],
    });
    const activeUserIds = activeMemberships.map((membership) => membership.userId);
    const totalUsers = activeUserIds.length;

    const rounds = await this.roundRepository.find({
      where: { championshipId: id },
      order: {
        startDate: 'ASC',
        createdAt: 'ASC',
      },
    });

    if (rounds.length === 0) {
      return {
        ...championship,
        roundPredictionProgress: [],
      };
    }

    const roundIds = rounds.map((round) => round.id);
    const games =
      roundIds.length > 0
        ? await this.gameRepository.find({
            where: { roundId: In(roundIds) },
            select: ['id', 'roundId'],
          })
        : [];

    const totalMatchesByRoundId = new Map<string, number>();
    const gameRoundByGameId = new Map<string, string>();
    for (const game of games) {
      totalMatchesByRoundId.set(
        game.roundId,
        (totalMatchesByRoundId.get(game.roundId) ?? 0) + 1,
      );
      gameRoundByGameId.set(game.id, game.roundId);
    }

    const gameIds = games.map((game) => game.id);
    const submittedTips =
      gameIds.length > 0 && activeUserIds.length > 0
        ? await this.tipRepository.find({
            where: {
              championshipId: id,
              gameId: In(gameIds),
              userId: In(activeUserIds),
            },
            select: ['gameId', 'homeTeamGoals', 'awayTeamGoals'],
          })
        : [];

    const submittedPredictionsByRoundId = new Map<string, number>();
    for (const tip of submittedTips) {
      if (tip.homeTeamGoals === null || tip.awayTeamGoals === null) {
        continue;
      }

      const roundId = gameRoundByGameId.get(tip.gameId);
      if (!roundId) {
        continue;
      }

      submittedPredictionsByRoundId.set(
        roundId,
        (submittedPredictionsByRoundId.get(roundId) ?? 0) + 1,
      );
    }

    const roundIdsOpenForTips = await this.getRoundIdSetOpenForTips(id);
    const roundPredictionProgress = rounds.map((round) =>
      this.buildRoundPredictionProgress(
        round,
        totalUsers,
        totalMatchesByRoundId,
        submittedPredictionsByRoundId,
        roundIdsOpenForTips,
      ),
    );

    return {
      ...championship,
      roundPredictionProgress,
    };
  }

  async create(
    createDto: CreateChampionshipDto,
    userId: number,
  ): Promise<ChampionshipEntity> {
    const championship = this.championshipRepository.create({
      ...createDto,
      createdByUserId: userId.toString(),
    });
    const saved = await this.championshipRepository.save(championship);

    // Auto-join owner as ACTIVE member
    await this.membershipService.joinChampionship(userId, saved.id);

    return saved;
  }

  async update(
    id: string,
    updateDto: UpdateChampionshipDto,
  ): Promise<ChampionshipEntity> {
    await this.championshipRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const championship = await this.championshipRepository.findOne({
      where: { id },
      relations: ['teams'],
    });

    if (!championship) {
      return;
    }

    if (championship.teams?.length) {
      championship.teams = [];
      await this.championshipRepository.save(championship);
    }

    await this.championshipRepository.delete(id);
  }

  async addTeam(
    championshipId: string,
    teamId: string,
  ): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if team is already added
    const teamExists = championship.teams?.some((t) => t.id === teamId);
    if (!teamExists) {
      if (!championship.teams) {
        championship.teams = [];
      }
      championship.teams.push(team);
      await this.championshipRepository.save(championship);
    }

    return this.findOne(championshipId);
  }

  async removeTeam(
    championshipId: string,
    teamId: string,
  ): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    championship.teams = championship.teams?.filter((t) => t.id !== teamId);
    championship.eliminatedTeamIds = (
      championship.eliminatedTeamIds || []
    ).filter((id) => id !== teamId);
    await this.championshipRepository.save(championship);

    return this.findOne(championshipId);
  }

  async getTeams(championshipId: string): Promise<TeamEntity[]> {
    const championship = await this.findOne(championshipId);
    return championship.teams || [];
  }

  async getEliminatedTeams(championshipId: string): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    const championship = await this.findOne(championshipId);
    return {
      championshipId,
      eliminatedTeamIds: championship.eliminatedTeamIds || [],
    };
  }

  async updateEliminatedTeams(
    championshipId: string,
    teamIds: string[],
    isEliminated: boolean,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const normalizedTeamIds = Array.from(new Set(teamIds));
    const championshipTeamIds = new Set(
      (championship.teams || []).map((team) => team.id),
    );
    const invalidTeamIds = normalizedTeamIds.filter(
      (teamId) => !championshipTeamIds.has(teamId),
    );

    if (invalidTeamIds.length > 0) {
      throw new BadRequestException(
        `Teams are not assigned to this championship: ${invalidTeamIds.join(', ')}`,
      );
    }

    const currentEliminated = new Set(championship.eliminatedTeamIds || []);

    if (isEliminated) {
      normalizedTeamIds.forEach((teamId) => currentEliminated.add(teamId));
    } else {
      normalizedTeamIds.forEach((teamId) => currentEliminated.delete(teamId));
    }

    championship.eliminatedTeamIds = Array.from(currentEliminated);
    await this.championshipRepository.save(championship);

    return {
      championshipId,
      eliminatedTeamIds: championship.eliminatedTeamIds,
    };
  }

  async updateSingleEliminatedTeam(
    championshipId: string,
    teamId: string,
    isEliminated: boolean,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    return this.updateEliminatedTeams(championshipId, [teamId], isEliminated);
  }

  private buildCurrentRoundTipLabel(
    championshipId: string,
    activeChampionshipIdSet: Set<string>,
    activeRoundByChampionshipId: Map<string, RoundEntity>,
    totalGamesCountByRoundId: Map<string, number>,
    tippedGamesCountByRoundId: Map<string, number>,
  ): CurrentRoundTipLabelDto | null {
    if (!activeChampionshipIdSet.has(championshipId)) {
      return null;
    }

    const currentRound = activeRoundByChampionshipId.get(championshipId);
    if (!currentRound) {
      return null;
    }

    const totalGamesCount = totalGamesCountByRoundId.get(currentRound.id) ?? 0;
    if (totalGamesCount === 0) {
      return null;
    }

    const tippedGamesCount = tippedGamesCountByRoundId.get(currentRound.id) ?? 0;
    const missingGamesCount = totalGamesCount - tippedGamesCount;

    if (tippedGamesCount === 0) {
      return {
        status: 'missing_all',
        currentRoundId: currentRound.id,
        currentRoundName: currentRound.name,
        totalGamesCount,
        tippedGamesCount,
        missingGamesCount,
      };
    }

    if (tippedGamesCount === totalGamesCount) {
      return {
        status: 'all_tipped',
        currentRoundId: currentRound.id,
        currentRoundName: currentRound.name,
        totalGamesCount,
        tippedGamesCount,
        missingGamesCount,
      };
    }

    return {
      status: 'missing_some',
      currentRoundId: currentRound.id,
      currentRoundName: currentRound.name,
      totalGamesCount,
      tippedGamesCount,
      missingGamesCount,
    };
  }

  private async getRoundIdSetOpenForTips(
    championshipId: string,
  ): Promise<Set<string>> {
    const roundsOpenForTips = await this.roundRepository
      .createQueryBuilder('round')
      .where('round.championshipId = :championshipId', {
        championshipId,
      })
      // Tip-label relevance is deadline-driven: show until round end date.
      .andWhere('COALESCE(round.endDate, round.startDate) >= CURRENT_DATE')
      .getMany();

    return new Set(roundsOpenForTips.map((round) => round.id));
  }

  private buildRoundPredictionProgress(
    round: RoundEntity,
    totalUsers: number,
    totalMatchesByRoundId: Map<string, number>,
    submittedPredictionsByRoundId: Map<string, number>,
    roundIdsOpenForTips: Set<string>,
  ): RoundPredictionProgressDto {
    const totalMatchesInRound = totalMatchesByRoundId.get(round.id) ?? 0;
    const submittedPredictions = submittedPredictionsByRoundId.get(round.id) ?? 0;
    const totalPossiblePredictions = totalUsers * totalMatchesInRound;
    const rawProgressPercent =
      totalPossiblePredictions === 0
        ? 0
        : Math.round((submittedPredictions / totalPossiblePredictions) * 100);
    const progressPercent = Math.max(0, Math.min(100, rawProgressPercent));

    return {
      roundId: round.id,
      roundName: round.name,
      isRoundOpenForTips: roundIdsOpenForTips.has(round.id),
      totalUsers,
      totalMatchesInRound,
      totalPossiblePredictions,
      submittedPredictions,
      progressPercent,
    };
  }

  private compareRoundsByClosestDeadline(
    roundA: RoundEntity,
    roundB: RoundEntity,
  ): number {
    const endA = this.toTimestamp(roundA.endDate ?? roundA.startDate);
    const endB = this.toTimestamp(roundB.endDate ?? roundB.startDate);
    if (endA !== endB) {
      return endA - endB;
    }

    const startA = this.toTimestamp(roundA.startDate);
    const startB = this.toTimestamp(roundB.startDate);
    if (startA !== startB) {
      return startA - startB;
    }

    const createdA = this.toTimestamp(roundA.createdAt);
    const createdB = this.toTimestamp(roundB.createdAt);
    return createdA - createdB;
  }

  private toTimestamp(value: Date): number {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
