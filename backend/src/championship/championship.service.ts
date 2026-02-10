import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChampionshipEntity } from './championship.entity';
import { TeamEntity } from '../team/team.entity';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class ChampionshipService {
  constructor(
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
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

  async create(
    createDto: CreateChampionshipDto,
    userId: number,
  ): Promise<ChampionshipEntity> {
    const championship = this.championshipRepository.create({
      ...createDto,
      createdByUserId: userId.toString(),
    });
    const saved = await this.championshipRepository.save(championship);

    // Auto-join owner as ACTIVE member
    await this.membershipService.joinChampionship(userId, saved.id);

    return saved;
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
    championship.eliminatedTeamIds = (
      championship.eliminatedTeamIds || []
    ).filter((id) => id !== teamId);
    await this.championshipRepository.save(championship);

    return this.findOne(championshipId);
  }

  async getTeams(championshipId: string): Promise<TeamEntity[]> {
    const championship = await this.findOne(championshipId);
    return championship.teams || [];
  }

  async getEliminatedTeams(championshipId: string): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    const championship = await this.findOne(championshipId);
    return {
      championshipId,
      eliminatedTeamIds: championship.eliminatedTeamIds || [],
    };
  }

  async updateEliminatedTeams(
    championshipId: string,
    teamIds: string[],
    isEliminated: boolean,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
      relations: ['teams'],
    });
    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const normalizedTeamIds = Array.from(new Set(teamIds));
    const championshipTeamIds = new Set(
      (championship.teams || []).map((team) => team.id),
    );
    const invalidTeamIds = normalizedTeamIds.filter(
      (teamId) => !championshipTeamIds.has(teamId),
    );

    if (invalidTeamIds.length > 0) {
      throw new BadRequestException(
        `Teams are not assigned to this championship: ${invalidTeamIds.join(', ')}`,
      );
    }

    const currentEliminated = new Set(championship.eliminatedTeamIds || []);

    if (isEliminated) {
      normalizedTeamIds.forEach((teamId) => currentEliminated.add(teamId));
    } else {
      normalizedTeamIds.forEach((teamId) => currentEliminated.delete(teamId));
    }

    championship.eliminatedTeamIds = Array.from(currentEliminated);
    await this.championshipRepository.save(championship);

    return {
      championshipId,
      eliminatedTeamIds: championship.eliminatedTeamIds,
    };
  }

  async updateSingleEliminatedTeam(
    championshipId: string,
    teamId: string,
    isEliminated: boolean,
  ): Promise<{
    championshipId: string;
    eliminatedTeamIds: string[];
  }> {
    return this.updateEliminatedTeams(championshipId, [teamId], isEliminated);
  }
}
