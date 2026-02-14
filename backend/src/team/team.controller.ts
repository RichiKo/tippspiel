import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamEntity } from './team.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { TeamFilterDto } from './dto/team-filter.dto';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() query: TeamFilterDto): Promise<TeamEntity[]> {
    return this.teamService.findAll(query.origin);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TeamEntity> {
    return this.teamService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createTeamDto: CreateTeamDto): Promise<TeamEntity> {
    return this.teamService.create(createTeamDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<TeamEntity> {
    return this.teamService.update(id, updateTeamDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.teamService.remove(id);
  }

  @Post(':id/championships/:championshipId')
  async addToChampionship(
    @Param('id') teamId: string,
    @Param('championshipId') championshipId: string,
  ): Promise<TeamEntity> {
    return this.teamService.addToChampionship(teamId, championshipId);
  }

  @Delete(':id/championships/:championshipId')
  async removeFromChampionship(
    @Param('id') teamId: string,
    @Param('championshipId') championshipId: string,
  ): Promise<TeamEntity> {
    return this.teamService.removeFromChampionship(teamId, championshipId);
  }

  @Get(':id/championships')
  async findChampionships(
    @Param('id') teamId: string,
  ): Promise<ChampionshipEntity[]> {
    return this.teamService.findChampionshipsForTeam(teamId);
  }
}
