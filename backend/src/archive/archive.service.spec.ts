import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArchiveService } from './archive.service';

describe('ArchiveService', () => {
  const archiveRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const userRepository = {
    findBy: jest.fn(),
  };

  let service: ArchiveService;

  beforeEach(() => {
    jest.clearAllMocks();
    archiveRepository.create.mockImplementation((value) => value);
    archiveRepository.save.mockImplementation((value) =>
      Promise.resolve({ id: 'archive-1', ...value }),
    );
    service = new ArchiveService(
      archiveRepository as never,
      userRepository as never,
    );
  });

  it('creates an archive entry with registered and manual winners', async () => {
    userRepository.findBy.mockResolvedValue([
      { id: 1, username: 'Anna', image: 'anna.png' },
      { id: 2, username: 'Ben', image: 'ben.png' },
    ]);

    const result = await service.create({
      championshipName: 'WM Tipps 2026',
      year: 2026,
      firstPlace: { userId: 1, points: 22541 },
      secondPlace: { manualName: 'Gastspieler', points: 18698 },
      thirdPlace: { userId: 2, points: 12256 },
    } as any);

    expect(archiveRepository.create).toHaveBeenCalledWith({
      championshipName: 'WM Tipps 2026',
      year: 2026,
      firstPlaceUserId: 1,
      firstPlaceManualName: null,
      firstPlaceDisplayName: 'Anna',
      firstPlacePoints: 22541,
      secondPlaceUserId: null,
      secondPlaceManualName: 'Gastspieler',
      secondPlaceDisplayName: 'Gastspieler',
      secondPlacePoints: 18698,
      thirdPlaceUserId: 2,
      thirdPlaceManualName: null,
      thirdPlaceDisplayName: 'Ben',
      thirdPlacePoints: 12256,
    });
    expect(result.firstPlaceDisplayName).toBe('Anna');
  });

  it('rejects negative winner points', async () => {
    await expect(
      service.create({
        championshipName: 'EM Tipps 2024',
        year: 2024,
        firstPlace: { userId: 1, points: -1 },
        secondPlace: { manualName: 'Ben', points: 14 },
        thirdPlace: { manualName: 'Clara', points: 9 },
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate registered winners across places', async () => {
    await expect(
      service.create({
        championshipName: 'EM Tipps 2024',
        year: 2024,
        firstPlace: { userId: 1, points: 20 },
        secondPlace: { userId: 1, points: 18 },
        thirdPlace: { manualName: 'Dritte Person', points: 16 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate manual winner names across places', async () => {
    await expect(
      service.create({
        championshipName: 'EM Tipps 2024',
        year: 2024,
        firstPlace: { manualName: 'Max Muster', points: 20 },
        secondPlace: { manualName: ' max  muster ', points: 18 },
        thirdPlace: { manualName: 'Andere Person', points: 16 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects winners with both userId and manualName', async () => {
    await expect(
      service.create({
        championshipName: 'EM Tipps 2024',
        year: 2024,
        firstPlace: { userId: 1, manualName: 'Anna', points: 20 },
        secondPlace: { manualName: 'Ben', points: 18 },
        thirdPlace: { manualName: 'Clara', points: 16 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown registered users', async () => {
    userRepository.findBy.mockResolvedValue([{ id: 1, username: 'Anna' }]);

    await expect(
      service.create({
        championshipName: 'WM Tipps 2026',
        year: 2026,
        firstPlace: { userId: 1, points: 20 },
        secondPlace: { userId: 2, points: 18 },
        thirdPlace: { manualName: 'Clara', points: 16 },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates archive entries with scalar winner ids instead of stale loaded relations', async () => {
    archiveRepository.findOne
      .mockResolvedValueOnce({
        id: 'archive-1',
        firstPlaceUser: { id: 23, username: 'Dima' },
        secondPlaceUser: { id: 25, username: 'Jenya' },
      })
      .mockResolvedValueOnce({
        id: 'archive-1',
        firstPlaceUserId: 31,
        firstPlaceDisplayName: 'Erik',
        secondPlaceUserId: 32,
        secondPlaceDisplayName: 'Richi',
      });
    archiveRepository.update.mockResolvedValue({ affected: 1 });
    userRepository.findBy.mockResolvedValue([
      { id: 31, username: 'Erik' },
      { id: 32, username: 'Richi' },
    ]);

    await service.update('archive-1', {
      championshipName: 'WM Tipps 2026',
      year: 2026,
      firstPlace: { userId: 31, points: 10 },
      secondPlace: { userId: 32, points: 8 },
      thirdPlace: { manualName: 'Max', points: 6 },
    });

    expect(archiveRepository.update).toHaveBeenCalledWith('archive-1', {
      championshipName: 'WM Tipps 2026',
      year: 2026,
      firstPlaceUserId: 31,
      firstPlaceManualName: null,
      firstPlaceDisplayName: 'Erik',
      firstPlacePoints: 10,
      secondPlaceUserId: 32,
      secondPlaceManualName: null,
      secondPlaceDisplayName: 'Richi',
      secondPlacePoints: 8,
      thirdPlaceUserId: null,
      thirdPlaceManualName: 'Max',
      thirdPlaceDisplayName: 'Max',
      thirdPlacePoints: 6,
    });
    expect(archiveRepository.save).not.toHaveBeenCalled();
  });
});
