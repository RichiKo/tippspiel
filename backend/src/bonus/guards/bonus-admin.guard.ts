import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpressRequestInterface } from '../../types/express-request.interface';
import { ChampionshipEntity } from '../../championship/championship.entity';
import { BonusRuleEntity } from '../bonus-rule.entity';
import { UserRole } from '../../user/user-rolle.enum';

@Injectable()
export class BonusAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(BonusRuleEntity)
    private readonly bonusRuleRepository: Repository<BonusRuleEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<ExpressRequestInterface>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin and Superadmin have access to all
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    let championshipId: string | undefined;

    // Try to get championshipId directly from params
    championshipId = request.params.championshipId;

    // If not found, try to get it from bonusRuleId
    if (!championshipId && request.params.id) {
      const bonusRule = await this.bonusRuleRepository.findOne({
        where: { id: request.params.id },
      });

      if (!bonusRule) {
        throw new NotFoundException('Bonus rule not found');
      }

      championshipId = bonusRule.championshipId;
    }

    if (!championshipId) {
      throw new ForbiddenException('Championship ID not found in request');
    }

    // Check if user is the owner of the championship
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    if (championship.createdByUserId !== user.id.toString()) {
      throw new ForbiddenException(
        'Only the championship owner or admin can perform this action',
      );
    }

    return true;
  }
}
