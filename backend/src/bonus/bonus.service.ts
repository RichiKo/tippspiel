import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
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

    // Only DRAFT can be deleted
    if (bonusRule.status !== BonusRuleStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT bonus rules can be deleted');
    }

    // Check if there are any picks
    const picksCount = await this.bonusPickRepository.count({
      where: { bonusRuleId: id },
    });

    if (picksCount > 0) {
      throw new BadRequestException(
        'Cannot delete bonus rule with existing picks',
      );
    }

    await this.bonusRuleRepository.remove(bonusRule);
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

    // Check status - can evaluate PUBLISHED or LOCKED (but not DRAFT or already EVALUATED)
    if (bonusRule.status === BonusRuleStatus.DRAFT) {
      throw new BadRequestException('Cannot evaluate DRAFT bonus rules');
    }
    if (bonusRule.status === BonusRuleStatus.EVALUATED) {
      throw new BadRequestException('Bonus already evaluated');
    }

    // Get all picks
    const picks = await this.bonusPickRepository.find({
      where: { bonusRuleId },
    });

    if (picks.length === 0) {
      throw new BadRequestException('No picks to evaluate');
    }

    // Validate: At least one field must be provided
    if (!dto.championTeamId && (!dto.finalistTeamIds || dto.finalistTeamIds.length === 0)) {
      throw new BadRequestException('Either championTeamId or finalistTeamIds must be provided');
    }

    let evaluationsCreated = 0;
    const finalistTeamIds: string[] = dto.finalistTeamIds || [];

    if (bonusRule.type === BonusRuleType.CHAMPION) {
      // CHAMPION type
      if (!dto.championTeamId) {
        throw new BadRequestException('championTeamId is required for CHAMPION type');
      }

      const config = bonusRule.config as ChampionConfig;

      for (const pick of picks) {
        if (pick.teamId === dto.championTeamId) {
          await this.bonusEvaluationRepository.save({
            bonusRuleId,
            userId: pick.userId,
            subrule: 'champion',
            points: config.championPoints,
          });
          evaluationsCreated++;
        }
      }
    } else if (bonusRule.type === BonusRuleType.CHAMPION_FINALIST) {
      // CHAMPION_FINALIST type
      const config = bonusRule.config as ChampionFinalistConfig;

      for (const pick of picks) {
        // Check for champion (independent)
        if (dto.championTeamId && pick.teamId === dto.championTeamId) {
          // Check if evaluation already exists
          const existingChampion = await this.bonusEvaluationRepository.findOne({
            where: {
              bonusRuleId,
              userId: pick.userId,
              subrule: 'champion',
            },
          });

          if (!existingChampion) {
            await this.bonusEvaluationRepository.save({
              bonusRuleId,
              userId: pick.userId,
              subrule: 'champion',
              points: config.championPoints,
            });
            evaluationsCreated++;
          }
        }
        
        // Check for finalist (independent, can be same team as champion)
        if (finalistTeamIds.length > 0 && finalistTeamIds.includes(pick.teamId)) {
          // Check if evaluation already exists
          const existingFinalist = await this.bonusEvaluationRepository.findOne({
            where: {
              bonusRuleId,
              userId: pick.userId,
              subrule: 'finalist',
            },
          });

          if (!existingFinalist) {
            await this.bonusEvaluationRepository.save({
              bonusRuleId,
              userId: pick.userId,
              subrule: 'finalist',
              points: config.finalistPoints,
            });
            evaluationsCreated++;
          }
        }
      }
    }

    // Update status to EVALUATED
    bonusRule.status = BonusRuleStatus.EVALUATED;
    await this.bonusRuleRepository.save(bonusRule);

    // Recalculate rankings to include bonus points
    await this.rankingService.recalculateForChampionship(
      bonusRule.championshipId,
    );

    return { evaluationsCreated };
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
