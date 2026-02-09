import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from './game.entity';
import { RoundEntity } from '../round/round.entity';
import { TeamEntity } from '../team/team.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { UpdateGameResultDto } from './dto/update-game-result.dto';
import { TipService } from '../tip/tip.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(RoundEntity)
    private readonly roundRepository: Repository<RoundEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @Inject(forwardRef(() => TipService))
    private readonly tipService: TipService,
    @Inject(forwardRef(() => RankingService))
    private readonly rankingService: RankingService,
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
      throw new BadRequestException(
        'Home team and away team must be different',
      );
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

  async update(id: string, updateDto: UpdateGameDto): Promise<GameEntity> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: ['round', 'round.championship', 'homeTeam', 'awayTeam'],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    // Validate if teams are being changed
    if (updateDto.homeTeamId || updateDto.awayTeamId) {
      const homeTeamId = updateDto.homeTeamId || game.homeTeamId;
      const awayTeamId = updateDto.awayTeamId || game.awayTeamId;

      // Check if teams are different
      if (homeTeamId === awayTeamId) {
        throw new BadRequestException(
          'Home team and away team must be different',
        );
      }

      // Validate homeTeam exists and belongs to championship
      if (updateDto.homeTeamId) {
        const homeTeam = await this.teamRepository.findOne({
          where: { id: updateDto.homeTeamId },
          relations: ['championships'],
        });

        if (!homeTeam) {
          throw new NotFoundException(
            `Home team with ID ${updateDto.homeTeamId} not found`,
          );
        }

        const belongsToChampionship = homeTeam.championships.some(
          (c) => c.id === game.round.championshipId,
        );

        if (!belongsToChampionship) {
          throw new BadRequestException(
            'Home team does not belong to this championship',
          );
        }

        game.homeTeamId = updateDto.homeTeamId;
      }

      // Validate awayTeam exists and belongs to championship
      if (updateDto.awayTeamId) {
        const awayTeam = await this.teamRepository.findOne({
          where: { id: updateDto.awayTeamId },
          relations: ['championships'],
        });

        if (!awayTeam) {
          throw new NotFoundException(
            `Away team with ID ${updateDto.awayTeamId} not found`,
          );
        }

        const belongsToChampionship = awayTeam.championships.some(
          (c) => c.id === game.round.championshipId,
        );

        if (!belongsToChampionship) {
          throw new BadRequestException(
            'Away team does not belong to this championship',
          );
        }

        game.awayTeamId = updateDto.awayTeamId;
      }
    }

    // Update kickoff time if provided
    if (updateDto.kickoffTime) {
      game.kickoffTime = updateDto.kickoffTime;
    }

    const updatedGame = await this.gameRepository.save(game);

    const result = await this.gameRepository.findOne({
      where: { id: updatedGame.id },
      relations: ['round', 'homeTeam', 'awayTeam'],
    });

    if (!result) {
      throw new NotFoundException('Game not found after update');
    }

    return result;
  }

  async updateResult(
    id: string,
    updateDto: UpdateGameResultDto,
  ): Promise<GameEntity> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: ['round'],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const wasClosedBefore = game.isClosed;

    await this.gameRepository.update(id, updateDto);

    if (updateDto.isClosed === true) {
      if (!wasClosedBefore) {
        await this.tipService.createMissingTipsForGame(
          id,
          game.round.championshipId,
        );
      }

      await this.tipService.evaluateTipsForGame(id);
      await this.rankingService.recalculateForChampionship(
        game.round.championshipId,
      );
    }

    if (updateDto.isClosed === false && wasClosedBefore) {
      await this.tipService.resetTipsForGame(id);
      await this.rankingService.recalculateForChampionship(
        game.round.championshipId,
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const game = await this.findOne(id);
    await this.gameRepository.delete(id);
  }
}
