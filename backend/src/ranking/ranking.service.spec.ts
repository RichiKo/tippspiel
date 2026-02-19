import { RankingService } from './ranking.service';
import { MembershipStatus } from '../membership/membership-status.enum';
import { TipOutcome } from '../tip/tip-outcome.enum';

describe('RankingService', () => {
  const rankingRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const tipRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const championshipRepository = {
    findOne: jest.fn(),
  };

  const membershipRepository = {
    find: jest.fn(),
  };

  const bonusEvaluationRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const bonusRuleRepository = {
    find: jest.fn(),
  };

  const gameRepository = {
    createQueryBuilder: jest.fn(),
  };

  let service: RankingService;

  beforeEach(() => {
    jest.clearAllMocks();

    rankingRepository.create.mockImplementation((value) => value);
    rankingRepository.save.mockResolvedValue(undefined);
    rankingRepository.findOne.mockResolvedValue(null);

    const tipInsertBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    tipRepository.createQueryBuilder.mockReturnValue(tipInsertBuilder);

    const closedGamesBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'game-1' }]),
    };
    gameRepository.createQueryBuilder.mockReturnValue(closedGamesBuilder);

    const bonusEvaluationBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    bonusEvaluationRepository.createQueryBuilder.mockReturnValue(
      bonusEvaluationBuilder,
    );

    service = new RankingService(
      rankingRepository as never,
      tipRepository as never,
      championshipRepository as never,
      membershipRepository as never,
      bonusEvaluationRepository as never,
      bonusRuleRepository as never,
      gameRepository as never,
    );
  });

  it('findByChampionship should trigger recalculation before loading rankings', async () => {
    const recalculateSpy = jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    rankingRepository.find.mockResolvedValue([]);

    await service.findByChampionship('champ-1');

    expect(recalculateSpy).toHaveBeenCalledWith('champ-1');
    expect(rankingRepository.find).toHaveBeenCalled();
  });

  it('findStandingsByChampionship should trigger recalculation before loading standings', async () => {
    const recalculateSpy = jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);

    rankingRepository.find.mockResolvedValue([]);
    bonusRuleRepository.find.mockResolvedValue([]);

    await service.findStandingsByChampionship('champ-1');

    expect(recalculateSpy).toHaveBeenCalledWith('champ-1');
    expect(rankingRepository.find).toHaveBeenCalled();
  });

  it('recalculateForChampionship should include only ACTIVE members and remove non-active rankings', async () => {
    championshipRepository.findOne.mockResolvedValue({ id: 'champ-1' });
    membershipRepository.find.mockResolvedValue([
      { userId: 1, status: MembershipStatus.ACTIVE },
      { userId: 2, status: MembershipStatus.ACTIVE },
    ]);
    tipRepository.find
      .mockResolvedValueOnce([{ userId: 1 }])
      .mockResolvedValueOnce([
        {
          userId: 1,
          outcomeType: TipOutcome.EXACT,
        },
        {
          userId: 2,
          outcomeType: TipOutcome.NOT_TIPPED,
        },
        {
          userId: 3,
          outcomeType: TipOutcome.EXACT,
        },
      ]);
    rankingRepository.find.mockResolvedValue([
      { id: 'rank-1', userId: 1, championshipId: 'champ-1' },
      { id: 'rank-2', userId: 2, championshipId: 'champ-1' },
      { id: 'rank-3', userId: 3, championshipId: 'champ-1' },
    ]);

    await service.recalculateForChampionship('champ-1');

    expect(tipRepository.createQueryBuilder).toHaveBeenCalled();
    expect(rankingRepository.delete).toHaveBeenCalled();
    expect(rankingRepository.save).toHaveBeenCalledTimes(2);
  });
});
