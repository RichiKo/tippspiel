import { TipService } from './tip.service';
import { TipOutcome } from './tip-outcome.enum';
import { MembershipStatus } from '../membership/membership-status.enum';

describe('TipService', () => {
  const tipRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const gameRepository = {
    findOne: jest.fn(),
  };

  const membershipRepository = {
    find: jest.fn(),
  };

  let service: TipService;

  beforeEach(() => {
    jest.clearAllMocks();

    const insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    tipRepository.createQueryBuilder.mockReturnValue(insertBuilder);

    service = new TipService(
      tipRepository as never,
      gameRepository as never,
      membershipRepository as never,
    );
  });

  it('createMissingTipsForGame should create notTipped entries for ACTIVE users without tip', async () => {
    tipRepository.find.mockResolvedValue([{ userId: 11 }]);
    membershipRepository.find.mockResolvedValue([
      { userId: 11, status: MembershipStatus.ACTIVE },
      { userId: 22, status: MembershipStatus.ACTIVE },
    ]);

    await service.createMissingTipsForGame('game-1', 'champ-1');

    expect(membershipRepository.find).toHaveBeenCalledWith({
      where: { championshipId: 'champ-1', status: MembershipStatus.ACTIVE },
      select: ['userId'],
    });
    expect(tipRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('findByGame should create missing notTipped entries for started games and return only ACTIVE members', async () => {
    gameRepository.findOne.mockResolvedValue({
      id: 'game-1',
      isClosed: false,
      kickoffTime: new Date(Date.now() - 60_000),
      round: { championshipId: 'champ-1' },
    });

    membershipRepository.find.mockResolvedValue([
      { userId: 1, status: MembershipStatus.ACTIVE },
      { userId: 2, status: MembershipStatus.ACTIVE },
    ]);

    tipRepository.find
      .mockResolvedValueOnce([{ userId: 1 }])
      .mockResolvedValueOnce([
        {
          id: 'tip-1',
          userId: 1,
          gameId: 'game-1',
          championshipId: 'champ-1',
          points: 3,
          outcomeType: TipOutcome.EXACT,
          user: { id: 1, username: 'A' },
        },
        {
          id: 'tip-2',
          userId: 2,
          gameId: 'game-1',
          championshipId: 'champ-1',
          points: 0,
          outcomeType: TipOutcome.NOT_TIPPED,
          user: { id: 2, username: 'B' },
        },
        {
          id: 'tip-3',
          userId: 3,
          gameId: 'game-1',
          championshipId: 'champ-1',
          points: 0,
          outcomeType: TipOutcome.MISSED,
          user: { id: 3, username: 'C' },
        },
      ]);

    const tips = await service.findByGame('game-1');

    expect(tipRepository.createQueryBuilder).toHaveBeenCalled();
    expect(tips.map((tip) => tip.userId)).toEqual([1, 2]);
  });

  it('findByGame should not create missing tips before kickoff', async () => {
    const queryBuilderCountBefore = tipRepository.createQueryBuilder.mock.calls.length;

    gameRepository.findOne.mockResolvedValue({
      id: 'game-1',
      isClosed: false,
      kickoffTime: new Date(Date.now() + 60_000),
      round: { championshipId: 'champ-1' },
    });

    membershipRepository.find.mockResolvedValue([
      { userId: 1, status: MembershipStatus.ACTIVE },
    ]);

    tipRepository.find.mockResolvedValue([
      {
        id: 'tip-1',
        userId: 1,
        gameId: 'game-1',
        championshipId: 'champ-1',
        points: 1,
        outcomeType: TipOutcome.TENDENCY,
        user: { id: 1, username: 'A' },
      },
      {
        id: 'tip-2',
        userId: 77,
        gameId: 'game-1',
        championshipId: 'champ-1',
        points: 0,
        outcomeType: TipOutcome.MISSED,
        user: { id: 77, username: 'X' },
      },
    ]);

    const tips = await service.findByGame('game-1');

    expect(tipRepository.createQueryBuilder.mock.calls.length).toBe(
      queryBuilderCountBefore,
    );
    expect(tips.map((tip) => tip.userId)).toEqual([1]);
  });
});
