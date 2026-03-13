import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RankingEntity } from './ranking.entity';
import { TipEntity } from '../tip/tip.entity';
import { TipOutcome } from '../tip/tip-outcome.enum';
import { ChampionshipEntity } from '../championship/championship.entity';
import { MembershipEntity } from '../membership/membership.entity';
import { MembershipStatus } from '../membership/membership-status.enum';
import { BonusEvaluationEntity } from '../bonus/bonus-evaluation.entity';
import { BonusRuleEntity } from '../bonus/bonus-rule.entity';
import { BonusRuleStatus } from '../bonus/bonus-rule-status.enum';
import { BonusRuleType } from '../bonus/bonus-rule-type.enum';
import { GameEntity } from '../game/game.entity';
import { computeTipOutcome } from '../tip/tip-calculation';

export interface EvaluatedBonusRuleDto {
  id: string;
  name: string;
  type: BonusRuleType;
}

export type BonusColumnSubrule = 'single' | 'finalist' | 'champion';

export interface BonusColumnDto {
  key: string;
  ruleId: string;
  subrule: BonusColumnSubrule;
  label: string;
}

export interface StandingRowDto {
  id: string;
  userId: number;
  championshipId: string;
  rank: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  missedTips: number;
  totalPoints: number;
  bonusPoints: number;
  gamePoints: number;
  bonusPointsByRule: Record<string, number>;
  bonusPointsByColumn: Record<string, number>;
  updatedAt: Date;
  user: { id: number; username: string; email: string };
}

export interface StandingsResponseDto {
  evaluatedBonusRules: EvaluatedBonusRuleDto[];
  bonusColumns: BonusColumnDto[];
  standings: StandingRowDto[];
}

export interface PointsBucketDto {
  count: number;
  ratio: number;
}

export interface RoundPointsDto {
  roundId: string;
  roundName: string;
  points: number;
}

export interface UserChampionshipStatisticsDto {
  championshipId: string;
  userId: number;
  totalMatches: number;
  playedMatches: number;
  participatedMatches: number;
  missedMatches: number;
  averagePointsPerRound: number;
  pointsByRound: RoundPointsDto[];
  pointsDistribution: {
    threePoints: PointsBucketDto;
    twoPoints: PointsBucketDto;
    onePoint: PointsBucketDto;
    zeroPoints: PointsBucketDto;
  };
  bestRound: RoundPointsDto | null;
  worstRound: RoundPointsDto | null;
}

