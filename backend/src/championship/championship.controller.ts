import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChampionshipService } from './championship.service';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';

@Controller('championships')
export class ChampionshipController {
  constructor(private readonly championshipService: ChampionshipService) {}

  @Get()
  async findAll(): Promise<ChampionshipEntity[]> {
    return this.championshipService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChampionshipEntity> {
    return this.championshipService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createChampionshipDto: CreateChampionshipDto,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.create(createChampionshipDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateChampionshipDto: UpdateChampionshipDto,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.update(id, updateChampionshipDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.championshipService.remove(id);
  }

  @Post(':id/teams/:teamId')
  async addTeam(
    @Param('id') championshipId: string,
    @Param('teamId') teamId: string,
  ): Promise<ChampionshipEntity> {
    return this.championshipService.addTeam(championshipId, teamId);
  }

  @Delete(':id/teams/:teamId')
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
}
