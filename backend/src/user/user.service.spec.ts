import { UserService } from './user.service';

describe('UserService', () => {
  const userRepository = {
    find: jest.fn(),
  };

  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(userRepository as never);
  });

  it('returns only safe user data for archive options', async () => {
    userRepository.find.mockResolvedValue([
      { id: 1, username: 'Anna', image: 'anna.png' },
    ]);

    const result = await service.findArchiveOptions();

    expect(userRepository.find).toHaveBeenCalledWith({
      select: ['id', 'username', 'image'],
      order: { username: 'ASC' },
    });
    expect(result).toEqual([{ id: 1, username: 'Anna', image: 'anna.png' }]);
  });
});
