import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingEntity } from './ranking.entity';
import {
  ChampionshipAggregateStatisticsDto,
  StandingsResponseDto,
  UserChampionshipStatisticsDto,
} from './ranking.service';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../user/decoratos/user.decorator';

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

  @Get('rankings/championship/:championshipId/statistics/me')
  @UseGuards(AuthGuard)
  async getMyStatistics(
    @Param('championshipId') championshipId: string,
    @User('id') userId: number,
  ): Promise<UserChampionshipStatisticsDto> {
    return this.rankingService.findUserStatisticsByChampionship(
      championshipId,
      userId,
    );
  }

  @Get('rankings/championship/:championshipId/statistics/championship')
  @UseGuards(AuthGuard)
  async getChampionshipStatistics(
    @Param('championshipId') championshipId: string,
    @User('id') userId: number,
  ): Promise<ChampionshipAggregateStatisticsDto> {
    return this.rankingService.findChampionshipStatisticsByChampionship(
      championshipId,
      userId,
    );
  }

  @Get('rankings/championship/:championshipId/statistics/round')
  @UseGuards(AuthGuard)
  async getRoundStatisticsLegacy(
    @Param('championshipId') championshipId: string,
    @User('id') userId: number,
  ): Promise<ChampionshipAggregateStatisticsDto> {
    return this.rankingService.findChampionshipStatisticsByChampionship(
      championshipId,
      userId,
    );
  }
}
