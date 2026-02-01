import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { ChampionshipService } from './championship.service';
import { ChampionshipController } from './championship.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChampionshipEntity, TeamEntity])],
  controllers: [ChampionshipController],
  providers: [ChampionshipService],
})
export class ChampionshipModule {}
