import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, LessThan, Repository } from 'typeorm';
import { BonusRuleEntity } from './bonus-rule.entity';
import { BonusPickEntity } from './bonus-pick.entity';
import { BonusEvaluationEntity } from './bonus-evaluation.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { TeamEntity } from '../team/team.entity';
import { RankingService } from '../ranking/ranking.service';
import { CreateBonusRuleDto } from './dto/create-bonus-rule.dto';
import { UpdateBonusRuleDto } from './dto/update-bonus-rule.dto';
import { EvaluateBonusDto } from './dto/evaluate-bonus.dto';
import { BonusRuleStatus } from './bonus-rule-status.enum';
import { BonusRuleType } from './bonus-rule-type.enum';
import {
  BonusRuleConfig,
  ChampionConfig,
  ChampionFinalistConfig,
} from './bonus-rule-config.interface';

@Injectable()
export class BonusService {
  constructor(
    @InjectRepository(BonusRuleEntity)
    private readonly bonusRuleRepository: Repository<BonusRuleEntity>,
    @InjectRepository(BonusPickEntity)
    private readonly bonusPickRepository: Repository<BonusPickEntity>,
    @InjectRepository(BonusEvaluationEntity)
    private readonly bonusEvaluationRepository: Repository<BonusEvaluationEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    private readonly rankingService: RankingService,
  ) {}

  // ========== CRUD for BonusRule ==========

