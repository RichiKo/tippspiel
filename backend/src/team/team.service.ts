import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamEntity } from './team.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
  ) {}

  async findAll(): Promise<TeamEntity[]> {
    return this.teamRepository.find({
      relations: ['championships'],
    });
  }

  async findOne(id: string): Promise<TeamEntity> {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ['championships'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async create(createDto: CreateTeamDto): Promise<TeamEntity> {
    const team = this.teamRepository.create(createDto);
    return this.teamRepository.save(team);
  }

  async update(id: string, updateDto: UpdateTeamDto): Promise<TeamEntity> {
    await this.teamRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.teamRepository.delete(id);
  }

  async addToChampionship(
    teamId: string,
    championshipId: string,
  ): Promise<TeamEntity> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['championships'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    // Check if already associated
    const isAlreadyAdded = team.championships.some(
      (c) => c.id === championshipId,
    );
    if (!isAlreadyAdded) {
      team.championships.push(championship);
      await this.teamRepository.save(team);
    }

    return team;
  }

  async removeFromChampionship(
    teamId: string,
    championshipId: string,
  ): Promise<TeamEntity> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['championships'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    team.championships = team.championships.filter(
      (c) => c.id !== championshipId,
    );
    await this.teamRepository.save(team);

    return team;
  }

  async findChampionshipsForTeam(
    teamId: string,
  ): Promise<ChampionshipEntity[]> {
    const team = await this.findOne(teamId);
    return team.championships;
  }
}
