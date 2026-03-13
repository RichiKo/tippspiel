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
    findOne: jest.fn(),
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
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
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

  it('findUserStatisticsByChampionship should aggregate closed games and round points', async () => {
    const recalculateSpy = jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);

    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const gamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          isClosed: true,
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeScore: 2,
          awayScore: 1,
        },
        {
          id: 'g2',
          isClosed: true,
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeScore: 1,
          awayScore: 1,
        },
        {
          id: 'g3',
          isClosed: true,
          roundId: 'r2',
          round: { id: 'r2', name: 'Round 2' },
          homeScore: 0,
          awayScore: 1,
        },
        {
          id: 'g4',
          isClosed: false,
          roundId: 'r2',
          round: { id: 'r2', name: 'Round 2' },
          homeScore: null,
          awayScore: null,
        },
      ]),
    };
    gameRepository.createQueryBuilder.mockReturnValue(gamesBuilder);

    tipRepository.find.mockResolvedValue([
      {
        id: 'tip-1',
        gameId: 'g1',
        homeTeamGoals: 2,
        awayTeamGoals: 1,
        points: 3,
        outcomeType: TipOutcome.EXACT,
      },
      {
        id: 'tip-2',
        gameId: 'g2',
        homeTeamGoals: null,
        awayTeamGoals: null,
        points: 0,
        outcomeType: TipOutcome.NOT_TIPPED,
      },
      {
        id: 'tip-3',
        gameId: 'g3',
        homeTeamGoals: 1,
        awayTeamGoals: 0,
        points: 0,
        outcomeType: TipOutcome.MISSED,
      },
    ]);

    const result = await service.findUserStatisticsByChampionship('champ-1', 1);

    expect(recalculateSpy).toHaveBeenCalledWith('champ-1');
    expect(result.totalMatches).toBe(4);
    expect(result.playedMatches).toBe(3);
    expect(result.participatedMatches).toBe(2);
    expect(result.missedMatches).toBe(1);
    expect(result.averagePointsPerRound).toBeCloseTo(1.5, 5);
    expect(result.pointsDistribution.threePoints.count).toBe(1);
    expect(result.pointsDistribution.twoPoints.count).toBe(0);
    expect(result.pointsDistribution.onePoint.count).toBe(0);
    expect(result.pointsDistribution.zeroPoints.count).toBe(2);
    expect(result.pointsDistribution.threePoints.ratio).toBeCloseTo(1 / 3, 5);
    expect(result.pointsDistribution.zeroPoints.ratio).toBeCloseTo(2 / 3, 5);
    expect(result.pointsByRound).toEqual([
      {
        roundId: 'r1',
        roundName: 'Round 1',
        points: 3,
      },
      {
        roundId: 'r2',
        roundName: 'Round 2',
        points: 0,
      },
    ]);
    expect(result.bestRound).toEqual({
      roundId: 'r1',
      roundName: 'Round 1',
      points: 3,
    });
    expect(result.worstRound).toEqual({
      roundId: 'r2',
      roundName: 'Round 2',
      points: 0,
    });
  });

  it('findUserStatisticsByChampionship should return zero ratios and null rounds when no closed games exist', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const gamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'g-open',
          isClosed: false,
          roundId: 'r-open',
          round: { id: 'r-open', name: 'Round Open' },
          homeScore: null,
          awayScore: null,
        },
      ]),
    };
    gameRepository.createQueryBuilder.mockReturnValue(gamesBuilder);
    tipRepository.find.mockResolvedValue([]);

    const result = await service.findUserStatisticsByChampionship('champ-1', 1);

    expect(result.playedMatches).toBe(0);
    expect(result.participatedMatches).toBe(0);
    expect(result.missedMatches).toBe(0);
    expect(result.averagePointsPerRound).toBe(0);
    expect(result.pointsDistribution.threePoints.ratio).toBe(0);
    expect(result.pointsDistribution.twoPoints.ratio).toBe(0);
    expect(result.pointsDistribution.onePoint.ratio).toBe(0);
    expect(result.pointsDistribution.zeroPoints.ratio).toBe(0);
    expect(result.pointsByRound).toEqual([]);
    expect(result.bestRound).toBeNull();
    expect(result.worstRound).toBeNull();
  });

  it('findUserStatisticsByChampionship should throw when user is not an active member', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findUserStatisticsByChampionship('champ-1', 99),
    ).rejects.toThrow('You are not an active participant in this championship');
  });
});
