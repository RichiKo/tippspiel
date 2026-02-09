import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingEntity } from './ranking.entity';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { TipEntity } from '../tip/tip.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { MembershipEntity } from '../membership/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RankingEntity,
      TipEntity,
      ChampionshipEntity,
      MembershipEntity,
    ]),
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
