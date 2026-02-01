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
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameResultDto } from './dto/update-game-result.dto';
import { GameEntity } from './game.entity';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('rounds/:roundId/games')
  @UsePipes(new ValidationPipe())
  async create(
    @Param('roundId') roundId: string,
    @Body() createGameDto: CreateGameDto,
  ): Promise<GameEntity> {
    return this.gameService.create(roundId, createGameDto);
  }

  @Get('championships/:championshipId/games')
  async findAllByChampionship(
    @Param('championshipId') championshipId: string,
    @Query('roundId') roundId?: string,
    @Query('isClosed') isClosed?: string,
  ): Promise<GameEntity[]> {
    const filters: { roundId?: string; isClosed?: boolean } = {};

    if (roundId) {
      filters.roundId = roundId;
    }

    if (isClosed !== undefined) {
      filters.isClosed = isClosed === 'true';
    }

    return this.gameService.findAllByChampionship(championshipId, filters);
  }

  @Get('games/:id')
  async findOne(@Param('id') id: string): Promise<GameEntity> {
    return this.gameService.findOne(id);
  }

  @Put('games/:id/result')
  @UsePipes(new ValidationPipe())
  async updateResult(
    @Param('id') id: string,
    @Body() updateGameResultDto: UpdateGameResultDto,
  ): Promise<GameEntity> {
    return this.gameService.updateResult(id, updateGameResultDto);
  }

  @Delete('games/:id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.gameService.remove(id);
  }
}
