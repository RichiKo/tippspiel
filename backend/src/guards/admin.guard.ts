import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ExpressRequestInterface } from '../types/express-request.interface';
import { UserRole } from '../user/user-rolle.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<ExpressRequestInterface>();
    const role = request.user?.role;

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      return true;
    }

    throw new ForbiddenException('Only admins can perform this action');
  }
}
