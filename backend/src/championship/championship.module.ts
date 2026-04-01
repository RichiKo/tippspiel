import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { ChampionshipService } from './championship.service';
import { ChampionshipController } from './championship.controller';
import { MembershipModule } from '../membership/membership.module';
import { MembershipEntity } from '../membership/membership.entity';
import { RoundEntity } from '../round/round.entity';
import { GameEntity } from '../game/game.entity';
import { TipEntity } from '../tip/tip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChampionshipEntity,
      TeamEntity,
      MembershipEntity,
      RoundEntity,
      GameEntity,
      TipEntity,
    ]),
    forwardRef(() => MembershipModule),
  ],
  controllers: [ChampionshipController],
  providers: [ChampionshipService],
  exports: [ChampionshipService],
})
export class ChampionshipModule {}
