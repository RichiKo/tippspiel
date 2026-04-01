import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ChampionshipService } from './championship.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../user/decoratos/user.decorator';
import { ChampionshipOwnerGuard } from '../membership/guards/championship-owner.guard';
import { UpdateEliminatedTeamsDto } from './dto/update-eliminated-teams.dto';
import { UpdateSingleEliminatedTeamDto } from './dto/update-single-eliminated-team.dto';
import {
  ChampionshipCardResponseDto,
  ChampionshipDetailResponseDto,
} from './types/championship-response';

@Controller('championships')
export class ChampionshipController {
  constructor(private readonly championshipService: ChampionshipService) {}

  @Get()
  async findAll(
    @User('id') userId: number | null,
  ): Promise<ChampionshipCardResponseDto[]> {
    return this.championshipService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChampionshipDetailResponseDto> {
    return this.championshipService.findOneDetail(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createChampionshipDto: CreateChampionshipDto,
    @User('id') userId: number,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.create(createChampionshipDto, userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateChampionshipDto: UpdateChampionshipDto,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.update(id, updateChampionshipDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  async remove(@Param('id') id: string): Promise<void> {
    return this.championshipService.remove(id);
  }

  @Post(':id/teams/:teamId')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  async addTeam(
    @Param('id') championshipId: string,
    @Param('teamId') teamId: string,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.addTeam(championshipId, teamId);
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  async removeTeam(
    @Param('id') championshipId: string,
    @Param('teamId') teamId: string,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.removeTeam(championshipId, teamId);
  }

  @Get(':id/teams')
  async getTeams(@Param('id') championshipId: string): Promise<TeamEntity[]> {
    return this.championshipService.getTeams(championshipId);
  }

  @Get(':id/eliminated-teams')
  async getEliminatedTeams(@Param('id') championshipId: string): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    return this.championshipService.getEliminatedTeams(championshipId);
  }

  @Patch(':id/eliminated-teams')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  @UsePipes(new ValidationPipe())
  async updateEliminatedTeams(
    @Param('id') championshipId: string,
    @Body() dto: UpdateEliminatedTeamsDto,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    return this.championshipService.updateEliminatedTeams(
      championshipId,
      dto.teamIds,
      dto.isEliminated,
    );
  }

  @Patch(':id/eliminated-teams/:teamId')
  @UseGuards(AuthGuard, ChampionshipOwnerGuard)
  @UsePipes(new ValidationPipe())
  async updateSingleEliminatedTeam(
    @Param('id') championshipId: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateSingleEliminatedTeamDto,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    return this.championshipService.updateSingleEliminatedTeam(
      championshipId,
      teamId,
      dto.isEliminated,
    );
  }
}
