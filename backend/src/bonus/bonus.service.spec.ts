import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusService } from './bonus.service';
import { BonusRuleEntity } from './bonus-rule.entity';
import { BonusPickEntity } from './bonus-pick.entity';
import { BonusEvaluationEntity } from './bonus-evaluation.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { TeamEntity } from '../team/team.entity';
import { RankingService } from '../ranking/ranking.service';
import { BonusRuleType } from './bonus-rule-type.enum';
import { BonusRuleStatus } from './bonus-rule-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BonusService', () => {
  let service: BonusService;
  let bonusRuleRepository: Repository<BonusRuleEntity>;
  let bonusPickRepository: Repository<BonusPickEntity>;
  let bonusEvaluationRepository: Repository<BonusEvaluationEntity>;
  let championshipRepository: Repository<ChampionshipEntity>;
  let teamRepository: Repository<TeamEntity>;
  let rankingService: RankingService;

  const mockBonusRuleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockBonusPickRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockBonusEvaluationRepository = {
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockChampionshipRepository = {
    findOne: jest.fn(),
  };

  const mockTeamRepository = {
    findOne: jest.fn(),
  };

  const mockRankingService = {
    recalculateForChampionship: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BonusService,
        {
          provide: getRepositoryToken(BonusRuleEntity),
          useValue: mockBonusRuleRepository,
        },
        {
          provide: getRepositoryToken(BonusPickEntity),
          useValue: mockBonusPickRepository,
        },
        {
          provide: getRepositoryToken(BonusEvaluationEntity),
          useValue: mockBonusEvaluationRepository,
        },
        {
          provide: getRepositoryToken(ChampionshipEntity),
          useValue: mockChampionshipRepository,
        },
        {
          provide: getRepositoryToken(TeamEntity),
          useValue: mockTeamRepository,
        },
        {
          provide: RankingService,
          useValue: mockRankingService,
        },
      ],
    }).compile();

    service = module.get<BonusService>(BonusService);
    bonusRuleRepository = module.get(getRepositoryToken(BonusRuleEntity));
    bonusPickRepository = module.get(getRepositoryToken(BonusPickEntity));
    bonusEvaluationRepository = module.get(
      getRepositoryToken(BonusEvaluationEntity),
    );
    championshipRepository = module.get(getRepositoryToken(ChampionshipEntity));
    teamRepository = module.get(getRepositoryToken(TeamEntity));
    rankingService = module.get<RankingService>(RankingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBonusRule', () => {
    it('should create a bonus rule with DRAFT status', async () => {
      const dto = {
        championshipId: 'champ-1',
        type: BonusRuleType.CHAMPION,
        name: 'Bundesliga Champion',
        config: { championPoints: 10 },
        deadline: new Date('2025-12-31').toISOString(),
      };

      const championship = { id: 'champ-1', name: 'Test Championship' };
      mockChampionshipRepository.findOne.mockResolvedValue(championship);

      const createdRule = {
        id: 'rule-1',
        ...dto,
        status: BonusRuleStatus.DRAFT,
      };
      mockBonusRuleRepository.create.mockReturnValue(createdRule);
      mockBonusRuleRepository.save.mockResolvedValue(createdRule);

      const result = await service.createBonusRule(dto);

      expect(championshipRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.championshipId },
      });
      expect(bonusRuleRepository.create).toHaveBeenCalled();
      expect(bonusRuleRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(BonusRuleStatus.DRAFT);
    });

    it('should throw NotFoundException if championship does not exist', async () => {
      const dto = {
        championshipId: 'non-existent',
        type: BonusRuleType.CHAMPION,
        name: 'Test',
        config: { championPoints: 10 },
        deadline: new Date('2025-12-31').toISOString(),
      };

      mockChampionshipRepository.findOne.mockResolvedValue(null);

      await expect(service.createBonusRule(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publishBonusRule', () => {
    it('should publish a DRAFT bonus rule', async () => {
      const bonusRule = {
        id: 'rule-1',
        status: BonusRuleStatus.DRAFT,
        deadline: new Date(Date.now() + 86400000), // tomorrow
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockBonusRuleRepository.save.mockResolvedValue({
        ...bonusRule,
        status: BonusRuleStatus.PUBLISHED,
      });

      const result = await service.publishBonusRule('rule-1');

      expect(result.status).toBe(BonusRuleStatus.PUBLISHED);
      expect(bonusRuleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if deadline is in the past', async () => {
      const bonusRule = {
        id: 'rule-1',
        status: BonusRuleStatus.DRAFT,
        deadline: new Date(Date.now() - 86400000), // yesterday
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);

      await expect(service.publishBonusRule('rule-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createOrUpdatePick', () => {
    it('should create a new pick if none exists', async () => {
      const bonusRule = {
        id: 'rule-1',
        championshipId: 'champ-1',
        status: BonusRuleStatus.PUBLISHED,
        deadline: new Date(Date.now() + 86400000),
      };

      const team = {
        id: 'team-1',
        championships: [{ id: 'champ-1' }],
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockTeamRepository.findOne.mockResolvedValue(team);
      mockBonusPickRepository.findOne.mockResolvedValue(null);

      const newPick = {
        id: 'pick-1',
        bonusRuleId: 'rule-1',
        userId: 1,
        teamId: 'team-1',
      };
      mockBonusPickRepository.create.mockReturnValue(newPick);
      mockBonusPickRepository.save.mockResolvedValue(newPick);

      const result = await service.createOrUpdatePick('rule-1', 1, 'team-1');

      expect(bonusPickRepository.create).toHaveBeenCalled();
      expect(bonusPickRepository.save).toHaveBeenCalled();
      expect(result.teamId).toBe('team-1');
    });

    it('should throw BadRequestException if deadline has passed', async () => {
      const bonusRule = {
        id: 'rule-1',
        status: BonusRuleStatus.PUBLISHED,
        deadline: new Date(Date.now() - 1000),
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);

      await expect(
        service.createOrUpdatePick('rule-1', 1, 'team-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('evaluateBonus', () => {
    it('should evaluate a CHAMPION bonus rule and call ranking recalculation', async () => {
      const bonusRule = {
        id: 'rule-1',
        championshipId: 'champ-1',
        type: BonusRuleType.CHAMPION,
        status: BonusRuleStatus.LOCKED,
        config: { championPoints: 10 },
      };

      const picks = [
        { userId: 1, teamId: 'team-1' },
        { userId: 2, teamId: 'team-2' },
        { userId: 3, teamId: 'team-1' },
      ];

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockBonusPickRepository.find.mockResolvedValue(picks);
      mockBonusEvaluationRepository.save.mockResolvedValue({});
      mockBonusEvaluationRepository.delete.mockResolvedValue({});
      mockBonusRuleRepository.update.mockResolvedValue({});

      const result = await service.evaluateBonus('rule-1', {
        championTeamId: 'team-1',
      });

      expect(result.evaluationsCreated).toBe(2); // users 1 and 3
      expect(bonusEvaluationRepository.save).toHaveBeenCalledTimes(1);
      expect(rankingService.recalculateForChampionship).toHaveBeenCalledWith(
        'champ-1',
      );
    });

    it('should throw BadRequestException if status is DRAFT', async () => {
      const bonusRule = {
        id: 'rule-1',
        status: BonusRuleStatus.DRAFT,
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);

      await expect(
        service.evaluateBonus('rule-1', { championTeamId: 'team-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should evaluate CHAMPION_FINALIST in phase 1 (finalists only)', async () => {
      const bonusRule = {
        id: 'rule-1',
        championshipId: 'champ-1',
        type: BonusRuleType.CHAMPION_FINALIST,
        status: BonusRuleStatus.LOCKED,
        config: { championPoints: 10, finalistPoints: 5 },
      };
      const picks = [
        { userId: 1, teamId: 'team-a' },
        { userId: 2, teamId: 'team-b' },
        { userId: 3, teamId: 'team-c' },
      ];

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockBonusPickRepository.find.mockResolvedValue(picks);
      mockBonusEvaluationRepository.delete.mockResolvedValue({});
      mockBonusEvaluationRepository.save.mockResolvedValue({});
      mockBonusRuleRepository.update.mockResolvedValue({});

      const result = await service.evaluateBonus('rule-1', {
        finalistTeamIds: ['team-a', 'team-b'],
      });

      expect(result.evaluationsCreated).toBe(2);
      expect(bonusRuleRepository.update).toHaveBeenCalledWith(
        { id: 'rule-1' },
        {
          status: BonusRuleStatus.PARTIALLY_EVALUATED,
          config: {
            championPoints: 10,
            finalistPoints: 5,
            selectedFinalistTeamIds: ['team-a', 'team-b'],
            selectedChampionTeamId: undefined,
          },
        },
      );
      expect(rankingService.recalculateForChampionship).toHaveBeenCalledWith(
        'champ-1',
      );
    });

    it('should reject champion evaluation before finalists are set', async () => {
      const bonusRule = {
        id: 'rule-1',
        championshipId: 'champ-1',
        type: BonusRuleType.CHAMPION_FINALIST,
        status: BonusRuleStatus.LOCKED,
        config: { championPoints: 10, finalistPoints: 5 },
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockBonusPickRepository.find.mockResolvedValue([{ userId: 1, teamId: 'team-a' }]);
      mockBonusEvaluationRepository.find.mockResolvedValue([]);

      await expect(
        service.evaluateBonus('rule-1', { championTeamId: 'team-a' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteBonusRule', () => {
    it('should delete evaluated bonus rule and recalculate ranking', async () => {
      const bonusRule = {
        id: 'rule-1',
        championshipId: 'champ-1',
        status: BonusRuleStatus.EVALUATED,
      };

      mockBonusRuleRepository.findOne.mockResolvedValue(bonusRule);
      mockBonusRuleRepository.remove.mockResolvedValue(undefined);

      await service.deleteBonusRule('rule-1');

      expect(bonusRuleRepository.remove).toHaveBeenCalledWith(bonusRule);
      expect(rankingService.recalculateForChampionship).toHaveBeenCalledWith(
        'champ-1',
      );
    });
  });
});
