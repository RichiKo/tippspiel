import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoundEntity } from './round.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoundEntity, ChampionshipEntity])],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
