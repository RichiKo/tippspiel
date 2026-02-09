import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusRuleEntity } from './bonus-rule.entity';
import { BonusPickEntity } from './bonus-pick.entity';
import { BonusEvaluationEntity } from './bonus-evaluation.entity';
import { BonusService } from './bonus.service';
import { BonusController } from './bonus.controller';
import { BonusAdminGuard } from './guards/bonus-admin.guard';
import { ChampionshipEntity } from '../championship/championship.entity';
import { TeamEntity } from '../team/team.entity';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BonusRuleEntity,
      BonusPickEntity,
      BonusEvaluationEntity,
      ChampionshipEntity,
      TeamEntity,
    ]),
    RankingModule,
  ],
  providers: [BonusService, BonusAdminGuard],
  controllers: [BonusController],
  exports: [BonusService],
})
export class BonusModule {}
