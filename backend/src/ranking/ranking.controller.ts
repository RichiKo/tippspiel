import { Controller, Get, Param } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingEntity } from './ranking.entity';
import { StandingsResponseDto } from './ranking.service';

@Controller()
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('rankings/championship/:championshipId')
  async findByChampionship(
    @Param('championshipId') championshipId: string,
  ): Promise<RankingEntity[]> {
    return this.rankingService.findByChampionship(championshipId);
  }

  @Get('rankings/championship/:championshipId/standings')
  async getStandings(
    @Param('championshipId') championshipId: string,
  ): Promise<StandingsResponseDto> {
    return this.rankingService.findStandingsByChampionship(championshipId);
  }
}
