import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { TipService } from './tip.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { TipEntity } from './tip.entity';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../user/decoratos/user.decorator';
import { UserEntity } from '../user/user.entity';

@Controller()
export class TipController {
  constructor(private readonly tipService: TipService) {}

  @Post('tips')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async create(
    @User() user: UserEntity,
    @Body() createTipDto: CreateTipDto,
  ): Promise<TipEntity> {
    return this.tipService.create(user.id, createTipDto);
  }

  @Put('tips/:id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async update(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTipDto: UpdateTipDto,
  ): Promise<TipEntity> {
    return this.tipService.update(id, user.id, updateTipDto);
  }

  @Get('tips/user/:userId/championship/:championshipId')
  @UseGuards(AuthGuard)
  async findByUserAndChampionship(
    @User() currentUser: UserEntity,
    @Param('userId') userId: string,
    @Param('championshipId') championshipId: string,
  ): Promise<TipEntity[]> {
    const requestedUserId = parseInt(userId, 10);

    if (currentUser.id !== requestedUserId && currentUser.role !== 'admin') {
      return this.tipService.findByUserAndChampionship(
        currentUser.id,
        championshipId,
      );
    }

    return this.tipService.findByUserAndChampionship(
      requestedUserId,
      championshipId,
    );
  }

  @Get('games/:gameId/tips')
  async findByGame(@Param('gameId') gameId: string): Promise<TipEntity[]> {
    return this.tipService.findByGame(gameId);
  }
}
