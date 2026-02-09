import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async recalculateForChampionship(championshipId: string): Promise<void> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const tips = await this.tipRepository.find({
      where: { championshipId },
      relations: ['user'],
    });

    const userDataMap = new Map<number, UserRankingData>();

    for (const tip of tips) {
      if (!userDataMap.has(tip.userId)) {
        userDataMap.set(tip.userId, {
          userId: tip.userId,
          exactHits: 0,
          goalDiffHits: 0,
          tendencyHits: 0,
          missedTips: 0,
          totalPoints: 0,
          bonusPoints: 0,
        });
      }

      const userData = userDataMap.get(tip.userId)!;

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

    // Ensure all ACTIVE members have a ranking entry (even with 0 points)
    const allActiveMembers = await this.membershipRepository.find({
      where: { championshipId, status: MembershipStatus.ACTIVE },
    });

    for (const member of allActiveMembers) {
      if (!userDataMap.has(member.userId)) {
        // Add members without tips with 0 points
        userDataMap.set(member.userId, {
          userId: member.userId,
          exactHits: 0,
          goalDiffHits: 0,
          tendencyHits: 0,
          missedTips: 0,
          totalPoints: 0,
          bonusPoints: 0,
        });
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
  }

  async findByChampionship(championshipId: string): Promise<RankingEntity[]> {
    return this.rankingRepository.find({
      where: { championshipId },
      relations: ['user'],
      order: { rank: 'ASC' },
    });
  }

  async findStandingsByChampionship(
    championshipId: string,
  ): Promise<StandingsResponseDto> {
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
}
