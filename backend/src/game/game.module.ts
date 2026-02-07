import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { RoundEntity } from '../round/round.entity';
import { TeamEntity } from '../team/team.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { TipModule } from '../tip/tip.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity, RoundEntity, TeamEntity]),
    forwardRef(() => TipModule),
    forwardRef(() => RankingModule),
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
