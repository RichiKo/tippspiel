import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@app/user/user.entity';
import { ExpressRequestInterface } from '@app/types/express-request.interface';

export const User = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExpressRequestInterface>();

    if (!request.user) {
      return null;
    }

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
