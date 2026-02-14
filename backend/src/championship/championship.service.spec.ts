import { Repository } from 'typeorm';
import { ChampionshipService } from './championship.service';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';

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
  const membershipService = {
    joinChampionship: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChampionshipService(
      championshipRepository,
      teamRepository,
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
});
