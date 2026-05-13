import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRole } from '../user/user-rolle.enum';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  const createContext = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
    'allows %s users',
    (role) => {
      expect(
        guard.canActivate(createContext({ id: 1, role })),
      ).toBe(true);
    },
  );

  it('rejects regular users', () => {
    expect(() =>
      guard.canActivate(createContext({ id: 1, role: UserRole.USER })),
    ).toThrow(ForbiddenException);
  });

  it('rejects unauthenticated requests', () => {
    expect(() => guard.canActivate(createContext(null))).toThrow(
      ForbiddenException,
    );
  });
});
