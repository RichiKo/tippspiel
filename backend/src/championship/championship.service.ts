import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@Injectable()
export class ChampionshipService {
  constructor(
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async findAll(): Promise<ChampionshipEntity[]> {
    return this.championshipRepository.find();
  }

  async findOne(id: string): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }
    return championship;
  }

  async create(createDto: CreateChampionshipDto): Promise<ChampionshipEntity> {
    const championship = this.championshipRepository.create(createDto);
    return this.championshipRepository.save(championship);
  }

  async update(
    id: string,
    updateDto: UpdateChampionshipDto,
  ): Promise<ChampionshipEntity> {
    await this.championshipRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.championshipRepository.delete(id);
  }

  async addTeam(
    championshipId: string,
    teamId: string,
  ): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if team is already added
    const teamExists = championship.teams?.some((t) => t.id === teamId);
    if (!teamExists) {
      if (!championship.teams) {
        championship.teams = [];
      }
      championship.teams.push(team);
      await this.championshipRepository.save(championship);
    }

    return this.findOne(championshipId);
  }

  async removeTeam(
    championshipId: string,
    teamId: string,
  ): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    championship.teams = championship.teams?.filter((t) => t.id !== teamId);
    await this.championshipRepository.save(championship);

    return this.findOne(championshipId);
  }

  async getTeams(championshipId: string): Promise<TeamEntity[]> {
    const championship = await this.findOne(championshipId);
    return championship.teams || [];
  }
}
