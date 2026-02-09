import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoundEntity } from './round.entity';
import { ChampionshipEntity } from '../championship/championship.entity';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class RoundService {
  constructor(
    @InjectRepository(RoundEntity)
    private readonly roundRepository: Repository<RoundEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
  ) {}

  async create(
    championshipId: string,
    createDto: CreateRoundDto,
  ): Promise<RoundEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const round = this.roundRepository.create({
      ...createDto,
      championshipId,
    });

    return this.roundRepository.save(round);
  }

  async findAllByChampionship(championshipId: string): Promise<RoundEntity[]> {
    return this.roundRepository.find({
      where: { championshipId },
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RoundEntity> {
    const round = await this.roundRepository.findOne({
      where: { id },
      relations: ['championship', 'games'],
    });

    if (!round) {
      throw new NotFoundException('Round not found');
    }

    return round;
  }

  async update(id: string, updateDto: UpdateRoundDto): Promise<RoundEntity> {
    const round = await this.findOne(id);
    await this.roundRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const round = await this.findOne(id);
    await this.roundRepository.delete(id);
  }
}
