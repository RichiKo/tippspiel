import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from './game.entity';
import { RoundEntity } from '../round/round.entity';
import { TeamEntity } from '../team/team.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameResultDto } from './dto/update-game-result.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(RoundEntity)
    private readonly roundRepository: Repository<RoundEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
  ) {}

  async create(roundId: string, createDto: CreateGameDto): Promise<GameEntity> {
    const round = await this.roundRepository.findOne({
      where: { id: roundId },
      relations: ['championship', 'championship.teams'],
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    // Validate teams exist
    const homeTeam = await this.teamRepository.findOne({
      where: { id: createDto.homeTeamId },
      relations: ['championships'],
    });

    if (!homeTeam) {
      throw new NotFoundException('Home team not found');
    }

    const awayTeam = await this.teamRepository.findOne({
      where: { id: createDto.awayTeamId },
      relations: ['championships'],
    });

    if (!awayTeam) {
      throw new NotFoundException('Away team not found');
    }

    // Validate teams are different
    if (createDto.homeTeamId === createDto.awayTeamId) {
      throw new BadRequestException('Home team and away team must be different');
    }

    // Validate teams belong to the championship
    const homeTeamBelongs = homeTeam.championships.some(
      (c) => c.id === round.championshipId,
    );
    const awayTeamBelongs = awayTeam.championships.some(
      (c) => c.id === round.championshipId,
    );

    if (!homeTeamBelongs) {
      throw new BadRequestException(
        'Home team does not belong to this championship',
      );
    }

    if (!awayTeamBelongs) {
      throw new BadRequestException(
        'Away team does not belong to this championship',
      );
    }

    const game = this.gameRepository.create({
      ...createDto,
      roundId,
    });

    return this.gameRepository.save(game);
  }

  async findAllByChampionship(
    championshipId: string,
    filters?: { roundId?: string; isClosed?: boolean },
  ): Promise<GameEntity[]> {
    const queryBuilder = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.round', 'round')
      .leftJoinAndSelect('game.homeTeam', 'homeTeam')
      .leftJoinAndSelect('game.awayTeam', 'awayTeam')
      .where('round.championshipId = :championshipId', { championshipId });

    if (filters?.roundId) {
      queryBuilder.andWhere('game.roundId = :roundId', {
        roundId: filters.roundId,
      });
    }

    if (filters?.isClosed !== undefined) {
      queryBuilder.andWhere('game.isClosed = :isClosed', {
        isClosed: filters.isClosed,
      });
    }

    return queryBuilder.orderBy('game.kickoffTime', 'ASC').getMany();
  }

  async findAllByRound(roundId: string): Promise<GameEntity[]> {
    return this.gameRepository.find({
      where: { roundId },
      relations: ['homeTeam', 'awayTeam', 'round'],
      order: { kickoffTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<GameEntity> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: ['round', 'homeTeam', 'awayTeam'],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async updateResult(
    id: string,
    updateDto: UpdateGameResultDto,
  ): Promise<GameEntity> {
    const game = await this.findOne(id);
    await this.gameRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const game = await this.findOne(id);
    await this.gameRepository.delete(id);
  }
}