  async createBonusRule(dto: CreateBonusRuleDto): Promise<BonusRuleEntity> {
    // Validate championship exists
    const championship = await this.championshipRepository.findOne({
      where: { id: dto.championshipId },
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    // Validate config based on type
    this.validateBonusRuleConfig(dto.type, dto.config);

    const bonusRule = this.bonusRuleRepository.create({
      ...dto,
      deadline: new Date(dto.deadline),
      status: BonusRuleStatus.DRAFT,
    });

    return this.bonusRuleRepository.save(bonusRule);
  }

  async getBonusRules(
    championshipId: string,
    status?: BonusRuleStatus,
  ): Promise<BonusRuleEntity[]> {
    const whereClause: {
      championshipId: string;
      status?: BonusRuleStatus;
    } = { championshipId };
    if (status) {
      whereClause.status = status;
    }

    return this.bonusRuleRepository.find({
      where: whereClause,
      relations: ['picks', 'evaluations'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBonusRuleById(id: string): Promise<BonusRuleEntity> {
    const bonusRule = await this.bonusRuleRepository.findOne({
      where: { id },
      relations: ['championship', 'picks', 'evaluations'],
    });

    if (!bonusRule) {
      throw new NotFoundException('Bonus rule not found');
    }

    return bonusRule;
  }

  async updateBonusRule(
    id: string,
    dto: UpdateBonusRuleDto,
  ): Promise<BonusRuleEntity> {
    const bonusRule = await this.getBonusRuleById(id);

    // Only DRAFT and PUBLISHED can be edited
    if (
      bonusRule.status !== BonusRuleStatus.DRAFT &&
      bonusRule.status !== BonusRuleStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Only DRAFT or PUBLISHED bonus rules can be edited',
      );
    }

    // Validate config if provided
    if (dto.config && dto.type) {
      this.validateBonusRuleConfig(dto.type, dto.config);
    }

    Object.assign(bonusRule, dto);
    if (dto.deadline) {
      bonusRule.deadline = new Date(dto.deadline);
    }

    return this.bonusRuleRepository.save(bonusRule);
  }

  async deleteBonusRule(id: string): Promise<void> {
    const bonusRule = await this.getBonusRuleById(id);
    await this.bonusRuleRepository.remove(bonusRule);

    // Deleting a rule can change totals/ranks when evaluations existed.
    if (bonusRule.status !== BonusRuleStatus.DRAFT) {
      await this.rankingService.recalculateForChampionship(
        bonusRule.championshipId,
      );
    }
  }

  async publishBonusRule(id: string): Promise<BonusRuleEntity> {
    const bonusRule = await this.getBonusRuleById(id);

    if (bonusRule.status !== BonusRuleStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT bonus rules can be published');
    }

    // Validate deadline is in future
    if (bonusRule.deadline <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    bonusRule.status = BonusRuleStatus.PUBLISHED;
    return this.bonusRuleRepository.save(bonusRule);
  }

  // ========== Pick Management ==========

  async createOrUpdatePick(
    bonusRuleId: string,
    userId: number,
    teamId: string,
  ): Promise<BonusPickEntity> {
    const bonusRule = await this.getBonusRuleById(bonusRuleId);

    // Check status
    if (bonusRule.status !== BonusRuleStatus.PUBLISHED) {
      throw new BadRequestException(
        'Picks can only be made for PUBLISHED bonus rules',
      );
    }

    // Check deadline
    if (bonusRule.deadline <= new Date()) {
      throw new BadRequestException('Deadline has passed');
    }

    // Validate team exists and belongs to championship
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['championships'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const teamBelongsToChampionship = team.championships.some(
      (c) => c.id === bonusRule.championshipId,
    );

    if (!teamBelongsToChampionship) {
      throw new BadRequestException(
        'Team does not belong to this championship',
      );
    }

    // Check if pick already exists
    let pick = await this.bonusPickRepository.findOne({
      where: { bonusRuleId, userId },
    });

    if (pick) {
      // Update existing pick
      pick.teamId = teamId;
      return this.bonusPickRepository.save(pick);
    } else {
      // Create new pick
      pick = this.bonusPickRepository.create({
        bonusRuleId,
        userId,
        teamId,
      });
      return this.bonusPickRepository.save(pick);
    }
  }

  async getMyPick(
    bonusRuleId: string,
    userId: number,
  ): Promise<BonusPickEntity | null> {
    return this.bonusPickRepository.findOne({
      where: { bonusRuleId, userId },
      relations: ['team'],
    });
  }

  async getAllPicks(
    bonusRuleId: string,
    userId?: number,
    isAdmin: boolean = false,
  ): Promise<BonusPickEntity[]> {
    const bonusRule = await this.getBonusRuleById(bonusRuleId);

    // If not admin, check deadline
    if (!isAdmin && bonusRule.deadline > new Date()) {
      throw new ForbiddenException('Picks are only visible after deadline');
    }

    return this.bonusPickRepository.find({
      where: { bonusRuleId },
      relations: ['user', 'team'],
      order: { createdAt: 'ASC' },
    });
  }

  // ========== Evaluation ==========

  async evaluateBonus(
    bonusRuleId: string,
    dto: EvaluateBonusDto,
  ): Promise<{ evaluationsCreated: number }> {
    const bonusRule = await this.getBonusRuleById(bonusRuleId);

    if (bonusRule.status === BonusRuleStatus.DRAFT) {
      throw new BadRequestException('Cannot evaluate DRAFT bonus rules');
    }

    const picks = await this.bonusPickRepository.find({
      where: { bonusRuleId },
    });

    if (picks.length === 0) {
      throw new BadRequestException('No picks to evaluate');
    }

    if (bonusRule.type === BonusRuleType.CHAMPION) {
      if (!dto.championTeamId) {
        throw new BadRequestException(
          'championTeamId is required for CHAMPION type',
        );
      }
      if (dto.finalistTeamIds?.length) {
        throw new BadRequestException(
          'finalistTeamIds are not supported for CHAMPION type',
        );
      }

      const config = bonusRule.config as ChampionConfig;
      await this.bonusEvaluationRepository.delete({ bonusRuleId });

      const evaluationsCreated = await this.upsertChampionEvaluation(
        bonusRuleId,
        picks,
        dto.championTeamId,
        config.championPoints,
      );

      await this.bonusRuleRepository.update(
        { id: bonusRuleId },
        { status: BonusRuleStatus.EVALUATED },
      );
      await this.rankingService.recalculateForChampionship(
        bonusRule.championshipId,
      );

      return { evaluationsCreated };
    }

    const hasChampion = Boolean(dto.championTeamId);
    const hasFinalists = Array.isArray(dto.finalistTeamIds);

    if (!hasChampion && !hasFinalists) {
      throw new BadRequestException(
        'Either championTeamId or finalistTeamIds must be provided',
      );
    }

    const config = bonusRule.config as ChampionFinalistConfig;

    // Phase 1: evaluate finalists only
    if (hasFinalists) {
      if (hasChampion) {
        throw new BadRequestException(
          'Champion can only be evaluated after finalists are set',
        );
      }

      const finalistTeamIds = this.validateFinalistsInput(dto.finalistTeamIds);
      const evaluationsCreated = await this.upsertFinalistEvaluations(
        bonusRuleId,
        picks,
        finalistTeamIds,
        config.finalistPoints,
      );

      // Finalist re-evaluation invalidates prior champion evaluation.
      await this.bonusEvaluationRepository.delete({
        bonusRuleId,
        subrule: 'champion',
      });
      await this.bonusRuleRepository.update(
        { id: bonusRuleId },
        {
          status: BonusRuleStatus.PARTIALLY_EVALUATED,
          config: {
            ...config,
            selectedFinalistTeamIds: finalistTeamIds,
            selectedChampionTeamId: undefined,
          },
        },
      );
      await this.rankingService.recalculateForChampionship(
        bonusRule.championshipId,
      );

      return { evaluationsCreated };
    }

    // Phase 2: evaluate champion after finalists were evaluated
    const savedFinalists = this.getSelectedFinalistsFromConfig(config);
    if (savedFinalists.length !== 2) {
      throw new BadRequestException(
        'Finalists must be evaluated first before champion can be evaluated',
      );
    }
    if (!savedFinalists.includes(dto.championTeamId!)) {
      throw new BadRequestException(
        'Champion must be one of the previously selected finalists',
      );
    }

    const evaluationsCreated = await this.upsertChampionEvaluation(
      bonusRuleId,
      picks,
      dto.championTeamId!,
      config.championPoints,
    );

    await this.bonusRuleRepository.update(
      { id: bonusRuleId },
      {
        status: BonusRuleStatus.EVALUATED,
        config: {
          ...config,
          selectedFinalistTeamIds: savedFinalists,
          selectedChampionTeamId: dto.championTeamId,
        },
      },
    );
    await this.rankingService.recalculateForChampionship(
      bonusRule.championshipId,
    );

    return { evaluationsCreated };
  }

  /** Returns the current evaluation state and result for pre-filling the evaluate form. */
  async getEvaluationResult(bonusRuleId: string): Promise<{
    phase: 'none' | 'finalists_done' | 'complete';
    championTeamId?: string;
    finalistTeamIds: string[];
  }> {
    const rule = await this.getBonusRuleById(bonusRuleId);

    const result: {
      phase: 'none' | 'finalists_done' | 'complete';
      championTeamId?: string;
      finalistTeamIds: string[];
    } = {
      phase: 'none',
      finalistTeamIds: [],
    };

    const championEval = await this.bonusEvaluationRepository.findOne({
      where: { bonusRuleId, subrule: 'champion' },
      select: ['userId'],
    });
    if (championEval) {
      const championPick = await this.bonusPickRepository.findOne({
        where: { bonusRuleId, userId: championEval.userId },
        select: ['teamId'],
      });
      if (championPick) {
        result.championTeamId = championPick.teamId;
      }
    }

    const config = rule.config as ChampionFinalistConfig;
    result.finalistTeamIds = this.getSelectedFinalistsFromConfig(config);
    if (config.selectedChampionTeamId) {
      result.championTeamId = config.selectedChampionTeamId;
    }

    if (rule.type === BonusRuleType.CHAMPION_FINALIST) {
      if (result.finalistTeamIds.length === 2 && result.championTeamId) {
        result.phase = 'complete';
      } else if (result.finalistTeamIds.length === 2) {
        result.phase = 'finalists_done';
      } else {
        result.phase = 'none';
      }
    } else if (result.championTeamId) {
      result.phase = 'complete';
    }

    return result;
  }

  // ========== Utility Methods ==========

  async lockExpiredBonusRules(): Promise<void> {
    const now = new Date();
    const expiredRules = await this.bonusRuleRepository.find({
      where: {
        status: BonusRuleStatus.PUBLISHED,
        deadline: LessThan(now),
      },
    });

    for (const rule of expiredRules) {
      rule.status = BonusRuleStatus.LOCKED;
      await this.bonusRuleRepository.save(rule);
    }
  }

  async getActiveBonusRules(
    championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    const now = new Date();
    return this.bonusRuleRepository
      .createQueryBuilder('bonus_rule')
      .where('bonus_rule.championshipId = :championshipId', { championshipId })
      .andWhere('bonus_rule.status = :status', {
        status: BonusRuleStatus.PUBLISHED,
      })
      .andWhere('bonus_rule.deadline > :now', { now })
      .getMany();
  }

  async getEvaluatedBonusRules(
    championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    return this.bonusRuleRepository.find({
      where: {
        championshipId,
        status: BonusRuleStatus.EVALUATED,
      },
      relations: ['evaluations', 'evaluations.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBonusRulesForOverview(
    championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    const now = new Date();

    return this.bonusRuleRepository
      .createQueryBuilder('bonus_rule')
      .where('bonus_rule.championshipId = :championshipId', { championshipId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('bonus_rule.status IN (:...overviewStatuses)', {
            overviewStatuses: [
              BonusRuleStatus.LOCKED,
              BonusRuleStatus.PARTIALLY_EVALUATED,
              BonusRuleStatus.EVALUATED,
            ],
          }).orWhere(
            '(bonus_rule.status = :publishedStatus AND bonus_rule.deadline <= :now)',
            {
              publishedStatus: BonusRuleStatus.PUBLISHED,
              now,
            },
          );
        }),
      )
      .orderBy('bonus_rule.createdAt', 'DESC')
      .getMany();
  }

  private validateFinalistsInput(finalistTeamIds?: string[]): string[] {
    if (!Array.isArray(finalistTeamIds) || finalistTeamIds.length !== 2) {
      throw new BadRequestException(
        'finalistTeamIds must contain exactly 2 teams',
      );
    }
    if (finalistTeamIds[0] === finalistTeamIds[1]) {
      throw new BadRequestException(
        'Finalist teams must be different from each other',
      );
    }

    return [...finalistTeamIds].sort();
  }

  private getSelectedFinalistsFromConfig(config: ChampionFinalistConfig): string[] {
    if (!Array.isArray(config.selectedFinalistTeamIds)) {
      return [];
    }
    if (config.selectedFinalistTeamIds.length !== 2) {
      return [];
    }
    const finalists = [...new Set(config.selectedFinalistTeamIds)];
    if (finalists.length !== 2) {
      return [];
    }
    return finalists.sort();
  }

  private async upsertFinalistEvaluations(
    bonusRuleId: string,
    picks: BonusPickEntity[],
    finalistTeamIds: string[],
    points: number,
  ): Promise<number> {
    await this.bonusEvaluationRepository.delete({
      bonusRuleId,
      subrule: 'finalist',
    });

    const matched = picks.filter((pick) => finalistTeamIds.includes(pick.teamId));
    if (matched.length === 0) {
      return 0;
    }

    await this.bonusEvaluationRepository.save(
      matched.map((pick) => ({
        bonusRuleId,
        userId: pick.userId,
        subrule: 'finalist',
        points,
      })),
    );

    return matched.length;
  }

  private async upsertChampionEvaluation(
    bonusRuleId: string,
    picks: BonusPickEntity[],
    championTeamId: string,
    points: number,
  ): Promise<number> {
    await this.bonusEvaluationRepository.delete({
      bonusRuleId,
      subrule: 'champion',
    });

    const matched = picks.filter((pick) => pick.teamId === championTeamId);
    if (matched.length === 0) {
      return 0;
    }

    await this.bonusEvaluationRepository.save(
      matched.map((pick) => ({
        bonusRuleId,
        userId: pick.userId,
        subrule: 'champion',
        points,
      })),
    );

    return matched.length;
  }

  private validateBonusRuleConfig(
    type: BonusRuleType,
    config: BonusRuleConfig,
  ): void {
    if (type === BonusRuleType.CHAMPION) {
      const championConfig = config as ChampionConfig;
      if (
        !championConfig.championPoints ||
        typeof championConfig.championPoints !== 'number'
      ) {
        throw new BadRequestException(
          'championPoints is required and must be a number',
        );
      }
    } else if (type === BonusRuleType.CHAMPION_FINALIST) {
      const finalistConfig = config as ChampionFinalistConfig;
      if (
        !finalistConfig.championPoints ||
        typeof finalistConfig.championPoints !== 'number' ||
        !finalistConfig.finalistPoints ||
        typeof finalistConfig.finalistPoints !== 'number'
      ) {
        throw new BadRequestException(
          'championPoints and finalistPoints are required and must be numbers',
        );
      }
    }
  }
}
