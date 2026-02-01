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
import { RoundService } from './round.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { RoundEntity } from './round.entity';

@Controller()
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @Post('championships/:championshipId/rounds')
  @UsePipes(new ValidationPipe())
  async create(
    @Param('championshipId') championshipId: string,
    @Body() createRoundDto: CreateRoundDto,
  ): Promise<RoundEntity> {
    return this.roundService.create(championshipId, createRoundDto);
  }

  @Get('championships/:championshipId/rounds')
  async findAllByChampionship(
    @Param('championshipId') championshipId: string,
  ): Promise<RoundEntity[]> {
    return this.roundService.findAllByChampionship(championshipId);
  }

  @Get('rounds/:id')
  async findOne(@Param('id') id: string): Promise<RoundEntity> {
    return this.roundService.findOne(id);
  }

  @Put('rounds/:id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateRoundDto: UpdateRoundDto,
  ): Promise<RoundEntity> {
    return this.roundService.update(id, updateRoundDto);
  }

  @Delete('rounds/:id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.roundService.remove(id);
  }
}
