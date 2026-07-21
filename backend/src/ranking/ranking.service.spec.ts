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

    rankingRepository.create.mockImplementation(
      (value: unknown): unknown => value,
    );
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

  it('recalculateForChampionship should assign competition ranks to tied total points', async () => {
    championshipRepository.findOne.mockResolvedValue({ id: 'champ-1' });
    membershipRepository.find.mockResolvedValue([
      { userId: 1, status: MembershipStatus.ACTIVE },
      { userId: 2, status: MembershipStatus.ACTIVE },
      { userId: 3, status: MembershipStatus.ACTIVE },
      { userId: 4, status: MembershipStatus.ACTIVE },
      { userId: 5, status: MembershipStatus.ACTIVE },
    ]);
    tipRepository.find
      .mockResolvedValueOnce([
        { userId: 1 },
        { userId: 2 },
        { userId: 3 },
        { userId: 4 },
        { userId: 5 },
      ])
      .mockResolvedValueOnce([
        { userId: 1, gameId: 'game-1', outcomeType: TipOutcome.EXACT },
        { userId: 2, gameId: 'game-1', outcomeType: TipOutcome.GOAL_DIFF },
        { userId: 3, gameId: 'game-1', outcomeType: TipOutcome.TENDENCY },
        { userId: 4, gameId: 'game-1', outcomeType: TipOutcome.TENDENCY },
        { userId: 5, gameId: 'game-1', outcomeType: TipOutcome.MISSED },
      ]);
    rankingRepository.find.mockResolvedValue([]);

    await service.recalculateForChampionship('champ-1');

    expect(rankingRepository.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ userId: 1, rank: 1 }),
    );
    expect(rankingRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ userId: 2, rank: 2 }),
    );
    expect(rankingRepository.save).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ userId: 3, rank: 3 }),
    );
    expect(rankingRepository.save).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ userId: 4, rank: 3 }),
    );
    expect(rankingRepository.save).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({ userId: 5, rank: 5 }),
    );
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

  it('findChampionshipStatisticsByChampionship should aggregate championship stats for all participants', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const championshipGamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          isClosed: true,
          kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeTeam: { id: 'team-1', name: 'Juventus', logoUrl: 'juve.svg' },
          awayTeam: { id: 'team-2', name: 'Inter', logoUrl: 'inter.svg' },
          homeScore: 2,
          awayScore: 1,
        },
        {
          id: 'g2',
          isClosed: true,
          kickoffTime: new Date('2026-02-17T20:00:00.000Z'),
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeTeam: { id: 'team-3', name: 'Milan', logoUrl: 'milan.svg' },
          awayTeam: { id: 'team-4', name: 'Roma', logoUrl: 'roma.svg' },
          homeScore: 1,
          awayScore: 1,
        },
        {
          id: 'g3',
          isClosed: false,
          kickoffTime: new Date('2026-02-18T18:00:00.000Z'),
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeTeam: { id: 'team-5', name: 'PSG', logoUrl: 'psg.svg' },
          awayTeam: { id: 'team-6', name: 'Bayern', logoUrl: 'bayern.svg' },
          homeScore: null,
          awayScore: null,
        },
        {
          id: 'g4',
          isClosed: true,
          kickoffTime: new Date('2026-02-18T20:00:00.000Z'),
          roundId: 'r2',
          round: { id: 'r2', name: 'Round 2' },
          homeTeam: { id: 'team-7', name: 'Arsenal', logoUrl: 'arsenal.svg' },
          awayTeam: { id: 'team-8', name: 'Chelsea', logoUrl: 'chelsea.svg' },
          homeScore: 0,
          awayScore: 0,
        },
      ]),
    };
    gameRepository.createQueryBuilder.mockReturnValue(championshipGamesBuilder);

    rankingRepository.find.mockResolvedValue([
      {
        id: 'rk-1',
        userId: 1,
        rank: 1,
        user: { id: 1, username: 'Anna', email: 'anna@example.com' },
      },
      {
        id: 'rk-2',
        userId: 2,
        rank: 2,
        user: { id: 2, username: 'Ben', email: 'ben@example.com' },
      },
    ]);

    tipRepository.find
      .mockResolvedValueOnce([]) // backfillMissingNotTipped for g1
      .mockResolvedValueOnce([]) // backfillMissingNotTipped for g2
      .mockResolvedValueOnce([]) // backfillMissingNotTipped for g4
      .mockResolvedValueOnce([
        {
          id: 't1',
          userId: 1,
          gameId: 'g1',
          homeTeamGoals: 2,
          awayTeamGoals: 1,
          points: 3,
          outcomeType: TipOutcome.EXACT,
        },
        {
          id: 't2',
          userId: 1,
          gameId: 'g2',
          homeTeamGoals: 1,
          awayTeamGoals: 1,
          points: 3,
          outcomeType: TipOutcome.EXACT,
        },
        {
          id: 't5',
          userId: 1,
          gameId: 'g4',
          homeTeamGoals: 0,
          awayTeamGoals: 0,
          points: 3,
          outcomeType: TipOutcome.EXACT,
        },
        {
          id: 't3',
          userId: 2,
          gameId: 'g1',
          homeTeamGoals: null,
          awayTeamGoals: null,
          points: 0,
          outcomeType: TipOutcome.NOT_TIPPED,
        },
        {
          id: 't4',
          userId: 2,
          gameId: 'g2',
          homeTeamGoals: 0,
          awayTeamGoals: 0,
          points: 0,
          outcomeType: TipOutcome.MISSED,
        },
        {
          id: 't6',
          userId: 2,
          gameId: 'g4',
          homeTeamGoals: 1,
          awayTeamGoals: 1,
          points: 0,
          outcomeType: TipOutcome.MISSED,
        },
      ]);

    const result = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(result.championshipId).toBe('champ-1');
    expect(result.totalMatches).toBe(4);
    expect(result.playedMatches).toBe(3);
    expect(result.participantsCount).toBe(2);
    expect(result.participatedMatches).toBe(5);
    expect(result.missedMatches).toBe(1);
    expect(result.averagePointsPerRound).toBeCloseTo(4.5, 5);
    expect(result.averagePointsPerParticipant).toBeCloseTo(4.5, 5);
    expect(result.totalPointsAllParticipants).toBe(9);
    expect(result.pointsByRound).toEqual([
      {
        roundId: 'r1',
        roundName: 'Round 1',
        points: 6,
      },
      {
        roundId: 'r2',
        roundName: 'Round 2',
        points: 3,
      },
    ]);
    expect(result.bestRound).toEqual({
      roundId: 'r1',
      roundName: 'Round 1',
      points: 6,
    });
    expect(result.worstRound).toEqual({
      roundId: 'r2',
      roundName: 'Round 2',
      points: 3,
    });
    expect(result.bestParticipant).toEqual({
      userId: 1,
      username: 'Anna',
      points: 9,
    });
    expect(result.worstParticipant).toEqual({
      userId: 2,
      username: 'Ben',
      points: 0,
    });
    expect(result.pointsDistribution.threePoints.count).toBe(3);
    expect(result.pointsDistribution.zeroPoints.count).toBe(3);
    expect(result.pointsDistribution.threePoints.ratio).toBeCloseTo(0.5, 5);
    expect(result.pointsDistribution.zeroPoints.ratio).toBeCloseTo(0.5, 5);
    expect(result.mostResultativeGame).toEqual({
      gameId: 'g1',
      roundName: 'Round 1',
      kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
      homeTeam: { id: 'team-1', name: 'Juventus', logoUrl: 'juve.svg' },
      awayTeam: { id: 'team-2', name: 'Inter', logoUrl: 'inter.svg' },
      homeScore: 2,
      awayScore: 1,
      totalPoints: 3,
      exactHits: 1,
      goalDiffHits: 0,
      tendencyHits: 0,
    });
    expect(championshipGamesBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'game.homeTeam',
      'homeTeam',
    );
    expect(championshipGamesBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'game.awayTeam',
      'awayTeam',
    );
    expect(result.participants[0]).toMatchObject({
      place: 1,
      userId: 1,
      username: 'Anna',
      totalPoints: 9,
      participatedMatches: 3,
      missedMatches: 0,
    });
    expect(result.participants[1]).toMatchObject({
      place: 2,
      userId: 2,
      username: 'Ben',
      totalPoints: 0,
      participatedMatches: 2,
      missedMatches: 1,
    });
  });

  it('findChampionshipStatisticsByChampionship should prefer exact and goal difference hits for tied game points', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const games = [
      {
        id: 'g-tendency',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T17:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h1', name: 'Home 1', logoUrl: '' },
        awayTeam: { id: 'a1', name: 'Away 1', logoUrl: '' },
        homeScore: 2,
        awayScore: 1,
      },
      {
        id: 'g-difference',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T19:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h2', name: 'Home 2', logoUrl: '' },
        awayTeam: { id: 'a2', name: 'Away 2', logoUrl: '' },
        homeScore: 2,
        awayScore: 1,
      },
      {
        id: 'g-no-exact',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T16:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h3', name: 'Home 3', logoUrl: '' },
        awayTeam: { id: 'a3', name: 'Away 3', logoUrl: '' },
        homeScore: 2,
        awayScore: 1,
      },
    ];
    const championshipGamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(games),
    };
    gameRepository.createQueryBuilder.mockReturnValue(championshipGamesBuilder);
    rankingRepository.find.mockResolvedValue(
      [1, 2, 3].map((userId) => ({
        userId,
        rank: userId,
        user: { id: userId, username: `User ${userId}` },
      })),
    );
    tipRepository.find.mockResolvedValue([
      {
        userId: 1,
        gameId: 'g-tendency',
        homeTeamGoals: 2,
        awayTeamGoals: 1,
        points: 3,
        outcomeType: TipOutcome.EXACT,
      },
      {
        userId: 2,
        gameId: 'g-tendency',
        homeTeamGoals: 1,
        awayTeamGoals: 0,
        points: 1,
        outcomeType: TipOutcome.TENDENCY,
      },
      {
        userId: 3,
        gameId: 'g-tendency',
        homeTeamGoals: 1,
        awayTeamGoals: 0,
        points: 1,
        outcomeType: TipOutcome.TENDENCY,
      },
      {
        userId: 1,
        gameId: 'g-difference',
        homeTeamGoals: 2,
        awayTeamGoals: 1,
        points: 3,
        outcomeType: TipOutcome.EXACT,
      },
      {
        userId: 2,
        gameId: 'g-difference',
        homeTeamGoals: 3,
        awayTeamGoals: 2,
        points: 2,
        outcomeType: TipOutcome.GOAL_DIFF,
      },
      {
        userId: 3,
        gameId: 'g-difference',
        homeTeamGoals: 0,
        awayTeamGoals: 2,
        points: 0,
        outcomeType: TipOutcome.MISSED,
      },
      {
        userId: 1,
        gameId: 'g-no-exact',
        homeTeamGoals: 3,
        awayTeamGoals: 2,
        points: 2,
        outcomeType: TipOutcome.GOAL_DIFF,
      },
      {
        userId: 2,
        gameId: 'g-no-exact',
        homeTeamGoals: 4,
        awayTeamGoals: 3,
        points: 2,
        outcomeType: TipOutcome.GOAL_DIFF,
      },
      {
        userId: 3,
        gameId: 'g-no-exact',
        homeTeamGoals: 1,
        awayTeamGoals: 0,
        points: 1,
        outcomeType: TipOutcome.TENDENCY,
      },
    ]);

    const result = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(result.mostResultativeGame).toMatchObject({
      gameId: 'g-difference',
      totalPoints: 5,
      exactHits: 1,
      goalDiffHits: 1,
      tendencyHits: 0,
    });
  });

  it('findChampionshipStatisticsByChampionship should prioritize points before kickoff and game id', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const games = [
      {
        id: 'z-later',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T20:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h1', name: 'Home 1', logoUrl: '' },
        awayTeam: { id: 'a1', name: 'Away 1', logoUrl: '' },
        homeScore: 1,
        awayScore: 0,
      },
      {
        id: 'z-early',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h2', name: 'Home 2', logoUrl: '' },
        awayTeam: { id: 'a2', name: 'Away 2', logoUrl: '' },
        homeScore: 1,
        awayScore: 0,
      },
      {
        id: 'a-early',
        isClosed: true,
        kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
        roundId: 'r1',
        round: { id: 'r1', name: 'Round 1' },
        homeTeam: { id: 'h3', name: 'Home 3', logoUrl: '' },
        awayTeam: { id: 'a3', name: 'Away 3', logoUrl: '' },
        homeScore: 1,
        awayScore: 0,
      },
    ];
    const championshipGamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(games),
    };
    gameRepository.createQueryBuilder.mockReturnValue(championshipGamesBuilder);
    rankingRepository.find.mockResolvedValue([
      { userId: 1, rank: 1, user: { id: 1, username: 'User 1' } },
    ]);
    tipRepository.find.mockResolvedValue(
      games.map((game) => ({
        userId: 1,
        gameId: game.id,
        homeTeamGoals: game.id === 'z-later' ? 1 : 2,
        awayTeamGoals: game.id === 'z-later' ? 0 : 1,
        points: 3,
        outcomeType: TipOutcome.EXACT,
      })),
    );

    const tiedResult = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(tiedResult.mostResultativeGame).toMatchObject({
      gameId: 'a-early',
    });

    tipRepository.find.mockResolvedValue(
      games.map((game) => ({
        userId: 1,
        gameId: game.id,
        homeTeamGoals: 1,
        awayTeamGoals: 0,
        points: game.id === 'z-later' ? 3 : 2,
        outcomeType:
          game.id === 'z-later' ? TipOutcome.EXACT : TipOutcome.GOAL_DIFF,
      })),
    );

    const higherPointsResult =
      await service.findChampionshipStatisticsByChampionship('champ-1', 1);

    expect(higherPointsResult.mostResultativeGame).toMatchObject({
      gameId: 'z-later',
      totalPoints: 3,
    });
  });

  it('findChampionshipStatisticsByChampionship should return a zero-point closed game', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });
    const game = {
      id: 'g-zero',
      isClosed: true,
      kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
      roundId: 'r1',
      round: { id: 'r1', name: 'Round 1' },
      homeTeam: { id: 'h1', name: 'Home', logoUrl: '' },
      awayTeam: { id: 'a1', name: 'Away', logoUrl: '' },
      homeScore: 0,
      awayScore: 0,
    };
    gameRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([game]),
    });
    rankingRepository.find.mockResolvedValue([]);
    tipRepository.find.mockResolvedValue([]);

    const result = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(result.mostResultativeGame).toMatchObject({
      gameId: 'g-zero',
      totalPoints: 0,
      exactHits: 0,
      goalDiffHits: 0,
      tendencyHits: 0,
    });
  });

  it('findChampionshipStatisticsByChampionship should return no resultative game without closed games', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });
    gameRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    rankingRepository.find.mockResolvedValue([]);
    tipRepository.find.mockResolvedValue([]);

    const result = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(result.mostResultativeGame).toBeNull();
  });

  it('findChampionshipStatisticsByChampionship should assign competition places to tied participants', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue({ id: 'membership-1' });

    const championshipGamesBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          isClosed: true,
          kickoffTime: new Date('2026-02-17T18:00:00.000Z'),
          roundId: 'r1',
          round: { id: 'r1', name: 'Round 1' },
          homeTeam: { id: 'team-1', name: 'Home', logoUrl: '' },
          awayTeam: { id: 'team-2', name: 'Away', logoUrl: '' },
          homeScore: 2,
          awayScore: 1,
        },
      ]),
    };
    gameRepository.createQueryBuilder.mockReturnValue(championshipGamesBuilder);
    rankingRepository.find.mockResolvedValue(
      [1, 2, 3, 4, 5].map((userId) => ({
        id: `rk-${userId}`,
        userId,
        rank: userId,
        user: { id: userId, username: `User ${userId}`, email: '' },
      })),
    );
    tipRepository.find
      .mockResolvedValueOnce([1, 2, 3, 4, 5].map((userId) => ({ userId })))
      .mockResolvedValueOnce([
        {
          userId: 1,
          gameId: 'g1',
          homeTeamGoals: 2,
          awayTeamGoals: 1,
          points: 3,
          outcomeType: TipOutcome.EXACT,
        },
        {
          userId: 2,
          gameId: 'g1',
          homeTeamGoals: 2,
          awayTeamGoals: 0,
          points: 2,
          outcomeType: TipOutcome.GOAL_DIFF,
        },
        {
          userId: 3,
          gameId: 'g1',
          homeTeamGoals: 1,
          awayTeamGoals: 0,
          points: 1,
          outcomeType: TipOutcome.TENDENCY,
        },
        {
          userId: 4,
          gameId: 'g1',
          homeTeamGoals: 1,
          awayTeamGoals: 0,
          points: 1,
          outcomeType: TipOutcome.TENDENCY,
        },
        {
          userId: 5,
          gameId: 'g1',
          homeTeamGoals: 0,
          awayTeamGoals: 2,
          points: 0,
          outcomeType: TipOutcome.MISSED,
        },
      ]);

    const result = await service.findChampionshipStatisticsByChampionship(
      'champ-1',
      1,
    );

    expect(result.participants.map((participant) => participant.place)).toEqual(
      [1, 2, 3, 3, 5],
    );
  });

  it('findChampionshipStatisticsByChampionship should throw when user is not an active member', async () => {
    jest
      .spyOn(service, 'recalculateForChampionship')
      .mockResolvedValue(undefined);
    membershipRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findChampionshipStatisticsByChampionship('champ-1', 1),
    ).rejects.toThrow('You are not an active participant in this championship');
  });
});