interface UserRankingData {
  userId: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  missedTips: number;
  totalPoints: number;
  bonusPoints: number;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(RankingEntity)
    private readonly rankingRepository: Repository<RankingEntity>,
    @InjectRepository(TipEntity)
    private readonly tipRepository: Repository<TipEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(BonusEvaluationEntity)
    private readonly bonusEvaluationRepository: Repository<BonusEvaluationEntity>,
    @InjectRepository(BonusRuleEntity)
    private readonly bonusRuleRepository: Repository<BonusRuleEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
  ) {}

  async recalculateForChampionship(championshipId: string): Promise<void> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const activeMembers = await this.membershipRepository.find({
      where: { championshipId, status: MembershipStatus.ACTIVE },
      select: ['userId'],
    });
    const activeUserIds = activeMembers.map((member) => member.userId);
    const activeUserIdSet = new Set(activeUserIds);

    if (activeUserIds.length === 0) {
      await this.rankingRepository.delete({ championshipId });
      return;
    }

    const closedGames = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.round', 'round')
      .where('round.championshipId = :championshipId', { championshipId })
      .andWhere('game.isClosed = :isClosed', { isClosed: true })
      .getMany();
    const closedGameIds = closedGames.map((game) => game.id);
    const closedGameIdSet = new Set(closedGameIds);

    await this.backfillMissingNotTipped(
      championshipId,
      closedGameIds,
      activeUserIds,
    );

    const tips = await this.tipRepository.find({
      where: { championshipId },
      select: ['userId', 'gameId', 'outcomeType'],
    });

    const userDataMap = new Map<number, UserRankingData>();

    for (const userId of activeUserIds) {
      userDataMap.set(userId, {
        userId,
        exactHits: 0,
        goalDiffHits: 0,
        tendencyHits: 0,
        missedTips: 0,
        totalPoints: 0,
        bonusPoints: 0,
      });
    }

    for (const tip of tips) {
      if (!activeUserIdSet.has(tip.userId)) {
        continue;
      }
      if (!closedGameIdSet.has(tip.gameId)) {
        continue;
      }

      const userData = userDataMap.get(tip.userId);
      if (!userData) {
        continue;
      }

      if (tip.outcomeType === TipOutcome.EXACT) {
        userData.exactHits++;
        userData.totalPoints += 3;
      } else if (tip.outcomeType === TipOutcome.GOAL_DIFF) {
        userData.goalDiffHits++;
        userData.totalPoints += 2;
      } else if (tip.outcomeType === TipOutcome.TENDENCY) {
        userData.tendencyHits++;
        userData.totalPoints += 1;
      } else if (tip.outcomeType === TipOutcome.MISSED) {
        userData.missedTips++;
      } else if (tip.outcomeType === TipOutcome.NOT_TIPPED) {
        userData.missedTips++;
      }
    }

    // Load bonus evaluations for this championship
    const bonusEvaluations = await this.bonusEvaluationRepository
      .createQueryBuilder('evaluation')
      .innerJoin('evaluation.bonusRule', 'bonusRule')
      .where('bonusRule.championshipId = :championshipId', { championshipId })
      .getMany();

    // Aggregate bonus points per user
    const userBonusMap = new Map<number, number>();
    for (const evaluation of bonusEvaluations) {
      if (!activeUserIdSet.has(evaluation.userId)) {
        continue;
      }
      const current = userBonusMap.get(evaluation.userId) || 0;
      userBonusMap.set(evaluation.userId, current + evaluation.points);
    }

    // Add bonus points to user data
    for (const userData of userDataMap.values()) {
      const bonusPoints = userBonusMap.get(userData.userId) || 0;
      userData.bonusPoints = bonusPoints;
      userData.totalPoints += bonusPoints;
    }

    const sortedUsers = Array.from(userDataMap.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactHits !== a.exactHits) {
        return b.exactHits - a.exactHits;
      }
      if (b.goalDiffHits !== a.goalDiffHits) {
        return b.goalDiffHits - a.goalDiffHits;
      }
      return b.tendencyHits - a.tendencyHits;
    });

    for (let i = 0; i < sortedUsers.length; i++) {
      const userData = sortedUsers[i];
      const rank = i + 1;

      const existingRanking = await this.rankingRepository.findOne({
        where: { userId: userData.userId, championshipId },
      });

      if (existingRanking) {
        existingRanking.rank = rank;
        existingRanking.exactHits = userData.exactHits;
        existingRanking.goalDiffHits = userData.goalDiffHits;
        existingRanking.tendencyHits = userData.tendencyHits;
        existingRanking.missedTips = userData.missedTips;
        existingRanking.bonusPoints = userData.bonusPoints;
        existingRanking.totalPoints = userData.totalPoints;
        await this.rankingRepository.save(existingRanking);
      } else {
        const newRanking = this.rankingRepository.create({
          userId: userData.userId,
          championshipId,
          rank,
          exactHits: userData.exactHits,
          goalDiffHits: userData.goalDiffHits,
          tendencyHits: userData.tendencyHits,
          missedTips: userData.missedTips,
          bonusPoints: userData.bonusPoints,
          totalPoints: userData.totalPoints,
        });
        await this.rankingRepository.save(newRanking);
      }
    }

    await this.deleteInactiveRankings(championshipId, activeUserIdSet);
  }

  async findByChampionship(championshipId: string): Promise<RankingEntity[]> {
    await this.recalculateForChampionship(championshipId);
    return this.rankingRepository.find({
      where: { championshipId },
      relations: ['user'],
      order: { rank: 'ASC' },
    });
  }

  async findStandingsByChampionship(
    championshipId: string,
  ): Promise<StandingsResponseDto> {
    await this.recalculateForChampionship(championshipId);

    const rankings = await this.rankingRepository.find({
      where: { championshipId },
      relations: ['user'],
      order: { rank: 'ASC' },
    });

    const evaluatedRules = await this.bonusRuleRepository.find({
      where: {
        championshipId,
        status: In([
          BonusRuleStatus.PARTIALLY_EVALUATED,
          BonusRuleStatus.EVALUATED,
        ]),
      },
      select: ['id', 'name', 'type'],
      order: { name: 'ASC' },
    });

    const evaluatedBonusRules: EvaluatedBonusRuleDto[] = evaluatedRules.map(
      (r) => ({ id: r.id, name: r.name, type: r.type }),
    );
    const bonusColumns = evaluatedRules.reduce<BonusColumnDto[]>(
      (columns, rule) => {
        if (rule.type === BonusRuleType.CHAMPION_FINALIST) {
          columns.push(
            {
              key: `${rule.id}:finalist`,
              ruleId: rule.id,
              subrule: 'finalist',
              label: `${rule.name} (Finalist)`,
            },
            {
              key: `${rule.id}:champion`,
              ruleId: rule.id,
              subrule: 'champion',
              label: `${rule.name} (Champion)`,
            },
          );
          return columns;
        }

        columns.push({
          key: `${rule.id}:single`,
          ruleId: rule.id,
          subrule: 'single',
          label: rule.name,
        });
        return columns;
      },
      [],
    );

    if (evaluatedRules.length === 0) {
      const standings: StandingRowDto[] = rankings.map((r) => ({
        id: r.id,
        userId: r.userId,
        championshipId: r.championshipId,
        rank: r.rank,
        exactHits: r.exactHits,
        goalDiffHits: r.goalDiffHits,
        tendencyHits: r.tendencyHits,
        missedTips: r.missedTips,
        totalPoints: r.totalPoints,
        bonusPoints: r.bonusPoints,
        gamePoints: r.totalPoints - r.bonusPoints,
        bonusPointsByRule: {},
        bonusPointsByColumn: {},
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          username: r.user.username,
          email: r.user.email,
        },
      }));
      return { evaluatedBonusRules: [], bonusColumns: [], standings };
    }

    const ruleIds = evaluatedRules.map((r) => r.id);
    const evaluations = await this.bonusEvaluationRepository.find({
      where: { bonusRuleId: In(ruleIds) },
      select: ['bonusRuleId', 'userId', 'points', 'subrule'],
    });
    const ruleById = new Map<string, EvaluatedBonusRuleDto>(
      evaluatedBonusRules.map((rule) => [rule.id, rule]),
    );

    const userBonusByRule = new Map<number, Map<string, number>>();
    const userBonusByColumn = new Map<number, Map<string, number>>();
    for (const ev of evaluations) {
      if (!userBonusByRule.has(ev.userId)) {
        userBonusByRule.set(ev.userId, new Map());
      }
      if (!userBonusByColumn.has(ev.userId)) {
        userBonusByColumn.set(ev.userId, new Map());
      }
      const ruleMap = userBonusByRule.get(ev.userId)!;
      const current = ruleMap.get(ev.bonusRuleId) || 0;
      ruleMap.set(ev.bonusRuleId, current + ev.points);

      const rule = ruleById.get(ev.bonusRuleId);
      if (!rule) {
        continue;
      }

      let columnKey = `${ev.bonusRuleId}:single`;
      if (rule.type === BonusRuleType.CHAMPION_FINALIST) {
        if (ev.subrule !== 'finalist' && ev.subrule !== 'champion') {
          continue;
        }
        columnKey = `${ev.bonusRuleId}:${ev.subrule}`;
      }

      const columnMap = userBonusByColumn.get(ev.userId)!;
      const currentColumnValue = columnMap.get(columnKey) || 0;
      columnMap.set(columnKey, currentColumnValue + ev.points);
    }

    const standings: StandingRowDto[] = rankings.map((r) => {
      const rulePoints: Record<string, number> = {};
      const ruleMap = userBonusByRule.get(r.userId);
      for (const rule of evaluatedRules) {
        rulePoints[rule.id] = ruleMap?.get(rule.id) ?? 0;
      }

      const columnPoints: Record<string, number> = {};
      const columnMap = userBonusByColumn.get(r.userId);
      for (const column of bonusColumns) {
        columnPoints[column.key] = columnMap?.get(column.key) ?? 0;
      }

      return {
        id: r.id,
        userId: r.userId,
        championshipId: r.championshipId,
        rank: r.rank,
        exactHits: r.exactHits,
        goalDiffHits: r.goalDiffHits,
        tendencyHits: r.tendencyHits,
        missedTips: r.missedTips,
        totalPoints: r.totalPoints,
        bonusPoints: r.bonusPoints,
        gamePoints: r.totalPoints - r.bonusPoints,
        bonusPointsByRule: rulePoints,
        bonusPointsByColumn: columnPoints,
        updatedAt: r.updatedAt,
        user: {
          id: r.user.id,
          username: r.user.username,
          email: r.user.email,
        },
      };
    });

    return { evaluatedBonusRules, bonusColumns, standings };
  }

  async findUserStatisticsByChampionship(
    championshipId: string,
    userId: number,
  ): Promise<UserChampionshipStatisticsDto> {
    await this.recalculateForChampionship(championshipId);

    const activeMembership = await this.membershipRepository.findOne({
      where: {
        championshipId,
        userId,
        status: MembershipStatus.ACTIVE,
      },
      select: ['id'],
    });

    if (!activeMembership) {
      throw new ForbiddenException(
        'You are not an active participant in this championship',
      );
    }

    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.round', 'round')
      .where('round.championshipId = :championshipId', { championshipId })
      .orderBy('game.kickoffTime', 'ASC')
      .getMany();

    const closedGames = games.filter((game) => game.isClosed);
    const tips = await this.tipRepository.find({
      where: { championshipId, userId },
      select: [
        'id',
        'gameId',
        'homeTeamGoals',
        'awayTeamGoals',
        'points',
        'outcomeType',
      ],
    });
    const tipByGameId = new Map(tips.map((tip) => [tip.gameId, tip]));

    let participatedMatches = 0;
    let missedMatches = 0;
    let threePointsCount = 0;
    let twoPointsCount = 0;
    let onePointCount = 0;
    let zeroPointsCount = 0;

    const roundTotals = new Map<string, RoundPointsDto>();

    for (const game of closedGames) {
      const tip = tipByGameId.get(game.id);
      const participated = this.hasParticipatedInGame(tip);

      if (participated) {
        participatedMatches++;
      } else {
        missedMatches++;
      }

      const gamePoints = this.resolvePointsForClosedGame(tip, game);

      if (gamePoints === 3) {
        threePointsCount++;
      } else if (gamePoints === 2) {
        twoPointsCount++;
      } else if (gamePoints === 1) {
        onePointCount++;
      } else {
        zeroPointsCount++;
      }

      const roundId = game.round?.id ?? game.roundId;
      const roundName = game.round?.name ?? roundId;
      const existingRound = roundTotals.get(roundId);

      if (existingRound) {
        existingRound.points += gamePoints;
      } else {
        roundTotals.set(roundId, { roundId, roundName, points: gamePoints });
      }
    }

    const playedMatches = closedGames.length;
    const ratio = (count: number): number =>
      playedMatches === 0 ? 0 : count / playedMatches;

    const rounds = Array.from(roundTotals.values());
    const totalPointsAcrossRounds = rounds.reduce(
      (sum, round) => sum + round.points,
      0,
    );
    const averagePointsPerRound =
      rounds.length === 0 ? 0 : totalPointsAcrossRounds / rounds.length;
    const bestRound =
      rounds.length === 0
        ? null
        : rounds.reduce((best, current) =>
            current.points > best.points ? current : best,
          );
    const worstRound =
      rounds.length === 0
        ? null
        : rounds.reduce((worst, current) =>
            current.points < worst.points ? current : worst,
          );

    return {
      championshipId,
      userId,
      totalMatches: games.length,
      playedMatches,
      participatedMatches,
      missedMatches,
      averagePointsPerRound,
      pointsByRound: rounds,
      pointsDistribution: {
        threePoints: {
          count: threePointsCount,
          ratio: ratio(threePointsCount),
        },
        twoPoints: {
          count: twoPointsCount,
          ratio: ratio(twoPointsCount),
        },
        onePoint: {
          count: onePointCount,
          ratio: ratio(onePointCount),
        },
        zeroPoints: {
          count: zeroPointsCount,
          ratio: ratio(zeroPointsCount),
        },
      },
      bestRound,
      worstRound,
    };
  }

  private async backfillMissingNotTipped(
    championshipId: string,
    closedGameIds: string[],
    activeUserIds: number[],
  ): Promise<void> {
    if (closedGameIds.length === 0 || activeUserIds.length === 0) {
      return;
    }

    for (const gameId of closedGameIds) {
      const existingTips = await this.tipRepository.find({
        where: { gameId },
        select: ['userId'],
      });
      const existingUserIdSet = new Set(existingTips.map((tip) => tip.userId));
      const missingUserIds = activeUserIds.filter(
        (userId) => !existingUserIdSet.has(userId),
      );

      if (missingUserIds.length === 0) {
        continue;
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

  private async deleteInactiveRankings(
    championshipId: string,
    activeUserIdSet: Set<number>,
  ): Promise<void> {
    const allRankings = await this.rankingRepository.find({
      where: { championshipId },
      select: ['id', 'userId'],
    });
    const staleRankingIds = allRankings
      .filter((ranking) => !activeUserIdSet.has(ranking.userId))
      .map((ranking) => ranking.id);

    if (staleRankingIds.length > 0) {
      await this.rankingRepository.delete(staleRankingIds);
    }
  }

  async ensureRankingExistsForUser(
    userId: number,
    championshipId: string,
  ): Promise<RankingEntity> {
    // Check if ranking already exists
    let ranking = await this.rankingRepository.findOne({
      where: { userId, championshipId },
    });

    // If not, create with 0 points
    if (!ranking) {
      ranking = this.rankingRepository.create({
        userId,
        championshipId,
        rank: 0, // Will be recalculated on next recalculate
        exactHits: 0,
        goalDiffHits: 0,
        tendencyHits: 0,
        missedTips: 0,
        totalPoints: 0,
      });
      await this.rankingRepository.save(ranking);
    }

    return ranking;
  }

  private hasParticipatedInGame(tip: TipEntity | undefined): boolean {
    return !!tip &&
      tip.outcomeType !== TipOutcome.NOT_TIPPED &&
      tip.homeTeamGoals !== null &&
      tip.awayTeamGoals !== null;
  }

  private resolvePointsForClosedGame(
    tip: TipEntity | undefined,
    game: GameEntity,
  ): 0 | 1 | 2 | 3 {
    if (!tip || !this.hasParticipatedInGame(tip)) {
      return 0;
    }

    if (tip.points !== null) {
      if (tip.points >= 3) {
        return 3;
      }
      if (tip.points === 2) {
        return 2;
      }
      if (tip.points === 1) {
        return 1;
      }
      return 0;
    }

    if (tip.outcomeType !== null) {
      return this.mapOutcomeToPoints(tip.outcomeType);
    }

    if (
      tip.homeTeamGoals !== null &&
      tip.awayTeamGoals !== null &&
      game.homeScore !== null &&
      game.awayScore !== null
    ) {
      return computeTipOutcome(
        tip.homeTeamGoals,
        tip.awayTeamGoals,
        game.homeScore,
        game.awayScore,
      ).points;
    }

    return 0;
  }

  private mapOutcomeToPoints(outcome: TipOutcome): 0 | 1 | 2 | 3 {
    if (outcome === TipOutcome.EXACT) {
      return 3;
    }
    if (outcome === TipOutcome.GOAL_DIFF) {
      return 2;
    }
    if (outcome === TipOutcome.TENDENCY) {
      return 1;
    }
    return 0;
  }
}
