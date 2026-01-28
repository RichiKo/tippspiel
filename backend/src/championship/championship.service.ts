import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChampionshipEntity } from './championship.entity';
import { CreateChampionshipDto } from './dto/create-championship.dto';
import { UpdateChampionshipDto } from './dto/update-championship.dto';

@Injectable()
export class ChampionshipService {
  constructor(
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
  ) {}

  async findAll(): Promise<ChampionshipEntity[]> {
    return this.championshipRepository.find();
  }

  async findOne(id: string): Promise<ChampionshipEntity> {
    const championship = await this.championshipRepository.findOne({
      where: { id },
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
}
