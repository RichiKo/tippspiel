import { Repository } from 'typeorm';
import { ChampionshipService } from './championship.service';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { MembershipEntity } from '../membership/membership.entity';
import { RoundEntity } from '../round/round.entity';
import { GameEntity } from '../game/game.entity';
import { TipEntity } from '../tip/tip.entity';

describe('ChampionshipService', () => {
  let service: ChampionshipService;

  const championshipRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  } as unknown as Repository<ChampionshipEntity>;

  const teamRepository = {} as Repository<TeamEntity>;
  const membershipRepository = {
    find: jest.fn(),
  } as unknown as Repository<MembershipEntity>;
  const roundRepository = {
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<RoundEntity>;
  const gameRepository = {
    find: jest.fn(),
  } as unknown as Repository<GameEntity>;
  const tipRepository = {
    find: jest.fn(),
  } as unknown as Repository<TipEntity>;
  const membershipService = {
    joinChampionship: jest.fn(),
  };

  const createChampionship = (id: string): ChampionshipEntity =>
    ({
      id,
      name: `Championship ${id}`,
      image: '/image.jpg',
      isPublic: true,
      isActive: true,
      createdByUserId: '1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      eliminatedTeamIds: [],
    }) as unknown as ChampionshipEntity;

  const createRound = (championshipId: string): RoundEntity =>
    ({
      id: 'round-1',
      name: 'Spieltag 1',
      championshipId,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-03'),
      createdAt: new Date('2026-01-20T00:00:00.000Z'),
    }) as unknown as RoundEntity;

  const mockActiveRounds = (rounds: RoundEntity[]) => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(rounds),
    };

    (roundRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      queryBuilder,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChampionshipService(
      championshipRepository,
      teamRepository,
      membershipRepository,
      roundRepository,
      gameRepository,
      tipRepository,
      membershipService as never,
    );
  });

  it('should clear team relations before deleting championship', async () => {
    const championship = {
      id: 'champ-1',
      teams: [{ id: 'team-1' }, { id: 'team-2' }],
    } as unknown as ChampionshipEntity;

    (championshipRepository.findOne as jest.Mock).mockResolvedValue(championship);
    (championshipRepository.save as jest.Mock).mockResolvedValue({
      ...championship,
      teams: [],
    });
    (championshipRepository.delete as jest.Mock).mockResolvedValue(undefined);

    await service.remove('champ-1');

    expect(championshipRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'champ-1' },
      relations: ['teams'],
    });
    expect(championshipRepository.save).toHaveBeenCalled();
    expect(championshipRepository.delete).toHaveBeenCalledWith('champ-1');
  });

  it('should delete directly when no team relations exist', async () => {
    const championship = {
      id: 'champ-2',
      teams: [],
    } as unknown as ChampionshipEntity;

    (championshipRepository.findOne as jest.Mock).mockResolvedValue(championship);
    (championshipRepository.delete as jest.Mock).mockResolvedValue(undefined);

    await service.remove('champ-2');

    expect(championshipRepository.save).not.toHaveBeenCalled();
    expect(championshipRepository.delete).toHaveBeenCalledWith('champ-2');
  });

  it('should return null labels when user is not authenticated', async () => {
    (championshipRepository.find as jest.Mock).mockResolvedValue([
      createChampionship('champ-1'),
    ]);

    const result = await service.findAll(null);

    expect(result).toHaveLength(1);
    expect(result[0]?.currentRoundTipLabel).toBeNull();
    expect(membershipRepository.find).not.toHaveBeenCalled();
  });

  it('should return null labels when user is not an active member', async () => {
    (championshipRepository.find as jest.Mock).mockResolvedValue([
      createChampionship('champ-1'),
    ]);
    (membershipRepository.find as jest.Mock).mockResolvedValue([]);

    const result = await service.findAll(7);

    expect(result).toHaveLength(1);
    expect(result[0]?.currentRoundTipLabel).toBeNull();
  });

  it.each([
    {
      name: 'missing_all',
      tips: [],
      expectedStatus: 'missing_all',
      expectedTipped: 0,
      expectedMissing: 2,
    },
    {
      name: 'missing_some',
      tips: [
        {
          gameId: 'game-1',
          homeTeamGoals: 1,
          awayTeamGoals: 0,
        },
      ],
      expectedStatus: 'missing_some',
      expectedTipped: 1,
      expectedMissing: 1,
    },
    {
      name: 'all_tipped',
      tips: [
        {
          gameId: 'game-1',
          homeTeamGoals: 1,
          awayTeamGoals: 0,
        },
        {
          gameId: 'game-2',
          homeTeamGoals: 2,
          awayTeamGoals: 2,
        },
      ],
      expectedStatus: 'all_tipped',
      expectedTipped: 2,
      expectedMissing: 0,
    },
  ])(
    'should compute "$name" status for active round tip label',
    async ({ tips, expectedStatus, expectedTipped, expectedMissing }) => {
      (championshipRepository.find as jest.Mock).mockResolvedValue([
        createChampionship('champ-1'),
      ]);
      (membershipRepository.find as jest.Mock).mockResolvedValue([
        { championshipId: 'champ-1' },
      ]);
      mockActiveRounds([createRound('champ-1')]);
      (gameRepository.find as jest.Mock).mockResolvedValue([
        { id: 'game-1', roundId: 'round-1' },
        { id: 'game-2', roundId: 'round-1' },
      ]);
      (tipRepository.find as jest.Mock).mockResolvedValue(tips);

      const result = await service.findAll(7);

      expect(result).toHaveLength(1);
      expect(result[0]?.currentRoundTipLabel).toEqual({
        status: expectedStatus,
        currentRoundId: 'round-1',
        currentRoundName: 'Spieltag 1',
        totalGamesCount: 2,
        tippedGamesCount: expectedTipped,
        missingGamesCount: expectedMissing,
      });
    },
  );

  it('should hide label when active round has no games', async () => {
    (championshipRepository.find as jest.Mock).mockResolvedValue([
      createChampionship('champ-1'),
    ]);
    (membershipRepository.find as jest.Mock).mockResolvedValue([
      { championshipId: 'champ-1' },
    ]);
    mockActiveRounds([createRound('champ-1')]);
    (gameRepository.find as jest.Mock).mockResolvedValue([]);

    const result = await service.findAll(7);

    expect(result).toHaveLength(1);
    expect(result[0]?.currentRoundTipLabel).toBeNull();
    expect(tipRepository.find).not.toHaveBeenCalled();
  });
});
